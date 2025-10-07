package com.retrotoon.retrotoon.service;

import java.util.List;
import com.retrotoon.retrotoon.model.Categorie;

public interface CategorieService {

    Categorie addNewCategorie(Categorie categorie);
    List<Categorie> getAllCategories();
    Categorie getCategorieById(Long id);
    Categorie updateCategorie(Long id, Categorie categorie);
    boolean deleteCategorieById(Long id);
    
}
