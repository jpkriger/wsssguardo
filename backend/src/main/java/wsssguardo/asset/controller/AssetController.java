package wsssguardo.asset.controller;

import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import wsssguardo.asset.service.AssetService;

@RestController
@RequiredArgsConstructor
public class AssetController {
    
    private final AssetService service;

}
