package com.retrotoon.retrotoon.service;
import java.util.List;
import com.retrotoon.retrotoon.dtos.VideoCreateDto;
import com.retrotoon.retrotoon.model.Video;


public interface VideoService {
    Video addNewVideo(VideoCreateDto video);
    List<VideoCreateDto> getAllVideos();
    Video getVideoById(Long id);
    Video updateVideo(Long id, VideoCreateDto updateVideo);
    boolean deleteVideoById(Long id);
    
}
