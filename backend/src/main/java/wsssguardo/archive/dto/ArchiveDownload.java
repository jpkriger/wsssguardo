package wsssguardo.archive.dto;

/** Resultado do arquivamento: o nome do arquivo e o conteúdo .p7m a baixar. */
public record ArchiveDownload(String fileName, byte[] content) {
}
