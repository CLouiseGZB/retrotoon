package com.retrotoon.retrotoon.service;

import org.springframework.http.ResponseEntity;

import com.retrotoon.retrotoon.dtos.RegisterResponseDto;
import com.retrotoon.retrotoon.dtos.UserRequestDto;
import com.retrotoon.retrotoon.model.Utilisateur;

public interface UtilisateurService {
	ResponseEntity<RegisterResponseDto> addNewUser(UserRequestDto userRequestDto);
	Utilisateur checkUser(String email, UserRequestDto userRequestDto);
}
