package com.retrotoon.retrotoon.dtos;

import java.util.Date;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VideoDto {
    private long id;
    private String titre;
    private String description;
    private String url;
    private Date dateAjout;
}
