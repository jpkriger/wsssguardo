package wsssguardo.archive.domain;

public enum ArchiveStatus {
    /** Dump gerado e baixado, aguardando confirmação do backup antes da purga. */
    PENDING_DOWNLOAD,
    /** Backup confirmado (hash conferido); linhas do projeto purgadas. */
    CONFIRMED
}
