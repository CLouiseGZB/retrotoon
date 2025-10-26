package com.retrotoon.retrotoon.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import com.retrotoon.retrotoon.dtos.UserRequestDto;
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
                if (utilisateurRepository.findByEmail(userRequestDto.getEmail()) == null) {
                        Utilisateur newUser = new Utilisateur();
                        newUser.setNom(userRequestDto.getNom());
                        newUser.setPrenom(userRequestDto.getPrenom());
                        newUser.setEmail(userRequestDto.getEmail());
                        newUser.setDateDeNaissance(userRequestDto.getDateDeNaissance());
                        String encodedPassword = passwordEncoder.encode(userRequestDto.getMotDePasse());
                        newUser.setMotDePasse(encodedPassword);
                        return utilisateurRepository.save(newUser);
                }
            return null;
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

                if (userRequestDto.getNom() != null)
                        utilisateur.setNom(userRequestDto.getNom());
                if (userRequestDto.getPrenom() != null)
                        utilisateur.setPrenom(userRequestDto.getPrenom());
                if (userRequestDto.getDateDeNaissance() != null)
                        utilisateur.setDateDeNaissance(userRequestDto.getDateDeNaissance());
                return utilisateurRepository.save(utilisateur);
        }
}
