package com.nextstep.backend.info.controller;

import com.nextstep.backend.info.dto.LatestInfoDetailDto;
import com.nextstep.backend.info.dto.LatestInfoListDto;
import com.nextstep.backend.info.service.LatestInfoService;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/latest-info")
public class LatestInfoController {

    private final LatestInfoService service;

    public LatestInfoController(LatestInfoService service) {
        this.service = service;
    }

    @GetMapping
    public Page<LatestInfoListDto> getList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return service.getList(page, size);
    }

    @GetMapping("/{id}")
    public LatestInfoDetailDto getDetail(@PathVariable Long id) {
        return service.getDetail(id);
    }
}
