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

//         @Override
//         public Utilisateur updateUser(String email, UserRequestDto userRequestDto){
//         Utilisateur utilisateur = utilisateurRepository.findByEmail(email);
//         if (utilisateur != null) {
//            utilisateur.setNom(userRequestDto.getNom());
//            utilisateur.setPrenom(userRequestDto.getPrenom());
//            utilisateur.setEmail(userRequestDto.getEmail());
//            utilisateur.setDateDeNaissance(userRequestDto.getDateDeNaissance());
//            utilisateur.setMotDePasse(userRequestDto.getMotDePasse());
//            return utilisateurRepository.save(utilisateur);
//         }
//         return null;
//        }
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

        if (userRequestDto.getNom() != null) utilisateur.setNom(userRequestDto.getNom());
        if (userRequestDto.getPrenom() != null) utilisateur.setPrenom(userRequestDto.getPrenom());
        if (userRequestDto.getDateDeNaissance() != null) utilisateur.setDateDeNaissance(userRequestDto.getDateDeNaissance());
        return utilisateurRepository.save(utilisateur);
    }
}
