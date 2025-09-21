package com.retrotoon.retrotoon.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.retrotoon.retrotoon.model.Utilisateur;

public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {
    
   Utilisateur findByEmail(String email);
}
