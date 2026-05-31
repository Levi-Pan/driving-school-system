package com.example.drivingschool.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.nio.file.Paths;

@Component
public class StorageProperties {
    private final Path uploadDir;

    public StorageProperties(@Value("${app.upload-dir:uploads}") String uploadDir) {
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    public Path getUploadDir() {
        return uploadDir;
    }

    public Path getMaterialDir() {
        return uploadDir.resolve("materials").normalize();
    }
}
