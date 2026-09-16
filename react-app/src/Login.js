import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";

const API_URL = process.env.REACT_APP_API_URL;
console.log("API_URL (Login):", API_URL);

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [showBlockedModal, setShowBlockedModal] = useState(false);

  // Mostrar modal si la URL contiene ?blocked=1 (ej. Google OAuth redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("blocked") === "1") {
      setShowBlockedModal(true);
    }
  }, []);

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
      if (response.status === 403 || response.data?.message === 'Usuario bloqueado') {
        setShowBlockedModal(true);
        return;
      }
      if (response.data.success) {
        sessionStorage.setItem("usuario", response.data.username);
        sessionStorage.setItem("rol", response.data.rol);
        onLogin();
        navigate("/dashboard");
      } else {
        alert("Usuario o contraseña incorrectos");
      }
    } catch (error) {
      if (error?.response?.status === 403 || error?.response?.data?.message === 'Usuario bloqueado') {
        setShowBlockedModal(true);
        return;
      }
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

      <Modal show={showBlockedModal} onHide={() => setShowBlockedModal(false)} centered>
        <Modal.Header>
          <Modal.Title>Cuenta bloqueada</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Es necesario que se contacte por WhatsApp al +54 9 3416 93-7877 para validar datos y poder operar.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => { window.location.href = 'https://wa.me/5493416937877'; }}>
            Contactar por WhatsApp
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Login;
