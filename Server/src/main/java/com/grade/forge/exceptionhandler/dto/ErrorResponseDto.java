package com.grade.forge.exceptionhandler.dto;

public record ErrorResponseDto(String message, int statusCode, boolean isSuccess) {


}
