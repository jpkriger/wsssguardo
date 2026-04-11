import { type ReactElement } from "react";
import { Outlet } from "react-router";
import { ThemeProvider } from "./components/theme-provider";

export default function App(): ReactElement {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background transition-colors duration-300 flex flex-col">
        <nav>
          {/* HEADER GLOBAL VAI AQUI */}
        </nav>

        <main className="mx-auto max-w-7xl w-full px-6 lg:px-8 py-8 flex-1">
          <Outlet />
        </main>
      </div>
    </ThemeProvider>
  );
}