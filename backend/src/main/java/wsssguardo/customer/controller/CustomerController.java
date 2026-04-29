package wsssguardo.customer.controller;

import java.net.URI;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import wsssguardo.customer.dto.requestdto.CustomerRequestDTO;
import wsssguardo.customer.dto.requestdto.CustomerUpdateRequestDTO;
import wsssguardo.customer.dto.responsedto.CustomerResponseDTO;
import wsssguardo.customer.service.CustomerService;
import wsssguardo.shared.openapi.ApiCreate;

@Tag(name = "Customer", description = "Endpoints for create, update and delete customers")
@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService service;

    @ApiCreate
    @PostMapping
    public ResponseEntity<CustomerResponseDTO> create(
            @Valid @RequestBody CustomerRequestDTO dto) {
        CustomerResponseDTO created = service.create(dto);
        URI location = URI.create("/api/customers/" + created.id());
        return ResponseEntity.created(location).body(created);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<CustomerResponseDTO> update(
            @PathVariable UUID id,
            @Valid @RequestBody CustomerUpdateRequestDTO dto) {
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

}
