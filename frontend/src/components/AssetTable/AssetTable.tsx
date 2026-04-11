import { useState, type ReactElement } from "react";
import "./AssetTable.css";

interface Asset {
  id: string;
  name: string;
  description: string;
  reference: string;
  linkedFindings: number;
}

const MOCK_ASSETS: Asset[] = Array.from({ length: 18 }, (_, i) => ({
  id: String(i + 1),
  name: String ("Servidor " + (i+1)),
  description: "ERP com dados sensíveis",
  reference: "https://www.google.com",
  linkedFindings: i++,
}));

const PAGE_SIZE = 5;

export default function AssetTable(): ReactElement {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(MOCK_ASSETS.length / PAGE_SIZE);
  const pageAssets = MOCK_ASSETS.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Ativos</th>
          <th>Descrição</th>
          <th>Referência</th>
          <th className="linkedF">Achados ligados</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {pageAssets.map((asset) => (
          <tr key={asset.id}>
            <td>{asset.name}</td>
            <td>{asset.description}</td>
            <td>
              <div className="ref-cell">
                <span className="ref-cell-text">
                  {asset.reference.slice(0, 20)}…
                </span>
                <button onClick={() => window.open(asset.reference, '_blank')} className="icon-button">🔗</button>
              </div>
            </td>
            <td className="linkedF">{asset.linkedFindings}</td>
            <td>
              <button className="icon-button" aria-label="icon">
                🗑
              </button>
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td colSpan={5}>
            <div className="pagination">
              <span className="page-info">
                Mostrando {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, MOCK_ASSETS.length)} de{" "}
                {MOCK_ASSETS.length} ativos
              </span>

              <button
                className="page-button-nav"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
              >
                ← Anterior
              </button>

              <button
                className={`page-button ${page === 1 ? "page-button-active" : ""}`}
                onClick={() => setPage(1)}
              >
                1
              </button>

              {page > 3 && <span className="page-dots">…</span>}

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) => p !== 1 && p !== totalPages && Math.abs(p - page) <= 1,
                )
                .map((p) => (
                  <button
                    key={p}
                    className={`page-button ${p === page ? "page-button-active" : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}

              {page < totalPages - 2 && <span className="page-dots">…</span>}

              {totalPages > 1 && (
                <button
                  className={`page-button ${page === totalPages ? "page-button-active" : ""}`}
                  onClick={() => setPage(totalPages)}
                >
                  {totalPages}
                </button>
              )}

              <button
                className="page-button-nav page-button-next"
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
              >
                Próximo →
              </button>
            </div>
          </td>
        </tr>
      </tfoot>
    </table>
  );
}
