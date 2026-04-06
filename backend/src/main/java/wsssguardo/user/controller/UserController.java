package wsssguardo.user.controller;

import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import wsssguardo.user.service.UserService;

@RestController
@RequiredArgsConstructor
public class UserController {
    
    private final UserService service;

}
