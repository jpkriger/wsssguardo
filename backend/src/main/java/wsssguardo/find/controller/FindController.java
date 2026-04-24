package wsssguardo.find.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import wsssguardo.find.service.FindService;

@Tag(name = "Finds", description = "Finds operations")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/finds")
public class FindController {

  private final FindService service;
  
}
