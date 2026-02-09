package com.example.auth.dto.profile;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
    @Size(max = 50, message = "이름은 50자 이하여야 합니다")
    String name,

    @Size(max = 500, message = "자기소개는 500자 이하여야 합니다")
    String bio,

    @Size(max = 100, message = "직책은 100자 이하여야 합니다")
    String jobTitle,

    @Size(max = 100, message = "회사명은 100자 이하여야 합니다")
    String company
) {}
