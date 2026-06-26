package wsssguardo.archive.dto.export;

import java.util.List;
import java.util.UUID;

/**
 * Snapshot das entidades compartilhadas (não-owned) referenciadas pelo projeto.
 * Apenas os campos necessários para reconstruir contexto — não o grafo completo.
 */
public record ReferencesDTO(
        List<CompanyRef> companies,
        List<UserRef> users,
        List<FindCategoryRef> findCategories
) {
    public record CompanyRef(UUID id, String name) {
    }

    public record UserRef(UUID id, String firstName, String lastName, String email, String role) {
    }

    public record FindCategoryRef(UUID id, String name) {
    }
}
