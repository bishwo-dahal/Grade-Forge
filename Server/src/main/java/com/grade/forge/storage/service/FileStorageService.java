package com.grade.forge.storage.service;

import com.grade.forge.exceptionhandler.IncorrectFileException;
import com.grade.forge.assignment.entity.Assignment;
import com.grade.forge.assignment.repository.AssignmentRepository;
import com.grade.forge.programminglanguage.entity.ProgrammingLanguage;
import com.grade.forge.submission.entity.Submission;
import com.grade.forge.submission.entity.SubmissionFile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
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
    private final AssignmentRepository assignmentRepository;
    private final S3PresignedUrl s3PresignedUrl;

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

        if (originalName == null) {
            throw new IncorrectFileException("Incorrect File Type");
        }

        String lower = originalName.toLowerCase();
        int dotIndex = lower.lastIndexOf('.');
        String ext = dotIndex >= 0 ? lower.substring(dotIndex) : "";

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IncorrectFileException("Assignment not found for file upload."));
        ProgrammingLanguage language = assignment.getProgrammingLanguage();

        boolean allowedByLanguage = false;
        if (language != null && language.getAllowedExtensions() != null && !language.getAllowedExtensions().isBlank()) {
            String[] parts = language.getAllowedExtensions().split(",");
            for (String part : parts) {
                String trimmed = part.trim().toLowerCase();
                if (!trimmed.isEmpty() && trimmed.equals(ext)) {
                    allowedByLanguage = true;
                    break;
                }
            }
        }

        boolean isTextOrCsv = ".txt".equals(ext) || ".csv".equals(ext);
        if (!allowedByLanguage && !isTextOrCsv) {
            throw new IncorrectFileException("Incorrect File Type");
        }

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


    public String generatePresignedDownloadUrl(String key, String originalFilename) {
        String url = s3PresignedUrl.generateDownloadUrl(bucketName, key,originalFilename);
        log.info("Presign key: [{}]", key);
        log.info("Generated presigned URL: {}", url);
        return url;
    }

    /**
     * Download file content from S3 (for test runner to execute submission).
     */
    public byte[] getFileContent(String key) throws IOException {
        GetObjectRequest getRequest = GetObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build();
        try (ResponseInputStream<GetObjectResponse> response = getClient().getObject(getRequest)) {
            return response.readAllBytes();
        }
    }
}
