package wsssguardo.archive.crypto;

import java.security.Security;
import java.security.spec.MGF1ParameterSpec;

import javax.crypto.spec.OAEPParameterSpec;
import javax.crypto.spec.PSource;

import org.bouncycastle.asn1.pkcs.PKCSObjectIdentifiers;
import org.bouncycastle.asn1.x509.AlgorithmIdentifier;
import org.bouncycastle.cert.jcajce.JcaX509CertificateHolder;
import org.bouncycastle.cms.CMSAlgorithm;
import org.bouncycastle.cms.CMSEnvelopedDataGenerator;
import org.bouncycastle.cms.CMSProcessableByteArray;
import org.bouncycastle.cms.CMSSignedData;
import org.bouncycastle.cms.CMSSignedDataGenerator;
import org.bouncycastle.cms.CMSTypedData;
import org.bouncycastle.cms.jcajce.JcaSignerInfoGeneratorBuilder;
import org.bouncycastle.cms.jcajce.JceCMSContentEncryptorBuilder;
import org.bouncycastle.cms.jcajce.JceKeyTransRecipientInfoGenerator;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaAlgorithmParametersConverter;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.bouncycastle.operator.jcajce.JcaDigestCalculatorProviderBuilder;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import wsssguardo.shared.exception.ApiException;

/**
 * Assina e encripta o dump como CMS/PKCS#7 ({@code .p7m}):
 * <ol>
 *   <li>JSON → CMS SignedData (SHA256withRSA, chave do servidor) — integridade + autenticidade;</li>
 *   <li>SignedData → CMS EnvelopedData (AES-256-CBC + RSA-OAEP, cert do cofre) — confidencialidade.</li>
 * </ol>
 * Resultado em DER, interoperável com {@code openssl cms}.
 */
@Service
@RequiredArgsConstructor
public class ArchiveCryptoService {

    static {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
    }

    private final ArchiveKeyProvider keyProvider;

    /** Produz o conteúdo .p7m (signed-then-enveloped) a partir do JSON em claro. */
    public byte[] signAndEnvelope(byte[] plainJson) {
        ArchiveKeyMaterial keys = keyProvider.get();
        try {
            byte[] signed = sign(plainJson, keys);
            return envelope(signed, keys);
        } catch (Exception e) {
            throw new ApiException("Falha ao assinar/encriptar o dump: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private byte[] sign(byte[] content, ArchiveKeyMaterial keys) throws Exception {
        ContentSigner signer = new JcaContentSignerBuilder("SHA256withRSA")
                .setProvider(BouncyCastleProvider.PROVIDER_NAME)
                .build(keys.signingKey());

        CMSSignedDataGenerator gen = new CMSSignedDataGenerator();
        gen.addSignerInfoGenerator(new JcaSignerInfoGeneratorBuilder(
                new JcaDigestCalculatorProviderBuilder()
                        .setProvider(BouncyCastleProvider.PROVIDER_NAME).build())
                .build(signer, keys.signerCertificate()));
        gen.addCertificate(new JcaX509CertificateHolder(keys.signerCertificate()));

        CMSTypedData msg = new CMSProcessableByteArray(content);
        CMSSignedData signedData = gen.generate(msg, true); // encapsula o conteúdo
        return signedData.getEncoded();
    }

    private byte[] envelope(byte[] content, ArchiveKeyMaterial keys) throws Exception {
        JcaAlgorithmParametersConverter converter = new JcaAlgorithmParametersConverter();
        AlgorithmIdentifier oaep = converter.getAlgorithmIdentifier(
                PKCSObjectIdentifiers.id_RSAES_OAEP,
                new OAEPParameterSpec("SHA-256", "MGF1",
                        new MGF1ParameterSpec("SHA-256"), PSource.PSpecified.DEFAULT));

        CMSEnvelopedDataGenerator gen = new CMSEnvelopedDataGenerator();
        gen.addRecipientInfoGenerator(
                new JceKeyTransRecipientInfoGenerator(keys.recipientCertificate(), oaep)
                        .setProvider(BouncyCastleProvider.PROVIDER_NAME));

        return gen.generate(
                new CMSProcessableByteArray(content),
                new JceCMSContentEncryptorBuilder(CMSAlgorithm.AES256_CBC)
                        .setProvider(BouncyCastleProvider.PROVIDER_NAME).build())
                .getEncoded();
    }
}
