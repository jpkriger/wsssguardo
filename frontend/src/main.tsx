import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import "./index.css";
import App from "./App.tsx";
import Project from "./pages/Project.tsx";
import ProjectsHome from "./pages/ProjectsHome";
import Companies from "./pages/Companies";
import { ProjectProvider } from "./contexts/ProjectProvider";
import Login from "./pages/Login.tsx";
import MFAChallenge from "./pages/MFAChallenge.tsx";
import MFAVerification from "./pages/MFAVerification.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ProjectProvider>
        <Routes>
          <Route element={<App />}>
            <Route index element={<ProjectsHome />} />
            <Route path="project/:id" element={<Project />} />
            <Route path="/projects" element={<ProjectsHome />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/login" element={<Login />} />
            <Route path="/mfa" element={<MFAChallenge />} />
            <Route path="/mfa/setup" element={<MFAVerification />} />
            {/* Adicionar novas rotas aqui */}
          </Route>
        </Routes>
      </ProjectProvider>
    </BrowserRouter>
  </StrictMode>,
);
