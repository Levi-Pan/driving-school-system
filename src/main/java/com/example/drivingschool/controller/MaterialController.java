package com.example.drivingschool.controller;

import com.example.drivingschool.storage.MaterialResource;
import com.example.drivingschool.storage.MaterialStorageService;
import com.example.drivingschool.storage.StoredMaterial;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * 材料文件控制器：报名照片、证件等文件的上传与读取（本地/S3 存储）。
 */
@RestController
@RequestMapping("/api")
public class MaterialController {
    private final MaterialStorageService materialStorageService;

    public MaterialController(MaterialStorageService materialStorageService) {
        this.materialStorageService = materialStorageService;
    }

    @PostMapping("/materials/upload")
    public Map<String, String> uploadMaterial(@RequestParam("file") MultipartFile file) throws IOException {
        StoredMaterial material = materialStorageService.save(file);
        return Map.of(
                "fileName", material.fileName(),
                "url", material.url()
        );
    }

    @GetMapping("/materials/file")
    public ResponseEntity<byte[]> materialFile(@RequestParam("key") String key) throws IOException {
        MaterialResource resource = materialStorageService.load(key);
        String contentType = resource.contentType() == null ? MediaType.APPLICATION_OCTET_STREAM_VALUE : resource.contentType();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .cacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePublic())
                .body(resource.content());
    }
}
