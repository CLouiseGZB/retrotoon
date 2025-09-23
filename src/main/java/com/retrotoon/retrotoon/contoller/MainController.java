package com.retrotoon.retrotoon.contoller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

import com.retrotoon.retrotoon.dtos.UserRequestDto;
import com.retrotoon.retrotoon.service.UtilisateurService;


@Controller
public class MainController {
    @Autowired
    private UtilisateurService utilisateurService;

    @GetMapping("/inscription")
    public String inscription(){
        return "html/inscription";
    }
    @GetMapping("/register")
    public String register(Model model){
        model.addAttribute("user", new UserRequestDto());
        return "html/inscription";
    }

    @PostMapping("/register")
    public String registerUser(UserRequestDto user){
        utilisateurService.addNewUser(user);
        return "html/index-client";
    }
    @GetMapping("/accueil")
    public String accueil(){
        return "html/index-client";
    }

    @GetMapping("/connexion")
    public String connexion(){
        return "html/connexion";
    }

}
