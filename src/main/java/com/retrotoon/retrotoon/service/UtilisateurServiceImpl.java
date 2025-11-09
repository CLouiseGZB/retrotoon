package com.retrotoon.retrotoon.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.retrotoon.retrotoon.dtos.UserRequestDto;
import com.retrotoon.retrotoon.model.Role;
import com.retrotoon.retrotoon.model.Utilisateur;
import com.retrotoon.retrotoon.repository.UtilisateurRepository;

@Service
public class UtilisateurServiceImpl implements UtilisateurService {

        @Autowired
        private UtilisateurRepository utilisateurRepository;

        @Autowired
        private PasswordEncoder passwordEncoder;

        @Override
        public Utilisateur addNewUser(UserRequestDto userRequestDto) {
                if (utilisateurRepository.findByEmail(userRequestDto.getEmail()) != null) {
                        throw new IllegalArgumentException("Email déjà utilisé");
                } else {
                        Utilisateur newUser = new Utilisateur();
                        newUser.setNom(userRequestDto.getNom());
                        newUser.setPrenom(userRequestDto.getPrenom());
                        newUser.setEmail(userRequestDto.getEmail());
                        newUser.setDateDeNaissance(userRequestDto.getDateDeNaissance());
                        String encodedPassword = passwordEncoder.encode(userRequestDto.getMotDePasse());
                        newUser.setMotDePasse(encodedPassword);
                        newUser.setDateInscription(LocalDateTime.now());
                        newUser.setRole(Role.USER);
                        return utilisateurRepository.save(newUser);
                }
        }

        @Override
        public Utilisateur checkUser(String email, UserRequestDto userRequestDto) {
                Utilisateur user = utilisateurRepository.findByEmail(email);
                boolean motDePasseValid = passwordEncoder.matches(userRequestDto.getMotDePasse(), user.getMotDePasse());
                if (motDePasseValid) {
                        return user;
                }
                return null;
        }

        @Override
        public Utilisateur updateUser(String oldEmail, UserRequestDto userRequestDto) {
                Utilisateur utilisateur = utilisateurRepository.findByEmail(oldEmail);
                if (utilisateur == null) {
                        return null;
                }
                String nouveauEmail = userRequestDto.getEmail();
                if (nouveauEmail != null && !nouveauEmail.isBlank()
                                && !nouveauEmail.equalsIgnoreCase(utilisateur.getEmail())) {

                        Utilisateur other = utilisateurRepository.findByEmail(nouveauEmail);
                        if (other != null) {
                                throw new IllegalArgumentException("Email déjà utilisé");
                        }
                        utilisateur.setEmail(nouveauEmail);
                }

                if (userRequestDto.getNom() != null && !userRequestDto.getNom().isBlank()) {
                        utilisateur.setNom(userRequestDto.getNom());
                }
                if (userRequestDto.getPrenom() != null && !userRequestDto.getPrenom().isBlank()) {
                        utilisateur.setPrenom(userRequestDto.getPrenom());
                }
                if (userRequestDto.getDateDeNaissance() != null && !userRequestDto.getDateDeNaissance().isBlank()) {
                        utilisateur.setDateDeNaissance(userRequestDto.getDateDeNaissance());
                }
                return utilisateurRepository.save(utilisateur);
        }

        @Override
        public List<UserRequestDto> getAllUsers() {
        List<Utilisateur> users = utilisateurRepository.findAll();

       return users.stream()
            .map(u -> {
                UserRequestDto dto = new UserRequestDto();
                dto.setNom(u.getNom());
                dto.setPrenom(u.getPrenom());
                dto.setEmail(u.getEmail());
                dto.setDateDeNaissance(u.getDateDeNaissance());
                dto.setMotDePasse(u.getMotDePasse());
                return dto;
            })
            .collect(Collectors.toList());
        }
}
