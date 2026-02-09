package com.example.auth.service.mail;

public class MailTask {

    private MailType type;
    private String to;
    private String payload;
    private int attempt;

    public MailTask() {
    }

    public MailTask(MailType type, String to, String payload, int attempt) {
        this.type = type;
        this.to = to;
        this.payload = payload;
        this.attempt = attempt;
    }

    public static MailTask verification(String to, String code) {
        return new MailTask(MailType.VERIFICATION, to, code, 0);
    }

    public static MailTask accountUnlock(String to, String token) {
        return new MailTask(MailType.ACCOUNT_UNLOCK, to, token, 0);
    }

    public static MailTask passwordReset(String to, String token) {
        return new MailTask(MailType.PASSWORD_RESET, to, token, 0);
    }

    public MailType getType() {
        return type;
    }

    public void setType(MailType type) {
        this.type = type;
    }

    public String getTo() {
        return to;
    }

    public void setTo(String to) {
        this.to = to;
    }

    public String getPayload() {
        return payload;
    }

    public void setPayload(String payload) {
        this.payload = payload;
    }

    public int getAttempt() {
        return attempt;
    }

    public void setAttempt(int attempt) {
        this.attempt = attempt;
    }
}
