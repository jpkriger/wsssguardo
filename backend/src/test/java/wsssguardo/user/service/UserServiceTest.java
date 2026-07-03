package wsssguardo.user.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import wsssguardo.shared.exception.ApiException;
import wsssguardo.shared.exception.ResourceNotFoundException;
import wsssguardo.user.User;
import wsssguardo.user.domain.UserRole;
import wsssguardo.user.dto.UserResponse;
import wsssguardo.user.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository repository;

    @InjectMocks
    private UserService service;

    private User user(UUID id) {
        User u = new User();
        u.setId(id);
        u.setFirstName("Ana");
        u.setLastName("Silva");
        u.setEmail("ana@x.com");
        u.setCognitoSub("sub-123");
        u.setRole(UserRole.CONSULTANT);
        return u;
    }

    @Test
    void listAllShouldMapAllUsers() {
        UUID id = UUID.randomUUID();
        when(repository.findAll()).thenReturn(List.of(user(id)));

        List<UserResponse> result = service.listAll();

        assertEquals(1, result.size());
        assertEquals(id, result.get(0).id());
    }

    @Test
    void findByIdShouldReturnResponseWhenFound() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.of(user(id)));

        UserResponse result = service.findById(id);

        assertEquals("Ana", result.firstName());
    }

    @Test
    void findByIdShouldThrowWhenNotFound() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.findById(id));
    }

    @Test
    void findByCognitoSubShouldReturnResponseWhenFound() {
        User u = user(UUID.randomUUID());
        when(repository.findByCognitoSub("sub-123")).thenReturn(Optional.of(u));

        UserResponse result = service.findByCognitoSub("sub-123");

        assertEquals("ana@x.com", result.email());
    }

    @Test
    void findByCognitoSubShouldThrowWhenNotFound() {
        when(repository.findByCognitoSub("missing")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.findByCognitoSub("missing"));
    }

    @Test
    void findByCognitoSubOptionalShouldReturnEmptyWhenNotFound() {
        when(repository.findByCognitoSub("missing")).thenReturn(Optional.empty());

        assertTrue(service.findByCognitoSubOptional("missing").isEmpty());
    }

    @Test
    void findCognitoSubByEmailShouldReturnSub() {
        User u = user(UUID.randomUUID());
        when(repository.findByEmail("ana@x.com")).thenReturn(Optional.of(u));

        Optional<String> result = service.findCognitoSubByEmail("ana@x.com");

        assertEquals(Optional.of("sub-123"), result);
    }

    @Test
    void findCognitoSubByEmailShouldReturnEmptyWhenNotFound() {
        when(repository.findByEmail("missing@x.com")).thenReturn(Optional.empty());

        assertTrue(service.findCognitoSubByEmail("missing@x.com").isEmpty());
    }

    @Test
    void findOrCreateByCognitoSubShouldReturnExistingUser() {
        User existing = user(UUID.randomUUID());
        when(repository.findByCognitoSub("sub-123")).thenReturn(Optional.of(existing));

        User result = service.findOrCreateByCognitoSub("sub-123", "ana@x.com", "Ana", "Silva");

        assertEquals(existing, result);
        verify(repository, never()).save(any());
    }

    @Test
    void findOrCreateByCognitoSubShouldCreateNewUserWhenNotFound() {
        when(repository.findByCognitoSub("sub-new")).thenReturn(Optional.empty());
        when(repository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User result = service.findOrCreateByCognitoSub("sub-new", "new@x.com", "New", "User");

        assertEquals("new@x.com", result.getEmail());
        assertEquals(UserRole.CONSULTANT, result.getRole());
        verify(repository, times(1)).save(any(User.class));
    }

    @Test
    void ensureEmailAvailableShouldNotThrowWhenEmailBelongsToSameUser() {
        User u = user(UUID.randomUUID());
        when(repository.findByEmail("ana@x.com")).thenReturn(Optional.of(u));

        service.ensureEmailAvailable(u, "ana@x.com");
    }

    @Test
    void ensureEmailAvailableShouldNotThrowWhenEmailIsFree() {
        when(repository.findByEmail("free@x.com")).thenReturn(Optional.empty());

        service.ensureEmailAvailable(user(UUID.randomUUID()), "free@x.com");
    }

    @Test
    void ensureEmailAvailableShouldThrowWhenEmailBelongsToAnotherUser() {
        User owner = user(UUID.randomUUID());
        User another = user(UUID.randomUUID());
        when(repository.findByEmail("ana@x.com")).thenReturn(Optional.of(owner));

        assertThrows(ApiException.class, () -> service.ensureEmailAvailable(another, "ana@x.com"));
    }

    @Test
    void updateEmailShouldUpdateAndSaveWhenAvailable() {
        User u = user(UUID.randomUUID());
        when(repository.findByEmail("new@x.com")).thenReturn(Optional.empty());

        service.updateEmail(u, "new@x.com");

        assertEquals("new@x.com", u.getEmail());
        verify(repository).save(u);
    }

    @Test
    void updateEmailShouldThrowWhenEmailTaken() {
        User u = user(UUID.randomUUID());
        User other = user(UUID.randomUUID());
        when(repository.findByEmail("taken@x.com")).thenReturn(Optional.of(other));

        assertThrows(ApiException.class, () -> service.updateEmail(u, "taken@x.com"));
        verify(repository, never()).save(any());
    }

    @Test
    void updateNameShouldSetFieldsAndSave() {
        User u = user(UUID.randomUUID());

        service.updateName(u, "Novo", "Nome");

        assertEquals("Novo", u.getFirstName());
        assertEquals("Nome", u.getLastName());
        verify(repository).save(u);
    }

    @Test
    void toResponseShouldMapAllFields() {
        User u = user(UUID.randomUUID());

        UserResponse response = service.toResponse(u);

        assertEquals(u.getId(), response.id());
        assertEquals(u.getFirstName(), response.firstName());
        assertEquals(u.getLastName(), response.lastName());
        assertEquals(u.getEmail(), response.email());
        assertEquals(u.getRole(), response.role());
    }
}
