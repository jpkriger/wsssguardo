package wsssguardo.archive;

import java.math.BigInteger;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.Security;
import java.security.cert.X509Certificate;
import java.util.Date;

import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.cert.X509CertificateHolder;
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter;
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;

import wsssguardo.archive.crypto.ArchiveKeyMaterial;

/**
 * Gera, em memória, um par de assinatura (servidor) e um par recipiente (cofre)
 * com certificados X.509 auto-assinados, para os testes de arquivamento.
 */
public class ArchiveTestKeys {

    static {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
    }

    private final KeyPair signer;
    private final X509Certificate signerCert;
    private final KeyPair recipient;
    private final X509Certificate recipientCert;

    public ArchiveTestKeys() {
        try {
            this.signer = generateRsa();
            this.signerCert = selfSigned(signer, "CN=test-signer");
            this.recipient = generateRsa();
            this.recipientCert = selfSigned(recipient, "CN=test-vault");
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao gerar chaves de teste", e);
        }
    }

    public ArchiveKeyMaterial material() {
        return new ArchiveKeyMaterial(signer.getPrivate(), signerCert, recipientCert);
    }

    /** Chave privada do cofre — usada nos testes para decriptar o .p7m. */
    public PrivateKey recipientPrivateKey() {
        return recipient.getPrivate();
    }

    public X509Certificate signerCertificate() {
        return signerCert;
    }

    private static KeyPair generateRsa() throws Exception {
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(2048);
        return kpg.generateKeyPair();
    }

    private static X509Certificate selfSigned(KeyPair kp, String dn) throws Exception {
        X500Name name = new X500Name(dn);
        Date from = new Date();
        Date to = new Date(from.getTime() + 365L * 24 * 60 * 60 * 1000);
        JcaX509v3CertificateBuilder builder = new JcaX509v3CertificateBuilder(
                name, BigInteger.valueOf(System.nanoTime()), from, to, name, kp.getPublic());
        ContentSigner signer = new JcaContentSignerBuilder("SHA256withRSA")
                .setProvider(BouncyCastleProvider.PROVIDER_NAME).build(kp.getPrivate());
        X509CertificateHolder holder = builder.build(signer);
        return new JcaX509CertificateConverter()
                .setProvider(BouncyCastleProvider.PROVIDER_NAME).getCertificate(holder);
    }
}
