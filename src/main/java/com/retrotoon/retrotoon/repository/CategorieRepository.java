package com.retrotoon.retrotoon.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.retrotoon.retrotoon.model.Categorie;

public interface CategorieRepository extends JpaRepository<Categorie, Long>{
    
}
