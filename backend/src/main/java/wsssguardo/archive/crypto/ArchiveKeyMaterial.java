package wsssguardo.archive.crypto;

import java.security.PrivateKey;
import java.security.cert.X509Certificate;

/**
 * Material criptográfico para arquivar um dump.
 *
 * @param signingKey            chave privada do servidor, usada para assinar (SignedData)
 * @param signerCertificate     certificado do servidor (acompanha a assinatura, para verificação)
 * @param recipientCertificate  certificado público do cofre, usado para encriptar (EnvelopedData)
 */
public record ArchiveKeyMaterial(
        PrivateKey signingKey,
        X509Certificate signerCertificate,
        X509Certificate recipientCertificate
) {
}
