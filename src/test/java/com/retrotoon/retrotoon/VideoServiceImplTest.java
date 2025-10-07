package com.retrotoon.retrotoon;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import static org.assertj.core.api.Assertions.assertThat;
import com.retrotoon.retrotoon.dtos.VideoCreateDto;
import com.retrotoon.retrotoon.model.Video;
import com.retrotoon.retrotoon.repository.VideoRepository;
import com.retrotoon.retrotoon.service.VideoServiceImpl;

public class VideoServiceImplTest {

    @Mock
    private VideoRepository videoRepository;

    @InjectMocks
    private VideoServiceImpl videoService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testAddNewVideo(){
        VideoCreateDto dto = new VideoCreateDto();
        dto.setTitre("Video1");
        dto.setDescription("video comedy");
        dto.setUrl("http://test.com/video.mp4");

        Video videoToSave = new Video();
        videoToSave.setTitre(dto.getTitre());
        videoToSave.setDescription(dto.getDescription());
        videoToSave.setUrl(dto.getUrl());
        videoToSave.setDateAjout(LocalDateTime.now());

         when(videoRepository.save(any(Video.class))).thenAnswer(invocation -> {
            Video v = invocation.getArgument(0);
            v.setId(1L); // Simuler que JPA génère un ID
            return v;
        });

         Video savedVideo = videoService.addNewVideo(dto);

        // Assert (vérifier le résultat)
        assertThat(savedVideo).isNotNull();
        assertThat(savedVideo.getId()).isEqualTo(1L);
        assertThat(savedVideo.getTitre()).isEqualTo("Video1");
        assertThat(savedVideo.getDescription()).isEqualTo("video comedy");
        assertThat(savedVideo.getUrl()).isEqualTo("http://test.com/video.mp4");
        assertThat(savedVideo.getDateAjout()).isNotNull();

        // Vérifier que save() a bien été appelé 1 fois
        verify(videoRepository, times(1)).save(any(Video.class));
    }

}
