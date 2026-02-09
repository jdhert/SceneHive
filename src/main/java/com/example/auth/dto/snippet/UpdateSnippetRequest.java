package com.example.auth.dto.snippet;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateSnippetRequest(
    @NotBlank(message = "제목은 필수입니다")
    @Size(max = 200, message = "제목은 200자 이하여야 합니다")
    String title,

    @NotBlank(message = "코드는 필수입니다")
    String code,

    @NotBlank(message = "언어는 필수입니다")
    @Size(max = 50, message = "언어는 50자 이하여야 합니다")
    String language,

    @Size(max = 500, message = "설명은 500자 이하여야 합니다")
    String description
) {}
