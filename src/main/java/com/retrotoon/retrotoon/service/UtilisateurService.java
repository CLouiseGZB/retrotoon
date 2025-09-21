package com.retrotoon.retrotoon.service;

import org.springframework.http.ResponseEntity;

import com.retrotoon.retrotoon.dtos.RegisterResponseDto;
import com.retrotoon.retrotoon.dtos.UserRequestDto;

public interface UtilisateurService {
	ResponseEntity<RegisterResponseDto> addNewUser(UserRequestDto userRequestDto);
}
