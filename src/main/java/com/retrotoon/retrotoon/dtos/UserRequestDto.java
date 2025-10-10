package com.retrotoon.retrotoon.dtos;
import java.util.Date;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class UserRequestDto {
	private String nom;
    private String prenom;
	private String email;
    private String dateDeNaissance;
	private String motDePasse;
}
