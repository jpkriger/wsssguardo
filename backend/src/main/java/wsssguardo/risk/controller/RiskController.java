package wsssguardo.risk.controller;

import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import wsssguardo.risk.service.RiskService;

@Tag(name = "Risk", description = "Risk operations")
@RestController
@RequiredArgsConstructor
public class RiskController {

  private final RiskService service;
  
}
