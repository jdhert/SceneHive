package com.example.auth.notification;

public interface NotificationCommandPublisher {

    void publish(NotificationCommand command);
}
