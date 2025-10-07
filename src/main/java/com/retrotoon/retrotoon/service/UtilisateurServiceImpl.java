package com.retrotoon.retrotoon.service;

import java.util.Date;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import com.retrotoon.retrotoon.dtos.RegisterResponseDto;
import com.retrotoon.retrotoon.dtos.UserRequestDto;
import com.retrotoon.retrotoon.model.Role;
import com.retrotoon.retrotoon.model.Utilisateur;
import com.retrotoon.retrotoon.repository.RoleRepository;
import com.retrotoon.retrotoon.repository.UtilisateurRepository;


@Service
public class UtilisateurServiceImpl implements UtilisateurService{
    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Override
    public ResponseEntity<RegisterResponseDto> addNewUser(UserRequestDto userRequestDto) {
        if (utilisateurRepository.findByEmail(userRequestDto.getEmail())!=null) {
             return ResponseEntity.badRequest()
                .body(RegisterResponseDto.builder()
                        .message("Erreur : l'utilisateur existe déjà")
                        .build());
    }

    Role role = roleRepository.findByNomIgnoreCase("UTILISATEUR");

    Utilisateur newUser = new Utilisateur();
    newUser.setEmail(userRequestDto.getEmail());
    newUser.setMotDePasse(userRequestDto.getMotDePasse()); 
    newUser.setNom(userRequestDto.getNom());
    newUser.setPrenom(userRequestDto.getPrenom());
    newUser.setRole(role);
    newUser.setDateInscription(new Date());
    utilisateurRepository.save(newUser);

   
    RegisterResponseDto response = RegisterResponseDto.builder()
            .message("Inscription réussie !")
            .build();

    return ResponseEntity.status(HttpStatus.CREATED).body(response);
        }
}
