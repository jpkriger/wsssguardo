import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import "./index.css";
import App from "./App.tsx";
import Project from "./pages/Project.tsx";
import ProjectReport from "./pages/ProjectReport.tsx";
import ProjectsHome from "./pages/ProjectsHome";
import Companies from "./pages/Companies";
import GenericTableDemo from "./pages/GenericTableDemo";
import Profile from "./pages/Profile";
import { ProjectProvider } from "./contexts/ProjectProvider";
import { AuthProvider } from "./contexts/AuthProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ProjectProvider>
          <Routes>
            <Route element={<App />}>
              <Route path="/login" element={<Login />} />
              <Route element={<ProtectedRoute />}>
                <Route index element={<ProjectsHome />} />
                <Route path="project/:id" element={<Project />} />
                <Route path="project/:id/relatorio" element={<ProjectReport />} />
                <Route path="projeto/:id/relatorio" element={<ProjectReport />} />
                <Route path="/projects" element={<ProjectsHome />} />
                <Route path="/companies" element={<Companies />} />
                <Route path="/generic-table-demo" element={<GenericTableDemo />} />
                <Route path="/profile" element={<Profile />} />
                {/* Adicionar novas rotas aqui */}
              </Route>
            </Route>
          </Routes>
        </ProjectProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
