import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Home from "./pages/Home";
import Sensores from "./pages/Sensores";
import Ambientes from "./pages/Ambientes"; // 👈 IMPORTANTE
import PrivateRoute from "./components/PrivateRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/home"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />

        <Route
          path="/sensores"
          element={
            <PrivateRoute>
              <Sensores />
            </PrivateRoute>
          }
        />

        {/* 👇 NOVA ROTA */}
        <Route
          path="/ambientes"
          element={
            <PrivateRoute>
              <Ambientes />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}