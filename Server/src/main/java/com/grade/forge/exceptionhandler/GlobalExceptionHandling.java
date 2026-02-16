package com.grade.forge.exceptionhandler;


import com.grade.forge.exceptionhandler.dto.ErrorResponseDto;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandling {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponseDto> handleResourceNotFoundException(ResourceNotFoundException exception){
        ErrorResponseDto errorResponse= new ErrorResponseDto(exception.getMessage(),401,false);
        return  new ResponseEntity<>(errorResponse,HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(IncorrectFileException.class)
    public ResponseEntity<ErrorResponseDto> handleIncorrectFileException(IncorrectFileException exception){
        ErrorResponseDto errorResponse= new ErrorResponseDto(exception.getMessage(),401,false);
        return  new ResponseEntity<>(errorResponse,HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponseDto> Exception(Exception exception){
        System.out.println(exception);
        ErrorResponseDto errorResponse = new ErrorResponseDto(exception.getMessage(), 400,false);
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
}
