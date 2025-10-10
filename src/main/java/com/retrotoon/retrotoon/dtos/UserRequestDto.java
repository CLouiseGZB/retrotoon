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
    private Date dateDeNaissance;
	private String motDePasse;
}
