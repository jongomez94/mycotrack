import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MapaDeMicelio from './pages/MapaDeMicelio';
import DetalleDeNodo from './pages/DetalleDeNodo';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapaDeMicelio />} />
        <Route path="/nodo/:id" element={<DetalleDeNodo />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
