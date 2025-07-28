import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';

const API_URL = "https://api.lever.com.ar"; // Leer la URL desde .env
console.log('API_URL (App):', API_URL); // Verificar que se está utilizando el .env

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const checkSession = async () => {
            try {
                const response = await fetch(
                    `${API_URL}/api/check-session`, // Usar la URL global
                    { credentials: "include" }
                );
                if (response.status === 200) {
                    setIsAuthenticated(true);
                } else {
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error('Error checking session:', error);
                setIsAuthenticated(false);
            }
        };

        checkSession();

        const interval = setInterval(() => {
            checkSession();
        }, 300000); // 5 minutos en milisegundos

        return () => clearInterval(interval);
    }, []);

    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
                <Route path="/dashboard/*" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}

export default App;
