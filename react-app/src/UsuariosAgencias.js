import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "https://api.lever.com.ar";

export default function UsuariosAgencias() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/admin/usuarios`, { withCredentials: true })
      .then((res) => setUsuarios(res.data))
      .catch(() => setUsuarios([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Cargando...</div>;

  return (
    <div style={{ padding: 24, color: "white" }}>
      <h2>Usuarios registrados</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Agencia</th>
            <th>Teléfono</th>
            <th>Fecha registro</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.nombre_completo}</td>
              <td>{u.email}</td>
              <td>{u.agencia}</td>
              <td>{u.telefono}</td>
              <td>
                {u.created_at && u.created_at.slice(0, 19).replace("T", " ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
