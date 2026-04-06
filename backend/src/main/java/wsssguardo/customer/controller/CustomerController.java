package wsssguardo.customer.controller;

import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import wsssguardo.customer.service.CustomerService;

@RestController
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService service;
    
}
