package com.hostelsync.backend.exception;

import com.hostelsync.backend.dto.ErrorResponseDto;
import jakarta.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.HashMap;
import java.util.Map;

/**
 * Global exception handler providing uniform error responses across all REST
 * endpoints.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

        @ExceptionHandler(BadCredentialsException.class)
        public ResponseEntity<ErrorResponseDto> handleBadCredentials(
                        BadCredentialsException ex, HttpServletRequest request) {
                ErrorResponseDto errorDto = ErrorResponseDto.of(
                                HttpStatus.UNAUTHORIZED.value(),
                                HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                                ex.getMessage(),
                                request.getRequestURI());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorDto);
        }

        @ExceptionHandler(DisabledException.class)
        public ResponseEntity<ErrorResponseDto> handleDisabled(
                        DisabledException ex, HttpServletRequest request) {
                ErrorResponseDto errorDto = ErrorResponseDto.of(
                                HttpStatus.UNAUTHORIZED.value(),
                                HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                                ex.getMessage(),
                                request.getRequestURI());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorDto);
        }

        @ExceptionHandler(AccessDeniedException.class)
        public ResponseEntity<ErrorResponseDto> handleAccessDenied(
                        AccessDeniedException ex, HttpServletRequest request) {
                ErrorResponseDto errorDto = ErrorResponseDto.of(
                                HttpStatus.FORBIDDEN.value(),
                                HttpStatus.FORBIDDEN.getReasonPhrase(),
                                "Access is denied: You do not possess the required role authority to access this endpoint",
                                request.getRequestURI());
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorDto);
        }

        @ExceptionHandler(UsernameNotFoundException.class)
        public ResponseEntity<ErrorResponseDto> handleUserNotFound(
                        UsernameNotFoundException ex, HttpServletRequest request) {
                ErrorResponseDto errorDto = ErrorResponseDto.of(
                                HttpStatus.NOT_FOUND.value(),
                                HttpStatus.NOT_FOUND.getReasonPhrase(),
                                ex.getMessage(),
                                request.getRequestURI());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorDto);
        }

        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ErrorResponseDto> handleValidationExceptions(
                        MethodArgumentNotValidException ex, HttpServletRequest request) {
                Map<String, String> errors = new HashMap<>();
                ex.getBindingResult().getAllErrors().forEach(error -> {
                        String fieldName = ((FieldError) error).getField();
                        String errorMessage = error.getDefaultMessage();
                        errors.put(fieldName, errorMessage);
                });

                ErrorResponseDto errorDto = ErrorResponseDto.ofValidation(
                                HttpStatus.BAD_REQUEST.value(),
                                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                                "Input validation failed",
                                request.getRequestURI(),
                                errors);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorDto);
        }

        @ExceptionHandler(HttpMessageNotReadableException.class)
        public ResponseEntity<ErrorResponseDto> handleHttpMessageNotReadable(
                        HttpMessageNotReadableException ex, HttpServletRequest request) {
                ErrorResponseDto errorDto = ErrorResponseDto.of(
                                HttpStatus.BAD_REQUEST.value(),
                                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                                "Malformed JSON request body: "
                                                + (ex.getMessage() != null ? ex.getMessage() : "Invalid format"),
                                request.getRequestURI());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorDto);
        }

        @ExceptionHandler(ResourceNotFoundException.class)
        public ResponseEntity<ErrorResponseDto> handleResourceNotFound(
                        ResourceNotFoundException ex, HttpServletRequest request) {
                ErrorResponseDto errorDto = ErrorResponseDto.of(
                                HttpStatus.NOT_FOUND.value(),
                                HttpStatus.NOT_FOUND.getReasonPhrase(),
                                ex.getMessage(),
                                request.getRequestURI());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorDto);
        }

        @ExceptionHandler(DuplicateResourceException.class)
        public ResponseEntity<ErrorResponseDto> handleDuplicateResource(
                        DuplicateResourceException ex, HttpServletRequest request) {
                ErrorResponseDto errorDto = ErrorResponseDto.of(
                                HttpStatus.CONFLICT.value(),
                                HttpStatus.CONFLICT.getReasonPhrase(),
                                ex.getMessage(),
                                request.getRequestURI());
                return ResponseEntity.status(HttpStatus.CONFLICT).body(errorDto);
        }

        @ExceptionHandler(InvalidOperationException.class)
        public ResponseEntity<ErrorResponseDto> handleInvalidOperation(
                        InvalidOperationException ex, HttpServletRequest request) {
                ErrorResponseDto errorDto = ErrorResponseDto.of(
                                HttpStatus.CONFLICT.value(),
                                HttpStatus.CONFLICT.getReasonPhrase(),
                                ex.getMessage(),
                                request.getRequestURI());
                return ResponseEntity.status(HttpStatus.CONFLICT).body(errorDto);
        }

        @ExceptionHandler(NoResourceFoundException.class)
        public ResponseEntity<ErrorResponseDto> handleNotFound(
                        NoResourceFoundException ex, HttpServletRequest request) {
                ErrorResponseDto errorDto = ErrorResponseDto.of(
                                HttpStatus.NOT_FOUND.value(),
                                HttpStatus.NOT_FOUND.getReasonPhrase(),
                                ex.getMessage(),
                                request.getRequestURI());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorDto);
        }

        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<ErrorResponseDto> handleIllegalArgument(
                        IllegalArgumentException ex, HttpServletRequest request) {
                ErrorResponseDto errorDto = ErrorResponseDto.of(
                                HttpStatus.BAD_REQUEST.value(),
                                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                                ex.getMessage(),
                                request.getRequestURI());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorDto);
        }

        @ExceptionHandler(Exception.class)
        public ResponseEntity<ErrorResponseDto> handleAllUncaughtExceptions(
                        Exception ex, HttpServletRequest request) {
                logger.error("An unexpected internal error occurred: ", ex);
                ErrorResponseDto errorDto = ErrorResponseDto.of(
                                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                                HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase(),
                                "An unexpected internal error occurred",
                                request.getRequestURI());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorDto);
        }
}
