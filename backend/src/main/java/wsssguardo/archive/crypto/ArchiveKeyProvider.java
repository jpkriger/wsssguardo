package wsssguardo.archive.crypto;

/**
 * Fornece o material de chaves para o arquivamento. A implementação padrão lê de
 * keystore/certificado configurados; testes podem fornecer chaves geradas em memória.
 */
public interface ArchiveKeyProvider {

    /**
     * @throws wsssguardo.shared.exception.ApiException se o arquivamento não estiver configurado.
     */
    ArchiveKeyMaterial get();
}
