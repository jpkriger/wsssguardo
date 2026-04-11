import { useState, type ReactElement } from "react";
import "./AssetTable.css";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { LinkIcon, TrashIcon } from "lucide-react";

interface Asset {
  id: string;
  name: string;
  description: string;
  reference: string;
  linkedFindings: number;
}

const MOCK_ASSETS: Asset[] = Array.from({ length: 40 }, (_, i) => ({
  id: String(i + 1),
  name: String("Servidor " + (i + 1)),
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
    <Card>
      <CardHeader>
        <CardTitle>Ativos</CardTitle>
        <CardDescription>
          Ativos registrados e vinculados ao escopo da avaliação
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table className="Table">
          <TableHeader>
            <TableRow>
              <TableHead>Ativos</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Referência</TableHead>
              <TableHead className="text-center">Achados ligados</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageAssets.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell>{asset.name}</TableCell>
                <TableCell>{asset.description}</TableCell>
                <TableCell>
                  <div className="ref-cell">
                    <span className="ref-cell-text">
                      {asset.reference.slice(0, 20)}…
                    </span>
                    <button
                      onClick={() => window.open(asset.reference, "_blank")}
                      className="icon-button"
                    >
                      <LinkIcon />
                    </button>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {asset.linkedFindings}
                </TableCell>
                <TableCell>
                  <button className="icon-button">
                    <TrashIcon className="text-red-500" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex justify-between items-center w-full">
        <span className="page-info">
          Mostrando {(page - 1) * PAGE_SIZE + 1}–
          {Math.min(page * PAGE_SIZE, MOCK_ASSETS.length)} de{" "}
          {MOCK_ASSETS.length} ativos
        </span>

        <div className="flex items-center gap-1">
          <button
            className="page-button-nav"
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
          >
            ← Anterior
          </button>

          {(() => {
            const pages: (number | string)[] = [];

            if (totalPages <= 5) {
              for (let i = 1; i <= totalPages; i++) pages.push(i);
            } else if (page <= 3) {
              pages.push(1, 2, 3, "...", totalPages);
            } else if (page >= totalPages - 2) {
              pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
            } else {
              pages.push(1, "...", page, "...", totalPages);
            }

            return pages.map((p, i) =>
              p === "..." ? (
                <span key={`dots-${i}`} className="page-dots">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  className={`page-button ${p === page ? "page-button-active" : ""}`}
                  onClick={() => setPage(p as number)}
                >
                  {p}
                </button>
              ),
            );
          })()}

          <button
            className="page-button-nav"
            onClick={() => setPage((p) => p + 1)}
            disabled={page === totalPages}
          >
            Próximo →
          </button>
        </div>
      </CardFooter>
    </Card>
  );
}
