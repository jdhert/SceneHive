package com.example.auth.identity;

import com.example.auth.entity.User;

import java.util.Optional;

public interface IdentityReader {

    User requireUserByEmail(String email);

    Optional<User> findUserByEmail(String email);
}
