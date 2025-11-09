package com.retrotoon.retrotoon.service;

import java.util.List;

import com.retrotoon.retrotoon.dtos.UserRequestDto;
import com.retrotoon.retrotoon.model.Utilisateur;

public interface UtilisateurService {
	Utilisateur addNewUser(UserRequestDto userRequestDto);
	Utilisateur checkUser(String email, UserRequestDto userRequestDto);
	List<UserRequestDto> getAllUsers();
	Utilisateur updateUser(String oldEmail, UserRequestDto userRequestDto);
}
