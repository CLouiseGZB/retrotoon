package com.retrotoon.retrotoon.dtos;


import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VideoCreateDto {
    private String titre;
    private String description;
    private String url;
}
