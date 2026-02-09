package com.example.auth.service;

import com.example.auth.dto.profile.ProfileResponse;
import com.example.auth.dto.profile.PublicProfileResponse;
import com.example.auth.dto.profile.UpdateProfileRequest;
import com.example.auth.dto.profile.UpdateStatusRequest;
import com.example.auth.entity.User;
import com.example.auth.entity.UserStatus;
import com.example.auth.exception.CustomException;
import com.example.auth.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));
        return ProfileResponse.from(user);
    }

    @Transactional(readOnly = true)
    public PublicProfileResponse getPublicProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));
        return PublicProfileResponse.from(user);
    }

    @Transactional
    public ProfileResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        if (request.name() != null && !request.name().isBlank()) {
            user.setName(request.name());
        }
        if (request.bio() != null) {
            user.setBio(request.bio());
        }
        if (request.jobTitle() != null) {
            user.setJobTitle(request.jobTitle());
        }
        if (request.company() != null) {
            user.setCompany(request.company());
        }

        User updatedUser = userRepository.save(user);
        return ProfileResponse.from(updatedUser);
    }

    @Transactional
    public ProfileResponse updateStatus(String email, UpdateStatusRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        user.setStatus(request.status());
        user.setLastSeenAt(LocalDateTime.now());

        User updatedUser = userRepository.save(user);
        return ProfileResponse.from(updatedUser);
    }

    @Transactional
    public ProfileResponse updateProfilePicture(String email, String pictureUrl) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        user.setProfilePictureUrl(pictureUrl);

        User updatedUser = userRepository.save(user);
        return ProfileResponse.from(updatedUser);
    }

    @Transactional
    public ProfileResponse deleteProfilePicture(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new CustomException("사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND));

        user.setProfilePictureUrl(null);

        User updatedUser = userRepository.save(user);
        return ProfileResponse.from(updatedUser);
    }

    @Transactional
    public void updateLastSeen(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null) {
            user.setLastSeenAt(LocalDateTime.now());
            if (user.getStatus() == UserStatus.OFFLINE) {
                user.setStatus(UserStatus.ONLINE);
            }
            userRepository.save(user);
        }
    }
}
