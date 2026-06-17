package com.example.drivingschool.storage;

import com.example.drivingschool.config.StorageProperties;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;
import java.util.UUID;

/**
 * 材料文件存储服务：上传时校验图片类型并生成唯一文件名，按配置自动选择本地目录或 S3（对象存储）保存；读取时按 key 还原文件内容。
 */
@Service
public class MaterialStorageService {
    private final StorageProperties storageProperties;
    private final S3Client s3Client;
    private final String bucketName;

    public MaterialStorageService(
            StorageProperties storageProperties,
            @Value("${app.bucket.name:}") String bucketName,
            @Value("${app.bucket.access-key:}") String accessKey,
            @Value("${app.bucket.secret-key:}") String secretKey,
            @Value("${app.bucket.region:us-east-1}") String region,
            @Value("${app.bucket.endpoint:}") String endpoint,
            @Value("${app.bucket.path-style:false}") boolean pathStyle
    ) {
        this.storageProperties = storageProperties;
        this.bucketName = trim(bucketName);
        if (!this.bucketName.isBlank() && !trim(accessKey).isBlank() && !trim(secretKey).isBlank() && !trim(endpoint).isBlank()) {
            this.s3Client = S3Client.builder()
                    .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create(trim(accessKey), trim(secretKey))))
                    .endpointOverride(URI.create(trim(endpoint)))
                    .region(Region.of(trim(region).isBlank() ? "us-east-1" : trim(region)))
                    .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(pathStyle).build())
                    .build();
        } else {
            this.s3Client = null;
        }
    }

    public StoredMaterial save(MultipartFile file) throws IOException {
        validateImage(file);
        String original = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        String extension = extensionOf(original, file.getContentType());
        String filename = UUID.randomUUID() + extension;
        if (isBucketEnabled()) {
            String key = "materials/" + filename;
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucketName)
                            .key(key)
                            .contentType(file.getContentType())
                            .build(),
                    RequestBody.fromBytes(file.getBytes())
            );
            return new StoredMaterial(displayName(original, filename), "/api/materials/file?key=" + encode(key));
        }

        Path dir = storageProperties.getMaterialDir();
        Files.createDirectories(dir);
        file.transferTo(dir.resolve(filename).normalize());
        return new StoredMaterial(displayName(original, filename), "/uploads/materials/" + filename);
    }

    public MaterialResource load(String key) throws IOException {
        if (key == null || key.isBlank()) {
            throw new IllegalArgumentException("缺少图片地址");
        }
        String normalizedKey = normalizeKey(key);
        if (isBucketEnabled() && normalizedKey.startsWith("materials/")) {
            ResponseBytes<GetObjectResponse> object = s3Client.getObjectAsBytes(GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(normalizedKey)
                    .build());
            String contentType = object.response().contentType();
            return new MaterialResource(object.asByteArray(), contentType == null ? MediaType.APPLICATION_OCTET_STREAM_VALUE : contentType);
        }

        String filename = normalizedKey.replaceFirst("^materials/", "");
        Path target = storageProperties.getMaterialDir().resolve(filename).normalize();
        if (!target.startsWith(storageProperties.getMaterialDir())) {
            throw new IllegalArgumentException("图片地址无效");
        }
        return new MaterialResource(Files.readAllBytes(target), Files.probeContentType(target));
    }

    private boolean isBucketEnabled() {
        return s3Client != null;
    }

    private void validateImage(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("请选择要上传的图片");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("只能上传图片文件");
        }
    }

    private String extensionOf(String filename, String contentType) {
        int dot = filename.lastIndexOf('.');
        if (dot >= 0 && dot < filename.length() - 1) {
            String extension = filename.substring(dot).toLowerCase();
            if (Set.of(".jpg", ".jpeg", ".png", ".gif", ".webp").contains(extension)) {
                return extension;
            }
        }
        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/gif" -> ".gif";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
    }

    private String displayName(String original, String fallback) {
        return original.isBlank() ? fallback : original;
    }

    private String normalizeKey(String key) {
        if (key.startsWith("/uploads/materials/")) {
            return "materials/" + key.substring("/uploads/materials/".length());
        }
        if (key.startsWith("uploads/materials/")) {
            return "materials/" + key.substring("uploads/materials/".length());
        }
        return key;
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String trim(String value) {
        return value == null ? "" : value.trim();
    }
}
