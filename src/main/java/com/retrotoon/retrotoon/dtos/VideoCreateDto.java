package com.retrotoon.retrotoon.dtos;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class VideoCreateDto {
    private String titre;
    private String description;
    private String url;
    private String categorie;
}
