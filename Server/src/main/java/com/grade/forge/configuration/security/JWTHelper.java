package com.grade.forge.configuration.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Component
public class JWTHelper {

    public static final int validity = 100 *  60 * 1000; // 1 hr validate
    private final String secret_key = "yourSuperSecretKeyForHS512AlgorithmWhichMustBeAtLeast64BytesLongAndSecure";

    private Key key;

    @PostConstruct
    public void init(){
        this.key= Keys.hmacShaKeyFor(secret_key.getBytes(StandardCharsets.UTF_8));
    }


    public String generateToken(UserDetails userDetails){
        Map<String, Object> claims = new HashMap<>();
        claims.put("authorities", userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList()));
        return Jwts.builder()
                .claims(claims)
                .subject(userDetails.getUsername())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis()+ validity))
                .signWith(key)
                .compact();
    }

    public String getUserNameFromToken(String token){
        return getClaims(token).getSubject();
    }

    public boolean isTokenValid(String token,UserDetails userDetails){
        String username = getUserNameFromToken(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token){
        return getClaims(token).getExpiration().before(new Date());
    }


    //    This method parses a JWT and extracts claims (data inside the token):
    public Claims getClaims(String token){
        return Jwts.parser()
                .verifyWith((SecretKey) key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }



}
