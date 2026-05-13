package wsssguardo.find.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import wsssguardo.find.dto.responsedto.FindNameResponseDTO;
import wsssguardo.find.service.FindService;
import wsssguardo.shared.openapi.ApiListAll;

@Tag(name = "Finds", description = "Finds operations")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/finds")
public class FindController {

  private final FindService service;

  @ApiListAll
  @GetMapping("/findingNameByProjectId/{projectId}")
  public ResponseEntity<List<FindNameResponseDTO>> getFindingNameByProjectId(@PathVariable UUID projectId) {
    List<FindNameResponseDTO> findings = service.getFindingNameByProjectId(projectId);
    return ResponseEntity.ok(findings);
  }
}
