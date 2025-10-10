package com.retrotoon.retrotoon.service;

import com.retrotoon.retrotoon.dtos.UserRequestDto;
import com.retrotoon.retrotoon.model.Utilisateur;

public interface UtilisateurService {
	Utilisateur addNewUser(UserRequestDto userRequestDto);
	Utilisateur checkUser(String email, UserRequestDto userRequestDto);
}
