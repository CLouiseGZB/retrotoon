package com.retrotoon.retrotoon.contoller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.retrotoon.retrotoon.dtos.UserRequestDto;
import com.retrotoon.retrotoon.model.Utilisateur;
import com.retrotoon.retrotoon.service.UtilisateurServiceImpl;

@RestController
@RequestMapping("/api")
public class AuthentificationController {

    @Autowired
    private UtilisateurServiceImpl utilisateurServiceImpl;

    @PostMapping("/register")
    public String registerUser(UserRequestDto user) {
        utilisateurServiceImpl.addNewUser(user);
        return "html/index-client";
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
}
