package com.example.auth.dto.profile;

import com.example.auth.entity.UserStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateStatusRequest(
    @NotNull(message = "상태는 필수입니다")
    UserStatus status
) {}
