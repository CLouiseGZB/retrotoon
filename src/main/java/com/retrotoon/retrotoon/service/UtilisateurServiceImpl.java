package com.retrotoon.retrotoon.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.retrotoon.retrotoon.dtos.UserRequestDto;
import com.retrotoon.retrotoon.model.Utilisateur;
import com.retrotoon.retrotoon.repository.UtilisateurRepository;

@Service
public class UtilisateurServiceImpl implements UtilisateurService {

        @Autowired
        private UtilisateurRepository utilisateurRepository;

        @Override
        public Utilisateur addNewUser(UserRequestDto userRequestDto) {
                if (utilisateurRepository.findByEmail(userRequestDto.getEmail()) != null) {
                        return null;
                }
                Utilisateur newUser = new Utilisateur();
                newUser.setNom(userRequestDto.getNom());
                newUser.setPrenom(userRequestDto.getPrenom());
                newUser.setEmail(userRequestDto.getEmail());
                newUser.setDateDeNaissance(userRequestDto.getDateDeNaissance());
                newUser.setMotDePasse(userRequestDto.getMotDePasse());
                return utilisateurRepository.save(newUser);
        }

        @Override
        public Utilisateur checkUser(String email, UserRequestDto userRequestDto) {
                Utilisateur user = utilisateurRepository.findByEmail(userRequestDto.getEmail());
                if (user != null && user.getMotDePasse().equals(userRequestDto.getMotDePasse())) {
                        return user;
                }
                return null;
        }
}
