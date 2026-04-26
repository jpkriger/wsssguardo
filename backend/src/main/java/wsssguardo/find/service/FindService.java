package wsssguardo.find.service;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import wsssguardo.find.repository.FindRepository;

@Service
@RequiredArgsConstructor
public class FindService {
  
  private final FindRepository repository;

}
