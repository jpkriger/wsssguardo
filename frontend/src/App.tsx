import { useEffect, useState, type FormEvent, type ReactElement } from "react";
import {
  listEntityObjects,
  createEntityObject,
  type EntityObjectResponse,
} from "./api/entityObject";
import { ApiErrorResponse } from "./api/errors";
import ArtifactList from "./components/ArtifactList/ArtifactList";
import NewNoteComposer from "./components/NewNoteComposer/NewNoteComposer";
import styles from "./App.module.css";

export default function App(): ReactElement {
  const [noteRefreshKey, setNoteRefreshKey] = useState(0);
  const [items, setItems] = useState<EntityObjectResponse[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleCreate(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const created = await createEntityObject({ name: name.trim() });
      setItems((prev) => [...prev, created]);
      setName("");
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
          <form onSubmit={(e) => void handleCreate(e)} className={styles.form}>
            <input
              className={styles.input}
              type="text"
              placeholder="Entity name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
            <button
              className={styles.button}
              type="submit"
              disabled={loading || !name.trim()}
            >
              {loading ? "Saving…" : "Create"}
            </button>
          </form>
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
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.card}>
          <ArtifactList refreshKey={noteRefreshKey} />
        </section>
      </main>
      <NewNoteComposer onSave={() => setNoteRefreshKey((k) => k + 1)} />
    </div>
  );
}
