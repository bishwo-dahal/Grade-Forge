package com.grade.forge.auth;

/**
 * AUTH MODULE - Grade Forge
 *
 * This module handles authentication and authorization for the Grade Forge application.
 *
 * ============================================
 * DUMMY TEST CREDENTIALS
 * ============================================
 *
 * 1. STUDENT USER
 *    Email: student@example.com
 *    Password: password123
 *    Role: STUDENT
 *
 * 2. FACULTY USER
 *    Email: faculty@example.com
 *    Password: password123
 *    Role: FACULTY
 *
 * 3. ADMIN USER
 *    Email: admin@example.com
 *    Password: password123
 *    Role: UNIVERSITY_ADMIN
 *
 * ============================================
 * API ENDPOINTS
 * ============================================
 *
 * Base URL: /api/v1/auth
 *
 * 1. LOGIN
 *    POST /api/v1/auth/login
 *    Body: {
 *      "email": "student@example.com",
 *      "password": "password123"
 *    }
 *    Response: {
 *      "token": "JWT_TOKEN",
 *      "userId": "uuid",
 *      "email": "student@example.com",
 *      "name": "John Student",
 *      "role": "STUDENT",
 *      "message": "Login successful"
 *    }
 *
 * 2. SIGNUP
 *    POST /api/v1/auth/signup
 *    Body: {
 *      "name": "New User",
 *      "email": "newuser@example.com",
 *      "password": "password123",
 *      "role": "STUDENT"
 *    }
 *    Response: Same as login response
 *
 * 3. UPDATE PASSWORD
 *    POST /api/v1/auth/update-password
 *    Body: {
 *      "userId": "user-uuid",
 *      "oldPassword": "password123",
 *      "newPassword": "newpassword123"
 *    }
 *    Response: Updated AuthResponse with new token
 *
 * 4. RESET PASSWORD
 *    POST /api/v1/auth/reset-password
 *    Body: {
 *      "email": "student@example.com",
 *      "resetToken": "token",
 *      "newPassword": "newpassword123"
 *    }
 *    Response: Updated AuthResponse with new token
 *
 * 5. GET USER BY ID
 *    GET /api/v1/auth/user/{userId}
 *    Response: {
 *      "id": "uuid",
 *      "name": "John Student",
 *      "email": "student@example.com",
 *      "password": "hashed_password",
 *      "role": "STUDENT"
 *    }
 *
 * 6. GET USER BY EMAIL
 *    GET /api/v1/auth/user/email/{email}
 *    Response: Same as above
 *
 * ============================================
 * TESTING FLOW
 * ============================================
 *
 * 1. Start the application - dummy users will be auto-created
 * 2. Use LOGIN endpoint with student@example.com / password123
 * 3. Copy the returned JWT token
 * 4. Use token in Authorization header for other API calls:
 *    Header: Authorization: Bearer {JWT_TOKEN}
 * 5. Test other endpoints with the token
 *
 * ============================================
 */
public class AuthModuleDocumentation {
}

