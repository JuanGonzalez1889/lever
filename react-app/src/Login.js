import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL;
console.log("API_URL (Login):", API_URL);

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Redirige automáticamente si ya hay sesión activa
  useEffect(() => {
    axios
      .get(`${API_URL}/api/check-session-admin`, { withCredentials: true }) 
      .then((res) => {
        if (res.data && res.data.success) {
          sessionStorage.setItem("usuario", res.data.username);
          onLogin();
          navigate("/dashboard");
        }
      })
      .catch((err) => {
        // No hay sesión, no hacer nada
      });
  }, [onLogin, navigate]);

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/api/login`,
        { username, password },
        { withCredentials: true }
      );
      if (response.data.success) {
        sessionStorage.setItem("usuario", response.data.username);
        sessionStorage.setItem("rol", response.data.rol);
        onLogin();
        navigate("/dashboard");
      } else {
        alert("Usuario o contraseña incorrectos");
      }
    } catch (error) {
      console.error("Error logging in:", error);
    }
  };

  return (
    <div className="formLogin">
      <h1>Login</h1>
      <div>
        <label>Usuario:</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div>
        <label>Contraseña:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button onClick={handleLogin}>Iniciar Sesión</button>
    </div>
  );
}

export default Login;
