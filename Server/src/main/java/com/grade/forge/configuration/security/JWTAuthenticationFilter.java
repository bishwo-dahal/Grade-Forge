package com.grade.forge.configuration.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@AllArgsConstructor
@Component
public class JWTAuthenticationFilter extends OncePerRequestFilter {

    private JWTHelper jwtHelper;
    private UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {


//        client sends request with header authorization it contains all the header details
        String authorizationHeader = request.getHeader("Authorization");


        String username = null;
        String token = null;

        if(authorizationHeader != null && authorizationHeader.toLowerCase().startsWith("bearer ")){
            try{
//                Get only token by trimming    Extract the token by removing the "Bearer " prefix
                token = authorizationHeader.substring(7);

                // Extract username from the token
                username = jwtHelper.getUserNameFromToken(token);

                // If username is extracted and no authentication is currently set in SecurityContext
                if(username != null && SecurityContextHolder.getContext().getAuthentication() == null){

//                    Load userDetails from username loadByUsername
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                    if(jwtHelper.isTokenValid(token,userDetails)){
                        Claims claims = jwtHelper.getClaims(token);
                        List<String> authorities = (List<String>) claims.get("authorities");
                        List<GrantedAuthority> grantedAuthorities = authorities.stream()
                                .map(SimpleGrantedAuthority::new)
                                .collect(Collectors.toList());
                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(userDetails,null,grantedAuthorities);
                        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                }

            }
            catch (IllegalArgumentException ex){
                System.out.println(ex.getMessage());
            }
            catch (Exception ex ){
                System.out.println(ex.getMessage());
            }

        }
        else{

        }

        filterChain.doFilter(request,response);

    }

}
