package com.example.auth.event;

public record VerificationEmailRequestedEvent(
        Long userId,
        String email
) {
}
