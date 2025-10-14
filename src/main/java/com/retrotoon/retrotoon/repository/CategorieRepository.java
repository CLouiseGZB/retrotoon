package com.retrotoon.retrotoon.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import com.retrotoon.retrotoon.model.Categorie;

public interface CategorieRepository extends JpaRepository<Categorie, Long>{
    Optional<Categorie> findByNom(String nom);
}
