import { useEffect, useState, type ReactElement } from "react";
import styles from "./AssetModal.module.css";

interface AssetModalAsset {
  id: number;
  name?: string;
  description?: string;
  reference?: string;
}

interface AssetModalSubmitData {
  id?: number;
  name: string;
  description: string;
  reference: string;
}

interface AssetModalProps {
  open: boolean;
  loading: boolean;
  mode: "create" | "edit";
  asset?: AssetModalAsset | null;
  theme?: "light" | "dark";
  onClose: () => void;
  onSubmit: (data: AssetModalSubmitData) => void;
}

export default function AssetModal({
  open,
  loading,
  mode,
  asset = null,
  theme = "light",
  onClose,
  onSubmit,
}: AssetModalProps): ReactElement | null {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && asset) {
      setName(asset.name ?? "");
      setDescription(asset.description ?? "");
      setReference(asset.reference ?? "");
      return;
    }

    setName("");
    setDescription("");
    setReference("");
  }, [open, mode, asset]);

  if (!open) return null;

  const title =
    mode === "create" ? "Adicionar Ativo" : "Visualizar e editar ativo";

  const subtitle =
    mode === "create"
      ? "Registre um novo ativo vinculado ao projeto"
      : "Revise e ajuste os dados do ativo selecionado";

  const primaryButtonLabel = loading
    ? mode === "create"
      ? "Registrando..."
      : "Salvando..."
    : mode === "create"
      ? "Registrar ativo"
      : "Salvar alterações";

  const isSubmitDisabled =
    loading || !name.trim() || !description.trim() || !reference.trim();

  function handleSubmit(): void {
    if (mode === "edit" && !asset?.id) return;

    onSubmit({
      id: mode === "edit" ? asset?.id : undefined,
      name: name.trim(),
      description: description.trim(),
      reference: reference.trim(),
    });
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer} data-theme={theme}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{title}</h2>
          <p className={styles.modalSubtitle}>{subtitle}</p>
        </div>

        <div className={styles.modalBody}>
          <input
            className={styles.modalInput}
            type="text"
            placeholder="Nome do ativo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />

          <input
            className={styles.modalInput}
            type="text"
            placeholder="Descrição do ativo"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />

          <textarea
            className={styles.modalTextarea}
            placeholder="Referência"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            disabled={loading}
          />

          <div className={styles.modalFooter}>
            <button
              className={styles.modalCancel}
              type="button"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>

            <button
              className={styles.modalCreate}
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitDisabled}
            >
              {primaryButtonLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}