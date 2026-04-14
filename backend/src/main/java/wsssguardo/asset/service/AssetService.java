package wsssguardo.asset.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import wsssguardo.asset.dto.responsedto.AssetResponseDTO;
import wsssguardo.asset.repository.AssetRepository;

@Service
@RequiredArgsConstructor
public class AssetService {

    private final AssetRepository repository;
    
    public List<AssetResponseDTO> ativosByProjectId(UUID projectId) {
        return List.of(
            new AssetResponseDTO("b1a23f4c-5555-4d6e-88f1-1a2b3c4d5e6f", "Servidor de Backup", "Infraestrutura", projectId.toString()),
            new AssetResponseDTO("c2b34d5e-6666-4f7g-99h2-2b3c4d5e6f7g", "Notebook de Desenvolvimento", "Hardware", projectId.toString()),
            new AssetResponseDTO("d3c45e6f-7777-4g8h-00i3-3c4d5e6f7g8h", "Licença do Software ERP", "Software", projectId.toString())
        );
    }
}
