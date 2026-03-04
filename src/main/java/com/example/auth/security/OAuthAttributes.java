package com.example.auth.security;

import java.util.Map;

class UserProfile {
    private final String oauthId;
    private final String name;
    private final String email;
    private final String imageUrl;

    private UserProfile(String oauthId, String name, String email, String imageUrl) {
        this.oauthId = oauthId;
        this.name = name;
        this.email = email;
        this.imageUrl = imageUrl;
    }

    public String getOauthId() { return oauthId; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getImageUrl() { return imageUrl; }

    public static UserProfileBuilder builder() {
        return new UserProfileBuilder();
    }

    public static class UserProfileBuilder {
        private String oauthId;
        private String name;
        private String email;
        private String imageUrl;

        public UserProfileBuilder oauthId(String oauthId) { this.oauthId = oauthId; return this; }
        public UserProfileBuilder name(String name) { this.name = name; return this; }
        public UserProfileBuilder email(String email) { this.email = email; return this; }
        public UserProfileBuilder imageUrl(String imageUrl) { this.imageUrl = imageUrl; return this; }

        public UserProfile build() {
            return new UserProfile(oauthId, name, email, imageUrl);
        }
    }
}

class OAuthAttributes {
    public static UserProfile extract(String registrationId, Map<String, Object> attributes) {
        if ("google".equals(registrationId)) {
            return ofGoogle(attributes);
        }
        if ("kakao".equals(registrationId)) {
            return ofKakao(attributes);
        }
        if ("naver".equals(registrationId)) {
            return ofNaver(attributes);
        }
        throw new IllegalArgumentException("Unknown OAuth2 Provider: " + registrationId);
    }

    private static UserProfile ofGoogle(Map<String, Object> attributes) {
        return UserProfile.builder()
                .oauthId(String.valueOf(attributes.get("sub")))
                .email((String) attributes.get("email"))
                .name((String) attributes.get("name"))
                .imageUrl((String) attributes.get("picture"))
                .build();
    }

    @SuppressWarnings("unchecked")
    private static UserProfile ofKakao(Map<String, Object> attributes) {
        Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
        Map<String, Object> profile = kakaoAccount == null
                ? null
                : (Map<String, Object>) kakaoAccount.get("profile");

        String email = kakaoAccount == null ? null : (String) kakaoAccount.get("email");
        String nickname = profile == null ? null : (String) profile.get("nickname");
        String imageUrl = profile == null ? null : (String) profile.get("profile_image_url");

        return UserProfile.builder()
                .oauthId(String.valueOf(attributes.get("id")))
                .email(email)
                .name(nickname)
                .imageUrl(imageUrl)
                .build();
    }

    @SuppressWarnings("unchecked")
    private static UserProfile ofNaver(Map<String, Object> attributes) {
        // NAVER returns user info wrapped in "response" object
        Map<String, Object> response = (Map<String, Object>) attributes.get("response");

        if (response == null) {
            return UserProfile.builder()
                    .oauthId(null)
                    .email(null)
                    .name(null)
                    .imageUrl(null)
                    .build();
        }

        String id = (String) response.get("id");
        String email = (String) response.get("email");
        String name = (String) response.get("name");
        String nickname = (String) response.get("nickname");
        String profileImage = (String) response.get("profile_image");

        return UserProfile.builder()
                .oauthId(id)
                .email(email)
                .name(name != null ? name : nickname)
                .imageUrl(profileImage)
                .build();
    }
}
