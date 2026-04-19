import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import "./index.css";
import App from "./App.tsx";
import Project from "./pages/Project.tsx";
import ProjectsHome from "./pages/ProjectsHome";
import { ProjectProvider } from "./contexts/ProjectProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ProjectProvider>
        <Routes>
          <Route element={<App />}>
            <Route index element={<ProjectsHome />} />
            <Route path="project/:id" element={<Project />} />
            <Route path="/projects" element={<ProjectsHome />} />
            {/* Adicionar novas rotas aqui */}
          </Route>
        </Routes>
      </ProjectProvider>
    </BrowserRouter>
  </StrictMode>,
);
