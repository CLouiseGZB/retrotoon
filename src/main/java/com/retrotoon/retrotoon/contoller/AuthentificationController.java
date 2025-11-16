package com.retrotoon.retrotoon.contoller;

import java.util.List;

import com.retrotoon.retrotoon.service.UtilisateurService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.retrotoon.retrotoon.dtos.UserRequestDto;
import com.retrotoon.retrotoon.model.Utilisateur;
import com.retrotoon.retrotoon.repository.UtilisateurRepository;

@RestController
@RequestMapping("/api")
public class AuthentificationController {

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UtilisateurService utilisateurService;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @PostMapping("/register")
    public ResponseEntity<String> registerUser(@RequestBody UserRequestDto user, HttpSession session) {
        if (utilisateurRepository.findByEmail(user.getEmail()) != null) {
            return ResponseEntity.status(409).body("Email déjà utilisé");
        }
        Utilisateur nouvelUtilisateur = utilisateurService.addNewUser(user);
        session.setAttribute("prenom", nouvelUtilisateur.getPrenom());
        return ResponseEntity.ok("success");
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody UserRequestDto userDto, HttpSession session) {
        Utilisateur utilisateur = utilisateurService.checkUser(userDto.getEmail(), userDto);

        if (utilisateur != null) {
            session.setAttribute("prenom", utilisateur.getPrenom());
            return ResponseEntity.ok("success");
        } else {
            return ResponseEntity.status(401).body("error");
        }
    }

    @GetMapping("/all")
    public ResponseEntity<List<UserRequestDto>> getAll() {
        List<UserRequestDto> users = utilisateurService.getAllUsers();
        if (users.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(users);
    }

    @PutMapping("/modify/user/{oldEmail}")
    public ResponseEntity<?> updateUser(@PathVariable String oldEmail, @RequestBody UserRequestDto userRequestDto) {
        Utilisateur updatedUser = utilisateurService.updateUser(oldEmail, userRequestDto);
        if (updatedUser == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Utilisateur avec l'email " + oldEmail + " introuvable.");
        }
        return ResponseEntity.ok(updatedUser);
    }

    @GetMapping("/encode")
    public String encode(@RequestParam String rawPassword) {
        return passwordEncoder.encode(rawPassword);
    }

    @GetMapping("/user/prenom")
    public ResponseEntity<String> getPrenom(HttpSession session) {
        String prenom = (String) session.getAttribute("prenom");
        if (prenom != null) {
            return ResponseEntity.ok(prenom);
        } else {
            return ResponseEntity.status(401).body("non connecté");
        }
    }
}
