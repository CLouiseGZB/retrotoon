package com.retrotoon.retrotoon.service;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.retrotoon.retrotoon.dtos.VideoCreateDto;
import com.retrotoon.retrotoon.model.Video;
import com.retrotoon.retrotoon.repository.VideoRepository;



@Service
public class VideoServiceImpl implements VideoService{

    @Autowired
    private VideoRepository videoRepository;
    
    @Override
	public Video addNewVideo(VideoCreateDto video){

      Video newVideo = new Video();
      newVideo.setTitre(video.getTitre());
      newVideo.setDescription(video.getDescription());
      newVideo.setUrl(video.getUrl());
      newVideo.setDateAjout(LocalDateTime.now());
      return videoRepository.save(newVideo);
    }

    @Override
    public List<Video> getAllVideos(){
        return videoRepository.findAll();
    }

    @Override
    public Video getVideoById(Long id){
        if (videoRepository.existsById(id)) {
            return videoRepository.findById(id).orElse(null);
        }
        return null;
    }

    @Override
    public Video updateVideo(Long id, VideoCreateDto updatedVideo){
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
    public boolean deleteVideoById(Long id){
      if (videoRepository.existsById(id)) {
        videoRepository.deleteById(id);
        return true;
       }
       return false;
    }

    
}