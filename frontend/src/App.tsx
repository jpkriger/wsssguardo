import { type ReactElement } from "react";
import { Outlet } from "react-router";
import styles from "./App.module.css";
import { ThemeProvider } from "./components/theme-provider";
import GlobalHeader from "./components/GlobalHeader/GlobalHeader";
import GlobalFooter from "./components/GlobalFooter/GlobalFooter";
import { Toaster } from "./components/ui/sonner";

export default function App(): ReactElement {
  return (
    <ThemeProvider>
      <Toaster />
      <nav>
        <GlobalHeader />
      </nav>

      <div className={styles.container}>
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
      <footer className="border-t border-border py-6 transition-colors duration-300">
        <GlobalFooter />
      </footer>

    </ThemeProvider>
  );
}
