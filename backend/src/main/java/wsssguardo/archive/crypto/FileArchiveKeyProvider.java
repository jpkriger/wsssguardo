package wsssguardo.archive.crypto;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import wsssguardo.shared.exception.ApiException;

/**
 * Lê o material de chaves de arquivos configurados:
 * <ul>
 *   <li>chave/cert de assinatura: keystore PKCS#12 ({@code archive.signing.*});</li>
 *   <li>certificado do cofre (recipiente): arquivo X.509 PEM ou DER ({@code archive.recipient.certificate-path}).</li>
 * </ul>
 *
 * <p>Se algo não estiver configurado, lança {@code 503} ao ser invocado — a aplicação
 * sobe normalmente sem as chaves; só a operação de arquivar fica indisponível.
 */
@Component
public class FileArchiveKeyProvider implements ArchiveKeyProvider {

    private final String keystorePath;
    private final String keystorePassword;
    private final String keyAlias;
    private final String keyPassword;
    private final String recipientCertPath;

    public FileArchiveKeyProvider(
            @Value("${archive.signing.keystore-path:}") String keystorePath,
            @Value("${archive.signing.keystore-password:}") String keystorePassword,
            @Value("${archive.signing.key-alias:}") String keyAlias,
            @Value("${archive.signing.key-password:}") String keyPassword,
            @Value("${archive.recipient.certificate-path:}") String recipientCertPath) {
        this.keystorePath = keystorePath;
        this.keystorePassword = keystorePassword;
        this.keyAlias = keyAlias;
        this.keyPassword = keyPassword.isBlank() ? keystorePassword : keyPassword;
        this.recipientCertPath = recipientCertPath;
    }

    @Override
    public ArchiveKeyMaterial get() {
        if (keystorePath.isBlank() || keyAlias.isBlank() || recipientCertPath.isBlank()) {
            throw new ApiException("Arquivamento não configurado (chaves ausentes)", HttpStatus.SERVICE_UNAVAILABLE);
        }
        try {
            KeyStore keyStore = KeyStore.getInstance("PKCS12");
            try (InputStream in = Files.newInputStream(Path.of(keystorePath))) {
                keyStore.load(in, keystorePassword.toCharArray());
            }
            PrivateKey signingKey = (PrivateKey) keyStore.getKey(keyAlias, keyPassword.toCharArray());
            X509Certificate signerCert = (X509Certificate) keyStore.getCertificate(keyAlias);
            if (signingKey == null || signerCert == null) {
                throw new ApiException("Alias de assinatura não encontrado no keystore: " + keyAlias,
                        HttpStatus.SERVICE_UNAVAILABLE);
            }

            X509Certificate recipientCert;
            try (InputStream in = Files.newInputStream(Path.of(recipientCertPath))) {
                recipientCert = (X509Certificate) CertificateFactory.getInstance("X.509").generateCertificate(in);
            }

            return new ArchiveKeyMaterial(signingKey, signerCert, recipientCert);
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException("Falha ao carregar chaves de arquivamento: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
