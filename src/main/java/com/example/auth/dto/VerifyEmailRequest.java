package com.example.auth.dto;

public record VerifyEmailRequest(String email, String code) {
}
