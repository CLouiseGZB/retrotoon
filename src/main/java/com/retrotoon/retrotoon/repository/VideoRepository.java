package com.retrotoon.retrotoon.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.retrotoon.retrotoon.model.Video;

public interface VideoRepository extends JpaRepository<Video, Long>{
    
}
