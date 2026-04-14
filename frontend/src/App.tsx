import { useEffect, useState, type ReactElement } from "react";
import {
  listEntityObjects,
  createEntityObject,
  getEntityObjectById,
  updateEntityObject,
  type EntityObjectResponse,
} from "./api/entityObject";
import { ApiErrorResponse } from "./api/errors";
import ArtifactList from "./components/ArtifactList/ArtifactList";
import NewNoteComposer from "./components/NewNoteComposer/NewNoteComposer";
import AssetModal from "./components/AssetModal/AssetModal";
import styles from "./App.module.css";

interface EditableAsset {
  id: number;
  name: string;
  description: string;
  reference: string;
}

export default function App(): ReactElement {
  const [noteRefreshKey, setNoteRefreshKey] = useState(0);
  const [items, setItems] = useState<EntityObjectResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<EditableAsset | null>(null);

  useEffect(() => {
    void fetchItems();
  }, []);

  async function fetchItems(): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      setItems(await listEntityObjects());
    } catch (e) {
      if (e instanceof ApiErrorResponse) {
        setError(e.getUserMessage());
      } else {
        setError(e instanceof Error ? e.message : "Unknown error");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreateModal(): void {
    setOpenCreateModal(true);
  }

  function handleCloseCreateModal(): void {
    setOpenCreateModal(false);
  }

  async function handleOpenEditModal(item: EntityObjectResponse): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const fullAsset = await getEntityObjectById(item.id);

      setSelectedAsset({
        id: fullAsset.id,
        name: fullAsset.name,
        description: "",
        reference: "",
      });

      setOpenEditModal(true);
    } catch (e) {
      if (e instanceof ApiErrorResponse) {
        setError(e.getUserMessage());
      } else {
        setError(e instanceof Error ? e.message : "Unknown error");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleCloseEditModal(): void {
    setSelectedAsset(null);
    setOpenEditModal(false);
  }

  async function handleCreateAsset(data: {
    id?: number;
    name: string;
    description: string;
    reference: string;
  }): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const created = await createEntityObject({
        name: data.name,
        description: data.description,
        reference: data.reference,
        project_id: 0,
      });

      setItems((prev) => [...prev, created]);
      handleCloseCreateModal();
    } catch (e) {
      if (e instanceof ApiErrorResponse) {
        setError(e.getUserMessage());
      } else {
        setError(e instanceof Error ? e.message : "Unknown error");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateAsset(data: {
    id?: number;
    name: string;
    description: string;
    reference: string;
  }): Promise<void> {
    if (!data.id) return;

    setLoading(true);
    setError(null);

    try {
      const updated = await updateEntityObject(data.id, {
        name: data.name,
        description: data.description,
        reference: data.reference,
        project_id: 0,
      });

      setItems((prev) =>
        prev.map((item) =>
          item.id === updated.id
            ? {
                ...item,
                name: updated.name,
              }
            : item,
        ),
      );

      handleCloseEditModal();
    } catch (e) {
      if (e instanceof ApiErrorResponse) {
        setError(e.getUserMessage());
      } else {
        setError(e instanceof Error ? e.message : "Unknown error");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>wsssguardo</h1>
        <p>Sample React + Vite + Bun frontend</p>
      </header>

      <main className={styles.main}>
        <section className={styles.card}>
          <h2>Create Entity</h2>

          <button
            className={styles.button}
            type="button"
            onClick={handleOpenCreateModal}
            disabled={loading}
          >
            Novo ativo
          </button>
        </section>

        <section className={styles.card}>
          <h2>Entity Objects</h2>

          {error && <p className={styles.error}>{error}</p>}

          {loading && items.length === 0 && (
            <p className={styles.muted}>Loading…</p>
          )}

          {!loading && items.length === 0 && !error && (
            <p className={styles.muted}>No entities yet. Create one above.</p>
          )}

          <ul className={styles.list}>
            {items.map((item) => (
              <li key={item.id} className={styles.listItem}>
                <span className={styles.badge}>#{item.id}</span>
                <span className={styles.itemName}>{item.name}</span>
                <span className={styles.muted}>
                  {new Date(item.createdAt).toLocaleString()}
                </span>

                <button
                  type="button"
                  className={styles.button}
                  onClick={() => void handleOpenEditModal(item)}
                  disabled={loading}
                >
                  Editar
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.card}>
          <ArtifactList refreshKey={noteRefreshKey} />
        </section>
      </main>

      <NewNoteComposer onSave={() => setNoteRefreshKey((k) => k + 1)} />

      <AssetModal
        open={openCreateModal}
        loading={loading}
        mode="create"
        theme="dark"
        onClose={handleCloseCreateModal}
        onSubmit={(data) => void handleCreateAsset(data)}
      />

      <AssetModal
        open={openEditModal}
        loading={loading}
        mode="edit"
        theme="dark"
        asset={selectedAsset}
        onClose={handleCloseEditModal}
        onSubmit={(data) => void handleUpdateAsset(data)}
      />
    </div>
  );
}