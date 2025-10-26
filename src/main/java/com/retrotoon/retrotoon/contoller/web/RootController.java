package com.retrotoon.retrotoon.contoller.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class RootController {
    @GetMapping("/")        
    public String home() { 
        return "forward:/index.html"; 
    }

    @GetMapping("/app")     
    public String app()  { 
        return "forward:/html/index-client.html"; 
    }
}

