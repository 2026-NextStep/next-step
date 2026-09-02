package com.nextstep.backend.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // uploads/ 하위 전체 정적 서빙 (계약서 + 프로필 이미지 공통)
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:./uploads/");
    }
}