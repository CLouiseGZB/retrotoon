package com.retrotoon.retrotoon.service;

import java.util.List;
import com.retrotoon.retrotoon.model.Categorie;

public interface CategorieService {

    Categorie addNewCategorie(Categorie categorie);
    List<Categorie> getAllCategories();
    Categorie getCategorieByName(String nom);
    Categorie updateCategorie(String nom, Categorie categorie);
    boolean deleteCategorieById(Long id);
    
}
