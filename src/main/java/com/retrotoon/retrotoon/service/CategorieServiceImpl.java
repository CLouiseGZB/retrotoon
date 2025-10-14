package com.retrotoon.retrotoon.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.retrotoon.retrotoon.model.Categorie;
import com.retrotoon.retrotoon.model.Video;
import com.retrotoon.retrotoon.repository.CategorieRepository;

@Service
public class CategorieServiceImpl implements CategorieService{

    @Autowired
    private CategorieRepository categorieRepository;
    
    @Override
    public Categorie addNewCategorie(Categorie categorie){
        Categorie newCategorie = new Categorie();
        newCategorie.setNom(categorie.getNom());
        for (Video v : categorie.getVideo()) {
            v.setCategorieVideo(newCategorie); 
        }
        newCategorie.setVideo(categorie.getVideo());

        return categorieRepository.save(newCategorie);
    }

    @Override
    public List<Categorie> getAllCategories(){
        return categorieRepository.findAll();
    }

    // @Override
    // public Categorie getCategorieByName(String nom){
    //     Categorie categorie = categorieRepository.findByNom(nom);
    //     if (categorie != null) {
    //         return categorieRepository.findByNom(nom);
    //     }
    //     return null;
    // }
    
    // @Override
    // public Categorie updateCategorie(String nom, Categorie categories){
    //     Optional<Categorie> categorie = categorieRepository.findByNom(nom);
    //     if (categorie == null) {
    //     return null;
    //     }
    //         categorie.setNom(categories.getNom());
    //         categorie.setVideo(categories.getVideo());
    //         return categorieRepository.save(categorie);

    // }

    @Override
    public boolean deleteCategorieById(Long id){
      if (categorieRepository.existsById(id)) {
        categorieRepository.deleteById(id);
        return true;
       }
       return false;
    }
}
