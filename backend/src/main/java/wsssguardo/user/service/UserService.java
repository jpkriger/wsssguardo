package wsssguardo.user.service;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import wsssguardo.user.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository repository;

}
