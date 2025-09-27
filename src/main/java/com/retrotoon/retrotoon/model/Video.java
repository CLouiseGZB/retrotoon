package com.retrotoon.retrotoon.model;

import java.time.LocalDateTime;
import java.util.Date;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data 
@NoArgsConstructor
@Entity
public class Video {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private String titre;
    private String description;
    private String url;
    private LocalDateTime dateAjout;
    private long nbrLikes;
    @ManyToOne
    private Categorie categorieVideo;

    //@ManyToMany
    //private List<Genre> genreVideo;

}
