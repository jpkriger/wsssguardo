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

import {
  LinkIcon,
  TrashIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  PencilIcon,
} from "lucide-react";

interface Asset {
  id: string;
  name: string;
  description: string;
  reference: string;
  linkedFindings: number;
}

const MOCK_ASSETS: Asset[] = Array.from({ length: 30 }, (_, i) => ({
  id: String(i + 1),
  name: String("Servidor " + (i + 1)),
  description: "ERP com dados sensíveis",
  reference: "https://www.google.com",
  linkedFindings: i,
}));

const PAGE_SIZE = 5;

async function deleteAsset(id: string): Promise<void> {
  // await fetch(`/api/assets/${id}`, { method: "DELETE" });
  await Promise.resolve();
  console.log("deleteAsset", id);
}

async function updateAsset(asset: Asset): Promise<void> {
  //  await fetch(`/api/assets/${asset.id}`, { method: "PUT", body: JSON.stringify(asset) });
  await Promise.resolve();
  console.log("updateAsset", asset);
}

export default function AssetTable(): ReactElement {
  const [assets, setAssets] = useState<Asset[]>(MOCK_ASSETS);
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(assets.length / PAGE_SIZE);
  const pageAssets = assets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleDelete(id: string): Promise<void> {
    await deleteAsset(id);
    setAssets((prev: Asset[]) => prev.filter((a: Asset) => a.id !== id));
  }

  async function handleEdit(asset: Asset): Promise<void> {
    await updateAsset(asset);
    // TODO: abrir modal de edição
  }

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
              <TableHead className="w-[15%]">Ativo</TableHead>
              <TableHead className="w-[30%]">Descrição</TableHead>
              <TableHead className="w-[15%]">Referência</TableHead>
              <TableHead className="text-center w-[15%]">
                Achados ligados
              </TableHead>
              <TableHead className="w-[3%]"></TableHead>
              <TableHead className="w-[3%]"></TableHead>
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
                <TableCell className="text-center">
                  <button
                    className="icon-button inline-flex items-center justify-center w-full"
                    onClick={() => {
                      void handleEdit(asset);
                    }}
                  >
                    <PencilIcon />
                  </button>
                </TableCell>
                <TableCell className="text-center">
                  <button
                    className="icon-button inline-flex items-center justify-center w-full"
                    onClick={() => {
                      void handleDelete(asset.id);
                    }}
                  >
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
          {Math.min(page * PAGE_SIZE, assets.length)} de {assets.length} ativos
        </span>

        <div className="flex items-center gap-1">
          <button
            className="page-button-nav flex items-center gap-1"
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
          >
            <ChevronLeftIcon /> Anterior
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
                <span key={`dots-${i}`} className="page-dots">…</span>
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
            className="page-button-nav flex items-center gap-1"
            onClick={() => setPage((p) => p + 1)}
            disabled={page === totalPages}
          >
            Próximo <ChevronRightIcon />
          </button>
        </div>
      </CardFooter>
    </Card>
  );
}