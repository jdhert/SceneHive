package com.example.auth.notification;

import com.example.auth.notification.contract.NotificationCommand;

public interface NotificationCommandPublisher {

    void publish(NotificationCommand command);
}
