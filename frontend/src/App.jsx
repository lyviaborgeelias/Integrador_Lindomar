import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Home from "./pages/Home";
import Sensores from "./pages/Sensores";
import Ambientes from "./pages/Ambientes";
import PrivateRoute from "./components/PrivateRoute";
import Historico from "./pages/Historico";
import Microcontroladores from "./pages/Microcontroladores";

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

        <Route
          path="/ambientes"
          element={
            <PrivateRoute>
              <Ambientes />
            </PrivateRoute>
          }
        />

        <Route
          path="/historico"
          element={
            <PrivateRoute>
              <Historico />
            </PrivateRoute>
          }
        />

        <Route 
          path="/microcontroladores" 
          element={
          <PrivateRoute>
          <Microcontroladores />
          </PrivateRoute>
        }
        />
      </Routes>
    </BrowserRouter>
  );
}