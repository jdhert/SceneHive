package com.example.auth.exception;

import java.time.LocalDateTime;

/**
 * 에러 응답 DTO (Record)
 *
 * 변경점:
 * - 기존: ErrorResponse.builder().timestamp(...).status(...).build()
 * - Record: ErrorResponse.of(...) 또는 new ErrorResponse(...)
 */
public record ErrorResponse(
    LocalDateTime timestamp,
    int status,
    String error,
    String message,
    String path
) {
    /**
     * 에러 응답 생성
     */
    public static ErrorResponse of(int status, String error, String message, String path) {
        return new ErrorResponse(LocalDateTime.now(), status, error, message, path);
    }
}
