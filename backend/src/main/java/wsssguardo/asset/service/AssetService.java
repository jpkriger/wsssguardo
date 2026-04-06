package wsssguardo.asset.service;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import wsssguardo.asset.repository.AssetRepository;

@Service
@RequiredArgsConstructor
public class AssetService {

    private final AssetRepository repository;
    
}
