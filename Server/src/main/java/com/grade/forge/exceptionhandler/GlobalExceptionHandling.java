package com.grade.forge.exceptionhandler;


import com.grade.forge.exceptionhandler.dto.ErrorResponseDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.InvalidDataAccessApiUsageException;
import org.springframework.dao.InvalidDataAccessResourceUsageException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandling {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponseDto> handleResourceNotFoundException(ResourceNotFoundException exception){
        log.error(exception.getMessage(), exception);
        ErrorResponseDto errorResponse= new ErrorResponseDto(exception.getMessage(),400,false);
        return  new ResponseEntity<>(errorResponse,HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(IncorrectFileException.class)
    public ResponseEntity<ErrorResponseDto> handleIncorrectFileException(IncorrectFileException exception){
        ErrorResponseDto errorResponse= new ErrorResponseDto(exception.getMessage(),400,false);
        return  new ResponseEntity<>(errorResponse,HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponseDto> handleDataIntegrityViolationException(
            DataIntegrityViolationException exception) {

        log.error(exception.getMessage(), exception);

        String message = "Operation failed due to related data.";

        Throwable cause = exception.getCause();

        while (cause != null) {
            if (cause instanceof org.hibernate.exception.ConstraintViolationException cve) {

                String constraint = cve.getConstraintName();

                // Customize message based on constraint
                if ("fks423933n1d9qpyi3oqxyq4bvi".equals(constraint)) {
                    message = "Cannot delete group because it is linked to assignments.";
                } else {
                    message = "Database constraint violation.";
                }
                break;
            }
            cause = cause.getCause();
        }

        ErrorResponseDto errorResponse =
                new ErrorResponseDto(message, 400, false);

        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }



    @ExceptionHandler(InvalidDataAccessResourceUsageException.class)
    public ResponseEntity<ErrorResponseDto> handleInvalidDataAccessResourceUsageException(InvalidDataAccessResourceUsageException exception){
        log.error(exception.getMessage(), exception);
        ErrorResponseDto errorResponse= new ErrorResponseDto("Invalid Request",400,false);
        return  new ResponseEntity<>(errorResponse,HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(InvalidDataAccessApiUsageException.class)
    public ResponseEntity<ErrorResponseDto> handleInvalidDataAccessApiUsageException(InvalidDataAccessApiUsageException exception){
        log.error(exception.getMessage(), exception);
        ErrorResponseDto errorResponse= new ErrorResponseDto("Invalid Request",400,false);
        return  new ResponseEntity<>(errorResponse,HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponseDto> Exception(Exception exception){
        log.error(exception.getMessage(), exception);
        ErrorResponseDto errorResponse = new ErrorResponseDto(exception.getMessage(), 400,false);
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
}
