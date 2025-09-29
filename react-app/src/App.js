import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Login from "./Login";
import Dashboard from "./Dashboard";
import FrancesSimulador from "./FrancesSimulador";
import CuadroCredito from "./CuadroCredito";
import Cotizador from "./Cotizador"; // Agrega el import arriba


const API_URL = process.env.REACT_APP_API_URL; // Leer la URL desde .env
console.log("API_URL (App):", API_URL); // Verificar que se está utilizando el .env

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(`${API_URL}/api/check-session`, {
          credentials: "include",
        });
        if (response.status === 200) {
          setIsAuthenticated(true);
          setSessionExpired(false);
        } else {
          setIsAuthenticated(false);
          setSessionExpired(true);
        }
      } catch (error) {
        setIsAuthenticated(false);
        setSessionExpired(true);
      }
    };

    checkSession();

    const interval = setInterval(() => {
      checkSession();
    }, 1000000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      {sessionExpired && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            background: "#ffc",
            color: "#a00",
            zIndex: 9999,
            textAlign: "center",
            padding: 10,
          }}
        >
          Tu sesión expiró. Por favor, vuelve a iniciar sesión.
        </div>
      )}
      <Routes>
        <Route
          path="/login"
          element={
            <Login
              onLogin={() => {
                setIsAuthenticated(true);
                setSessionExpired(false);
              }}
            />
          }
        />
    
        {/* El resto del dashboard sí requiere sesión */}
        <Route
          path="/dashboard/*"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route path="/frances-simulador" element={<FrancesSimulador />} />
        <Route path="/cuadro-credito" element={<CuadroCredito />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
