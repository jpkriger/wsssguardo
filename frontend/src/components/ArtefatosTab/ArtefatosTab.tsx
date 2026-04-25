import { Fragment, useState, type ReactElement } from "react";
import styles from "./ArtefatosTab.module.css";

type ArtefatoTipo = "nota" | "pdf" | "doc" | "planilha";

interface Artefato {
  id: number;
  nome: string;
  tipo: ArtefatoTipo;
  resumo: string;
  achadosLigados: number;
}

const MOCK_ARTEFATOS: Artefato[] = [
  { id: 1, nome: "Nota de entrevista", tipo: "nota", resumo: "Registro de entrevistas com lideranças da organização sobre os processos de segurança", achadosLigados: 1 },
  { id: 2, nome: "PDF exemplo", tipo: "pdf", resumo: "Registro de entrevistas com lideranças da organização sobre os processos de segurança", achadosLigados: 1 },
  { id: 3, nome: "Docx example", tipo: "doc", resumo: "Registro de entrevistas com lideranças da organização sobre os processos de segurança", achadosLigados: 1 },
  { id: 4, nome: "Exel example", tipo: "planilha", resumo: "Registro de entrevistas com lideranças da organização sobre os processos de segurança", achadosLigados: 1 },
  { id: 5, nome: "Nota de entrevista", tipo: "nota", resumo: "Registro de entrevistas com lideranças da organização sobre os processos de segurança", achadosLigados: 1 },
  { id: 6, nome: "Relatório de conformidade", tipo: "pdf", resumo: "Análise detalhada dos processos internos e conformidade com normas de segurança", achadosLigados: 2 },
  { id: 7, nome: "Política de acesso", tipo: "doc", resumo: "Documentação das políticas de controle de acesso e autenticação", achadosLigados: 3 },
  { id: 8, nome: "Inventário de ativos", tipo: "planilha", resumo: "Lista completa dos ativos críticos e suas classificações de risco", achadosLigados: 2 },
  { id: 9, nome: "Nota de campo", tipo: "nota", resumo: "Observações de campo durante auditoria presencial na sede da organização", achadosLigados: 1 },
  { id: 10, nome: "Certificado SSL", tipo: "pdf", resumo: "Documentação de certificados digitais e chaves criptográficas em uso", achadosLigados: 0 },
  { id: 11, nome: "Mapeamento de rede", tipo: "doc", resumo: "Diagrama e documentação completa da infraestrutura de rede interna", achadosLigados: 2 },
  { id: 12, nome: "Controles de acesso", tipo: "planilha", resumo: "Planilha de mapeamento de usuários, perfis e permissões por sistema", achadosLigados: 1 },
];

const TIPO_LABEL: Record<ArtefatoTipo, string> = {
  nota: "NOTA",
  pdf: "PDF",
  doc: "DOC",
  planilha: "PLANILHA",
};

const PAGE_SIZE = 5;
const TOTAL_PAGES = Math.ceil(MOCK_ARTEFATOS.length / PAGE_SIZE);

function FileIcon(): ReactElement {
  return (
    <svg
      width="11"
      height="13"
      viewBox="0 0 11 13"
      fill="none"
      className={styles.fileIcon}
      aria-hidden="true"
    >
      <path
        d="M1.5 1.5h5l2.5 2.5v7.5h-7.5v-10z"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 1.5v2.5h2.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NoteIcon(): ReactElement {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      className={styles.btnIcon}
      aria-hidden="true"
    >
      <rect x="1.5" y="1.5" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" fill="none" />
      <path d="M4 5h6M4 7.5h6M4 10h3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function getBadgeClass(tipo: ArtefatoTipo): string {
  if (tipo === "nota") return styles.badgeNota;
  if (tipo === "pdf") return styles.badgePdf;
  if (tipo === "doc") return styles.badgeDoc;
  return styles.badgePlanilha;
}

function buildPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | "...")[] = [1, 2, 3];
  if (current > 4) pages.push("...");
  if (current > 3 && current < total - 2) pages.push(current);
  pages.push("...");
  pages.push(total - 1, total);
  return pages;
}

export default function ArtefatosTab(): ReactElement {
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const start = (page - 1) * PAGE_SIZE;
  const pageItems = MOCK_ARTEFATOS.slice(start, start + PAGE_SIZE);
  const pageNumbers = buildPageNumbers(page, TOTAL_PAGES);

  function toggleExpand(id: number): void {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.actions}>
        <button className={styles.btnOutline} type="button">
          <span className={styles.plusIcon}>+</span>
          Adicionar artefato
        </button>
        <button className={styles.btnFilled} type="button">
          <NoteIcon />
          Fazer nota
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Artefatos coletados</h2>
          <p className={styles.cardSubtitle}>
            Documentos e notas que sustentam os achados da análise
          </p>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th} aria-label="Expandir" />
                <th className={styles.th}>Artefato</th>
                <th className={styles.th}>Tipo de arquivo</th>
                <th className={styles.th}>Resumo</th>
                <th className={`${styles.th} ${styles.thCenter}`}>
                  Achados ligados
                </th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((artefato) => (
                <Fragment key={artefato.id}>
                  <tr
                    className={`${styles.row} ${expandedId === artefato.id ? styles.rowExpanded : ""}`}
                  >
                    <td className={`${styles.td} ${styles.tdChevron}`}>
                      <button
                        className={styles.chevronBtn}
                        onClick={() => toggleExpand(artefato.id)}
                        aria-label={expandedId === artefato.id ? "Recolher" : "Expandir"}
                        type="button"
                      >
                        {expandedId === artefato.id ? "▴" : "▾"}
                      </button>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.artifactName}>{artefato.nome}</span>
                    </td>
                    <td className={styles.td}>
                      <span className={`${styles.badge} ${getBadgeClass(artefato.tipo)}`}>
                        <FileIcon />
                        {TIPO_LABEL[artefato.tipo]}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.resumo}>{artefato.resumo}</span>
                    </td>
                    <td className={`${styles.td} ${styles.tdCenter}`}>
                      <span className={styles.achadosCount}>{artefato.achadosLigados}</span>
                    </td>
                  </tr>
                  {expandedId === artefato.id && (
                    <tr className={styles.expandedRow}>
                      <td colSpan={5} className={styles.expandedCell}>
                        <div className={styles.expandedContent}>
                          <p className={styles.expandedText}>{artefato.resumo}</p>
                          <div className={styles.expandedActions}>
                            <button className={styles.expandedBtn} type="button">Editar</button>
                            <button className={styles.expandedBtn} type="button">Baixar</button>
                            <button className={`${styles.expandedBtn} ${styles.expandedBtnDelete}`} type="button">Excluir</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>
            Mostrando {start + 1}–{Math.min(start + PAGE_SIZE, MOCK_ARTEFATOS.length)} de{" "}
            {MOCK_ARTEFATOS.length} artefatos
          </span>
          <div className={styles.paginationControls}>
            <button
              className={styles.pageNav}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              type="button"
            >
              Anterior
            </button>
            {pageNumbers.map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className={styles.ellipsis}>
                  ···
                </span>
              ) : (
                <button
                  key={p}
                  className={`${styles.pageBtn} ${page === p ? styles.pageBtnActive : ""}`}
                  onClick={() => setPage(p)}
                  type="button"
                >
                  {p}
                </button>
              )
            )}
            <button
              className={`${styles.pageNav} ${styles.pageNavNext}`}
              onClick={() => setPage((p) => Math.min(TOTAL_PAGES, p + 1))}
              disabled={page === TOTAL_PAGES}
              type="button"
            >
              Próximo <span className={styles.navArrow}>›</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
