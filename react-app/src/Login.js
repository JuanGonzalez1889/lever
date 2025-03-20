import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL; // Leer la URL desde .env
console.log('API_URL (Login):', API_URL); // Verificar que se está utilizando el .env

function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            const response = await axios.post(
                `${API_URL}/api/login`, // Usar la URL global
                { username, password },
                { withCredentials: true }
            );
            if (response.data.success) {
                onLogin();
                navigate('/dashboard');
            } else {
                alert('Usuario o contraseña incorrectos');
            }
        } catch (error) {
            console.error('Error logging in:', error);
        }
    };

    return (
        <div className='formLogin'>
            <h1>Login</h1>
            <div>
                <label>Usuario:</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div>
                <label>Contraseña:</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button onClick={handleLogin}>Iniciar Sesión</button>
        </div>
    );
}

export default Login;
