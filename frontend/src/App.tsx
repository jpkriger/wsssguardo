import { ReactElement } from "react";
import { ThemeProvider } from "./components/theme-provider";
import { Outlet } from "react-router"
import { GlobalHeader } from "./components/GlobalHeader/GlobalHeader";
import { GlobalFooter } from "./components/GlobalFooter/GlobalFooter";

export default function App(): ReactElement {

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background transition-colors duration-300 flex flex-col">
        <nav className="w-full border-b border-border bg-background">
          <div className="mx-auto px-6 lg:px-24 max-w-[1280px]">
            <GlobalHeader />
          </div>
        </nav>

        <main className="mx-auto max-w-7xl w-full px-6 lg:px-8 py-8 flex-1">
          <Outlet />
        </main>

        <footer className="border-t border-border bg-background w-full">
          <div className="mx-auto px-6 lg:px-24 max-w-[1280px]">
            <GlobalFooter />
          </div>
        </footer>

      </div>
    </ThemeProvider>
  );
}
