package com.grade.forge.storage.service;

import com.grade.forge.submission.entity.Submission;
import com.grade.forge.submission.entity.SubmissionFile;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    @Value("${cloud.aws.s3.bucketName}")
    private String bucketName;

    @Value("${cloud.aws.region}")
    private String region;

    @Value("${cloud.aws.credential.accessKey}")
    private String accessKey;

    @Value("${cloud.aws.credential.secretKey}")
    private String secretKey;

    private S3Client s3Client;

    private S3Client getClient() {
        if (s3Client == null) {
            s3Client = S3Client.builder()
                    .region(Region.of(region))
                    .credentialsProvider(StaticCredentialsProvider.create(
                            AwsBasicCredentials.create(accessKey, secretKey)))
                    .build();
        }
        return s3Client;
    }

    public List<SubmissionFile> uploadSubmissionFiles(Submission submission,
                                                      Long studentId,
                                                      Long courseId,
                                                      Long assignmentId,
                                                      List<MultipartFile> files) {
        return files.stream()
                .map(file -> uploadSingleFile(submission, studentId, courseId, assignmentId, file))
                .collect(Collectors.toList());
    }

    private SubmissionFile uploadSingleFile(Submission submission,
                                            Long studentId,
                                            Long courseId,
                                            Long assignmentId,
                                            MultipartFile multipartFile) {
        String fileId = UUID.randomUUID().toString();
        String originalName = multipartFile.getOriginalFilename();
        String key = String.format("uploads/student/%d/course/%d/assignment/%d/file/%s-%s",
                studentId, courseId, assignmentId, fileId, originalName);

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .contentType(multipartFile.getContentType())
                .build();

        try {
            getClient().putObject(putObjectRequest,
                    RequestBody.fromInputStream(multipartFile.getInputStream(), multipartFile.getSize()));
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file to S3", e);
        }

        SubmissionFile file = new SubmissionFile();
        file.setSubmission(submission);
        file.setFileName(originalName);
        file.setFileKey(key);
        file.setFileType(multipartFile.getContentType());
        file.setFileSize(multipartFile.getSize());
        return file;
    }

    public String buildFileUrl(String key) {
        return String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, region, key);
    }
}
