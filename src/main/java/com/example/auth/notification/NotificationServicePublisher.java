package com.example.auth.notification;

import com.example.auth.dto.notification.CreateNotificationRequest;
import com.example.auth.dto.notification.NotificationResponse;
import com.example.auth.service.NotificationService;
import org.springframework.stereotype.Component;

@Component
public class NotificationServicePublisher implements NotificationPublisher {

    private final NotificationService notificationService;

    public NotificationServicePublisher(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @Override
    public NotificationResponse publish(CreateNotificationRequest request) {
        return notificationService.createAndSend(request);
    }
}
