import { type ReactElement } from "react";
import { Outlet } from "react-router";
import { ThemeProvider } from "./components/theme-provider";
import GlobalHeader from "./components/GlobalHeader/GlobalHeader";
import GlobalFooter from "./components/GlobalFooter/GlobalFooter";
import { Toaster } from "./components/ui/sonner";

export default function App(): ReactElement {
  return (
    <ThemeProvider>
      <Toaster />
      <div className="flex flex-col min-h-screen w-full">
        <nav>
          <GlobalHeader />
        </nav>

        {/* .container */}
        <div className="flex flex-1 min-h-0 w-full mx-auto px-40 py-4">
          {/* .main */}
          <main className="flex-1 min-h-0 flex flex-col gap-6">
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