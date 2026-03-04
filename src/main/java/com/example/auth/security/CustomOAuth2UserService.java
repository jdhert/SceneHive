package com.example.auth.security;

import com.example.auth.entity.Role;
import com.example.auth.entity.User;
import com.example.auth.entity.AuthProvider;
import com.example.auth.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final UserRepository userRepository;

    public CustomOAuth2UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2UserService<OAuth2UserRequest, OAuth2User> delegate = new DefaultOAuth2UserService();
        OAuth2User oAuth2User = delegate.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        String userNameAttributeName = userRequest.getClientRegistration().getProviderDetails()
                .getUserInfoEndpoint().getUserNameAttributeName();
        AuthProvider authProvider = AuthProvider.fromRegistrationId(registrationId);

        Map<String, Object> attributes = oAuth2User.getAttributes();
        UserProfile userProfile = OAuthAttributes.extract(registrationId, attributes);

        if (userProfile.getEmail() == null || userProfile.getEmail().isBlank()) {
            OAuth2Error error = new OAuth2Error("email_required", "Email consent is required", null);
            throw new OAuth2AuthenticationException(error, "Email consent is required");
        }

        User user = saveOrUpdateUser(userProfile, authProvider);

        Map<String, Object> normalizedAttributes = new HashMap<>(attributes);
        normalizedAttributes.put("email", userProfile.getEmail());

        return new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority(user.getRole().name())),
                normalizedAttributes,
                userNameAttributeName
        );
    }

    private User saveOrUpdateUser(UserProfile userProfile, AuthProvider authProvider) {
        Optional<User> userOptional = userRepository.findByEmail(userProfile.getEmail());
        User user;

        if (userOptional.isPresent()) {
            user = userOptional.get();
            user.setName(userProfile.getName());
            user.setProfilePictureUrl(userProfile.getImageUrl());
            user.setProvider(authProvider);
            user.setProviderUserId(userProfile.getOauthId());
        } else {
            user = User.builder()
                    .name(userProfile.getName())
                    .email(userProfile.getEmail())
                    .password(UUID.randomUUID().toString())
                    .role(Role.USER)
                    .isVerified(true) // Social login users are verified
                    .profilePictureUrl(userProfile.getImageUrl())
                    .provider(authProvider)
                    .providerUserId(userProfile.getOauthId())
                    .build();
        }

        return userRepository.save(user);
    }
}
