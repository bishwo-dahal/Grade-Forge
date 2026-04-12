package com.grade.forge.configuration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.ProfileCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

@Configuration
public class S3Config {

    @Value("${cloud.aws.credential.accessKey}")
    private String AWS_ACCESS_KEY;
    
    @Value("${cloud.aws.credential.secretKey}")
    private String AWS_SECRET_KEY;
    
    @Bean
    public S3Presigner s3Presigner() {

        AwsBasicCredentials credentials = AwsBasicCredentials.create(
                AWS_ACCESS_KEY,
                AWS_SECRET_KEY
        );

        return S3Presigner.builder()
                .region(Region.US_EAST_2)
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .build();
    }
}