package com.retrotoon.retrotoon.contoller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.SecurityProperties.User;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.retrotoon.retrotoon.dtos.UserRequestDto;
import com.retrotoon.retrotoon.model.Utilisateur;
import com.retrotoon.retrotoon.service.UtilisateurService;


@Controller
public class MainController {
    @Autowired
    private UtilisateurService utilisateurService;

    @GetMapping("/inscription")
    public String inscription(Model model) {
        model.addAttribute("user", new UserRequestDto());
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
    @GetMapping("/contact")
    public String contact(){
        return "html/contact";
    }
    @GetMapping("/films")
    public String films(){
        return "html/films";
    }
    @GetMapping("/series")
    public String series(){
        return "html/series";
    }
    @GetMapping("/parametre")
    public String parametre(){
        return "html/parametre";
    }
    @GetMapping("/profil")
    public String profil(){
        return "html/profil";
    }
    @GetMapping("/dashbord")
    public String dashbord(){
        return "html/dashbordAdmin";
    }
    @GetMapping("/upload")
    public String upload(){
        return "html/uploadvideo";
    }
    @GetMapping("/index")
    public String index(){
        return "html/index";
    }
    @GetMapping("/video")
    public String video(){
        return "html/fiche-dessin-anime";
    }
}
