package com.example.auth.service;

import com.example.auth.config.FileStorageConfig;
import com.example.auth.exception.CustomException;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileStorageService {

    private final FileStorageConfig config;

    public FileStorageService(FileStorageConfig config) {
        this.config = config;
    }

    public String storeAvatar(MultipartFile file, Long userId) {
        validateFile(file);

        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        String newFilename = userId + "_" + UUID.randomUUID().toString().substring(0, 8) + extension;

        try {
            Path targetPath = Paths.get(config.getAvatarPath(), newFilename);

            // Resize and save the image (200x200)
            Thumbnails.of(file.getInputStream())
                    .size(200, 200)
                    .keepAspectRatio(true)
                    .outputQuality(0.9)
                    .toFile(targetPath.toFile());

            return "/uploads/" + config.getAvatarDir() + "/" + newFilename;

        } catch (IOException e) {
            throw new CustomException("파일 저장에 실패했습니다: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public void deleteAvatar(String avatarUrl) {
        if (avatarUrl == null || avatarUrl.isBlank()) {
            return;
        }

        try {
            // Extract filename from URL: /uploads/avatars/filename.jpg -> filename.jpg
            String filename = avatarUrl.substring(avatarUrl.lastIndexOf("/") + 1);
            Path filePath = Paths.get(config.getAvatarPath(), filename);

            if (Files.exists(filePath)) {
                Files.delete(filePath);
            }
        } catch (IOException e) {
            // Log error but don't throw - file deletion failure shouldn't block the operation
            System.err.println("Failed to delete avatar file: " + e.getMessage());
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new CustomException("파일이 비어있습니다", HttpStatus.BAD_REQUEST);
        }

        if (file.getSize() > config.getMaxAvatarSize()) {
            throw new CustomException("파일 크기가 너무 큽니다 (최대 5MB)", HttpStatus.BAD_REQUEST);
        }

        String contentType = file.getContentType();
        if (contentType == null || !config.getAllowedTypes().contains(contentType)) {
            throw new CustomException("허용되지 않는 파일 형식입니다 (JPEG, PNG, GIF, WebP만 가능)", HttpStatus.BAD_REQUEST);
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return ".jpg";
        }
        return filename.substring(filename.lastIndexOf("."));
    }
}
