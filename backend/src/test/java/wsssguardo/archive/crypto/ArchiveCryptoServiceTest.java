package wsssguardo.archive.crypto;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;

import org.bouncycastle.cms.CMSEnvelopedData;
import org.bouncycastle.cms.CMSSignedData;
import org.bouncycastle.cms.RecipientInformation;
import org.bouncycastle.cms.SignerInformation;
import org.bouncycastle.cms.jcajce.JcaSimpleSignerInfoVerifierBuilder;
import org.bouncycastle.cms.jcajce.JceKeyTransEnvelopedRecipient;
import org.bouncycastle.cert.X509CertificateHolder;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.junit.jupiter.api.Test;

import wsssguardo.archive.ArchiveTestKeys;

class ArchiveCryptoServiceTest {

    private final ArchiveTestKeys keys = new ArchiveTestKeys();
    private final ArchiveCryptoService crypto = new ArchiveCryptoService(keys::material);

    @Test
    void signAndEnvelopeShouldRoundTripBackToOriginalJsonAndVerifySignature() throws Exception {
        byte[] original = "{\"schemaVersion\":1,\"project\":\"alpha\"}".getBytes(StandardCharsets.UTF_8);

        byte[] p7m = crypto.signAndEnvelope(original);

        // 1. Decripta com a chave privada do cofre.
        CMSEnvelopedData enveloped = new CMSEnvelopedData(p7m);
        RecipientInformation recipient = enveloped.getRecipientInfos().getRecipients().iterator().next();
        byte[] signedBytes = recipient.getContent(
                new JceKeyTransEnvelopedRecipient(keys.recipientPrivateKey())
                        .setProvider(BouncyCastleProvider.PROVIDER_NAME));

        // 2. Verifica a assinatura com o cert do servidor.
        CMSSignedData signedData = new CMSSignedData(signedBytes);
        SignerInformation signerInfo = signedData.getSignerInfos().getSigners().iterator().next();
        X509CertificateHolder certHolder = (X509CertificateHolder) signedData.getCertificates()
                .getMatches(signerInfo.getSID()).iterator().next();
        boolean verified = signerInfo.verify(new JcaSimpleSignerInfoVerifierBuilder()
                .setProvider(BouncyCastleProvider.PROVIDER_NAME).build(certHolder));

        assertThat(verified).isTrue();
        assertThat((byte[]) signedData.getSignedContent().getContent()).isEqualTo(original);
    }

    @Test
    void wrongRecipientKeyShouldNotDecrypt() throws Exception {
        byte[] p7m = crypto.signAndEnvelope("payload".getBytes(StandardCharsets.UTF_8));
        ArchiveTestKeys otherKeys = new ArchiveTestKeys();

        CMSEnvelopedData enveloped = new CMSEnvelopedData(p7m);
        RecipientInformation recipient = enveloped.getRecipientInfos().getRecipients().iterator().next();

        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
                recipient.getContent(new JceKeyTransEnvelopedRecipient(otherKeys.recipientPrivateKey())
                        .setProvider(BouncyCastleProvider.PROVIDER_NAME)))
                .isInstanceOf(Exception.class);
    }
}
