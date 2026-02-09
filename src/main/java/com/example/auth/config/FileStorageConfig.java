package com.example.auth.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;

@Configuration
public class FileStorageConfig implements WebMvcConfigurer {

    @Value("${app.file-storage.upload-dir:./uploads}")
    private String uploadDir;

    @Value("${app.file-storage.avatar-dir:avatars}")
    private String avatarDir;

    @Value("${app.file-storage.allowed-types:image/jpeg,image/png,image/gif,image/webp}")
    private String allowedTypes;

    @Value("${app.file-storage.max-avatar-size:5242880}")
    private long maxAvatarSize;

    @PostConstruct
    public void init() throws IOException {
        Path uploadPath = Paths.get(uploadDir, avatarDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String absolutePath = Paths.get(uploadDir).toAbsolutePath().toString();
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + absolutePath + "/");
    }

    public String getUploadDir() {
        return uploadDir;
    }

    public String getAvatarDir() {
        return avatarDir;
    }

    public String getAvatarPath() {
        return Paths.get(uploadDir, avatarDir).toString();
    }

    public List<String> getAllowedTypes() {
        return Arrays.asList(allowedTypes.split(","));
    }

    public long getMaxAvatarSize() {
        return maxAvatarSize;
    }
}
