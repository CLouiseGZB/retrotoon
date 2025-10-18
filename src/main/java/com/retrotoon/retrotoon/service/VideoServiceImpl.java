package com.retrotoon.retrotoon.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.retrotoon.retrotoon.dtos.VideoCreateDto;
import com.retrotoon.retrotoon.model.Categorie;
import com.retrotoon.retrotoon.model.Video;
import com.retrotoon.retrotoon.repository.CategorieRepository;
import com.retrotoon.retrotoon.repository.VideoRepository;

@Service
public class VideoServiceImpl implements VideoService {

    @Autowired
    private VideoRepository videoRepository;

    @Autowired
    private CategorieRepository categorieRepository;

    @Override
    public Video addNewVideo(VideoCreateDto video) {

        Video newVideo = new Video();
        newVideo.setTitre(video.getTitre());
        newVideo.setDescription(video.getDescription());
        newVideo.setUrl(video.getUrl());
        newVideo.setDateAjout(LocalDateTime.now());
        String catNom = video.getCategorie().toUpperCase().trim();
        Categorie categorie = categorieRepository.findByNom(catNom);
        if (categorie == null) {
            categorie = new Categorie();
            categorie.setNom(catNom);
            categorie = categorieRepository.save(categorie);
        }
        newVideo.setCategorieVideo(categorie);
        return videoRepository.save(newVideo);
    }

    @Override
    public List<VideoCreateDto> getAllVideos() {
        List<Video> videos = videoRepository.findAll();

        return videos.stream().map(v -> new VideoCreateDto(
                v.getId(),
                v.getTitre(),
                v.getDescription(),
                v.getUrl(),
                v.getCategorieVideo() != null ? v.getCategorieVideo().getNom() : "Non définie",
                v.getDateAjout())).collect(Collectors.toList());
    }

    @Override
    public Video getVideoById(Long id) {
        if (videoRepository.existsById(id)) {
            return videoRepository.findById(id).orElse(null);
        }
        return null;
    }

    @Override
    public Video updateVideo(Long id, VideoCreateDto updatedVideo) {
        if (videoRepository.existsById(id)) {
            return videoRepository.findById(id)
                    .map(video -> {
                        video.setTitre(updatedVideo.getTitre());
                        video.setUrl(updatedVideo.getUrl());
                        return videoRepository.save(video);
                    })
                    .orElse(null);
        }
        return null;
    }

    @Override
    public boolean deleteVideoById(Long id) {
        if (videoRepository.existsById(id)) {
            videoRepository.deleteById(id);
            return true;
        }
        return false;
    }

}