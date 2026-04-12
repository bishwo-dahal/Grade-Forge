package com.grade.forge.configuration.security;

import com.grade.forge.user.entity.Users;
import com.grade.forge.exceptionhandler.ResourceNotFoundException;
import com.grade.forge.user.repository.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@AllArgsConstructor
@Service
public class CustomUserService implements UserDetailsService {

    private UserRepository userRepo;


    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Users user = userRepo.findByEmail(email).orElseThrow(()-> new ResourceNotFoundException("No User Found with this Email"));

        CustomUserDetails customUserDetails = new CustomUserDetails(user);
        return customUserDetails;
    }
}
