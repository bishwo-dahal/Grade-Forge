package com.grade.forge.exceptionhandler;

public class IncorrectFileException extends RuntimeException{
    public IncorrectFileException(){
        super("Incorrect File Type");
    }

    public IncorrectFileException(String message){
        super(message);
    }
}
