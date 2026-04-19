import { type ReactElement } from "react";
import { Outlet } from "react-router";
import styles from "./App.module.css";
import { ThemeProvider } from "./components/theme-provider";
import GlobalHeader from "./components/GlobalHeader/GlobalHeader";
import GlobalFooter from "./components/GlobalFooter/GlobalFooter";

export default function App(): ReactElement {
  return (
    <ThemeProvider>
      <div className="flex flex-col min-h-screen w-full">
        <nav>
          <GlobalHeader />
        </nav>

        <div className={styles.container}>
          <main className={styles.main}>
            <Outlet />
          </main>
        </div>

        <footer className="h-22 border-t border-border transition-colors duration-300 mt-auto">
          <GlobalFooter />
        </footer>
      </div>
    </ThemeProvider>
  );
}