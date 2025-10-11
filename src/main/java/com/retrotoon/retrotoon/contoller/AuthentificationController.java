package com.retrotoon.retrotoon.contoller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.retrotoon.retrotoon.dtos.UserRequestDto;
import com.retrotoon.retrotoon.model.Utilisateur;
import com.retrotoon.retrotoon.repository.UtilisateurRepository;
import com.retrotoon.retrotoon.service.UtilisateurServiceImpl;

@RestController
@RequestMapping("/api")
public class AuthentificationController {

    @Autowired
    private UtilisateurServiceImpl utilisateurServiceImpl;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @PostMapping("/register")
    public ResponseEntity<String> registerUser(@RequestBody UserRequestDto user) {
        if (utilisateurRepository.findByEmail(user.getEmail()) != null) {
            return ResponseEntity.status(409).body("Email déjà utilisé");
        }

        utilisateurServiceImpl.addNewUser(user);
        return ResponseEntity.ok("success");
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody UserRequestDto userDto) {
        Utilisateur utilisateur = utilisateurServiceImpl.checkUser(userDto.getEmail(), userDto);

        if (utilisateur != null) {
            return ResponseEntity.ok("success");
        } else {
            return ResponseEntity.status(401).body("error");
        }
    }

    @PutMapping("/modify/user/{oldEmail}")
    public ResponseEntity<?> updateUser(@PathVariable String oldEmail, @RequestBody UserRequestDto userRequestDto) {
        Utilisateur updatedUser = utilisateurServiceImpl.updateUser(oldEmail, userRequestDto);
        if (updatedUser == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Utilisateur avec l'email " + oldEmail + " introuvable.");
        }
        return ResponseEntity.ok(updatedUser);
    }
}
