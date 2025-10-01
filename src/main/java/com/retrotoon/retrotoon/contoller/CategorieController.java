package com.retrotoon.retrotoon.contoller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.retrotoon.retrotoon.model.Categorie;
import com.retrotoon.retrotoon.service.CategorieServiceImpl;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;




@RestController
@RequestMapping("/categories")
public class CategorieController {

    @Autowired
    CategorieServiceImpl categorieServiceImpl;

    @PostMapping
    public ResponseEntity<Categorie> createCatgorie(@RequestBody Categorie categorie){
        Categorie savedCategorie = categorieServiceImpl.addNewCategorie(categorie);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedCategorie);
    }

    @GetMapping
    public ResponseEntity<List<Categorie>> getAll(){
        List<Categorie> categories = categorieServiceImpl.getAllCategories();
        if (categories.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(categories);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Categorie> getById(@PathVariable Long id){
        Categorie categorie = categorieServiceImpl.getCategorieById(id);
        if (categorie == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(categorie);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Categorie> updateCategorie(@PathVariable Long id, @RequestBody Categorie updatedCategorie){
        Categorie categorie = categorieServiceImpl.getCategorieById(id);
        Categorie updateCategorie = categorieServiceImpl.updateCategorie(id, updatedCategorie);
        if (categorie == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(updateCategorie);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategorie(@PathVariable Long id){
        if (categorieServiceImpl.deleteCategorieById(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

}
