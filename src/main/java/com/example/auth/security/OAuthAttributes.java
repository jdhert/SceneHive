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
}
