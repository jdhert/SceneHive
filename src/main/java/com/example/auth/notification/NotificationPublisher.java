package com.example.auth.notification;

import com.example.auth.dto.notification.CreateNotificationRequest;
import com.example.auth.dto.notification.NotificationResponse;

public interface NotificationPublisher {

    NotificationResponse publish(CreateNotificationRequest request);
}
