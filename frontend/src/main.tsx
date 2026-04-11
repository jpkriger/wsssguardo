import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'
import './index.css'
import App from './App.tsx'
import Home from './pages/Home.tsx'
import Project from './pages/Project.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route index element={<Home />} />
          <Route path="project" element={<Project />} />
          {/* Adicionar novas rotas aqui */}
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
