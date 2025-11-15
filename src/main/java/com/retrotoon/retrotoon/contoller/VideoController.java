package com.retrotoon.retrotoon.contoller;

import java.util.List;

import com.retrotoon.retrotoon.service.VideoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.retrotoon.retrotoon.dtos.VideoCreateDto;
import com.retrotoon.retrotoon.model.Video;

@RestController
@RequestMapping("/videos")
public class VideoController {
    
    @Autowired
    VideoService videoService;

    @PostMapping("/uploadVideo")
    public ResponseEntity<Video> createVideo(@RequestBody VideoCreateDto videoCreateDto){
        Video savedVideo = videoService.addNewVideo(videoCreateDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedVideo);
    }
    
    @GetMapping("/all")
    public ResponseEntity<List<VideoCreateDto>> getAll(){
        List<VideoCreateDto> videos = videoService.getAllVideos();
        if (videos.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(videos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Video> getById(@PathVariable Long id){
        Video video = videoService.getVideoById(id);
        if (video == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(video);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Video> updateVideo(@PathVariable Long id, @RequestBody VideoCreateDto updatedVideo){
        Video video = videoService.getVideoById(id);
        Video updateVideo = videoService.updateVideo(id, updatedVideo);
        if (video == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(updateVideo);
    }

    @DeleteMapping("/delete")
    public ResponseEntity<Void> deleteVideo(@RequestBody List<Long> ids){
        try{
        ids.forEach(id -> videoService.deleteVideoById(id));
            return ResponseEntity.noContent().build();
        }catch(Exception e){
        return ResponseEntity.notFound().build();
        }
    }
}
