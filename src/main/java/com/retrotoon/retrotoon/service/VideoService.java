package com.retrotoon.retrotoon.service;
import java.util.List;
import com.retrotoon.retrotoon.dtos.VideoCreateDto;
import com.retrotoon.retrotoon.model.Video;


public interface VideoService {
    Video addNewVideo(VideoCreateDto video);
    List<Video> getAllVideos();
    boolean deleteVideoById(Long id);
    Video getVideoById(Long id);
    Video updateVideo(Long id, VideoCreateDto updateVideo);
}
