package com.nextstep.backend.info.service;

import com.nextstep.backend.info.dto.LatestInfoDetailDto;
import com.nextstep.backend.info.dto.LatestInfoListDto;
import com.nextstep.backend.info.entity.LatestInfo;
import com.nextstep.backend.info.repository.LatestInfoRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class LatestInfoService {

    private final LatestInfoRepository repository;

    public LatestInfoService(LatestInfoRepository repository) {
        this.repository = repository;
    }

    public Page<LatestInfoListDto> getList(int page, int size) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return repository.findAll(pageable).map(LatestInfoListDto::from);
    }

    public LatestInfoDetailDto getDetail(Long id) {
        LatestInfo entity = repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "게시글을 찾을 수 없습니다."));
        return LatestInfoDetailDto.from(entity);
    }
}
