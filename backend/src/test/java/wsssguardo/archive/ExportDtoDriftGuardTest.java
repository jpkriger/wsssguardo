package wsssguardo.archive;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.lang.reflect.RecordComponent;
import java.util.Arrays;
import java.util.Collection;
import java.util.Set;
import java.util.stream.Collectors;

import jakarta.persistence.Entity;
import org.junit.jupiter.api.Test;

import wsssguardo.archive.dto.export.ArtifactExportDTO;
import wsssguardo.archive.dto.export.AssetExportDTO;
import wsssguardo.archive.dto.export.FindExportDTO;
import wsssguardo.archive.dto.export.RiskExportDTO;
import wsssguardo.artifact.Artifact;
import wsssguardo.asset.Asset;
import wsssguardo.find.Find;
import wsssguardo.risk.Risk;

/**
 * Guarda contra "drift" silencioso: se uma entidade owned ganhar um campo escalar novo
 * que não seja mapeado no DTO de export, este teste falha — assim o esquecimento vira
 * erro de build em vez de perda de dado no archive.
 *
 * <p>Relacionamentos (coleções e referências a @Entity) são ignorados de propósito —
 * eles entram como ids/snapshots, com nomes diferentes (assetIds, etc.).
 */
class ExportDtoDriftGuardTest {

    @Test
    void assetExportCoversAllScalarFields() {
        assertScalarsCovered(Asset.class, AssetExportDTO.class);
    }

    @Test
    void artifactExportCoversAllScalarFields() {
        assertScalarsCovered(Artifact.class, ArtifactExportDTO.class);
    }

    @Test
    void findExportCoversAllScalarFields() {
        assertScalarsCovered(Find.class, FindExportDTO.class);
    }

    @Test
    void riskExportCoversAllScalarFields() {
        assertScalarsCovered(Risk.class, RiskExportDTO.class);
    }

    private void assertScalarsCovered(Class<?> entity, Class<?> dto) {
        Set<String> dtoComponents = Arrays.stream(dto.getRecordComponents())
                .map(RecordComponent::getName)
                .collect(Collectors.toSet());

        Set<String> missing = Arrays.stream(entity.getDeclaredFields())
                .filter(f -> !Modifier.isStatic(f.getModifiers()))
                .filter(this::isScalar)
                .map(Field::getName)
                .filter(name -> !dtoComponents.contains(name))
                .collect(Collectors.toSet());

        assertThat(missing)
                .as("%s tem campos escalares não mapeados em %s — atualize o DTO de export",
                        entity.getSimpleName(), dto.getSimpleName())
                .isEmpty();
    }

    /** Escalar = não é coleção nem referência a outra @Entity (esses são relacionamentos). */
    private boolean isScalar(Field f) {
        Class<?> type = f.getType();
        if (Collection.class.isAssignableFrom(type)) {
            return false;
        }
        return type.getAnnotation(Entity.class) == null;
    }
}
