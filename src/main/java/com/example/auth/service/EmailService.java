package com.example.auth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender javaMailSender;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    public void sendVerificationEmail(String to, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("회원가입 인증 코드");
        message.setText("인증 코드: " + code);
        javaMailSender.send(message);
    }

    public void sendAccountUnlockEmail(String to, String token) {
        String unlockLink = frontendUrl + "/unlock-account?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("계정 잠금 해제");
        message.setText(
            "로그인 시도가 여러 번 실패하여 계정이 잠겼습니다.\n\n" +
            "아래 링크를 클릭하여 계정 잠금을 해제해주세요:\n" +
            unlockLink + "\n\n" +
            "이 링크는 1시간 후 만료됩니다.\n\n" +
            "만약 본인이 시도한 것이 아니라면, 비밀번호를 즉시 변경해주세요."
        );
        javaMailSender.send(message);
    }

    public void sendPasswordResetEmail(String to, String token) {
        String resetLink = frontendUrl + "/reset-password?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("비밀번호 재설정");
        message.setText(
            "비밀번호 재설정을 요청하셨습니다.\n\n" +
            "아래 링크를 클릭하여 새 비밀번호를 설정해주세요:\n" +
            resetLink + "\n\n" +
            "이 링크는 15분 후 만료됩니다.\n\n" +
            "만약 비밀번호 재설정을 요청하지 않으셨다면, 이 이메일을 무시해주세요."
        );
        javaMailSender.send(message);
    }
}
