import React, { useEffect, useState } from "react";
import axios from "axios";
import AgenciaEditModal from "./AgenciaEditModal";

function AgenciasPanel() {
  const [agencias, setAgencias] = useState([]);
  const [agentes, setAgentes] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [editAgencia, setEditAgencia] = useState(null);

  useEffect(() => {
    axios.get("/api/agencias").then((res) => {
      if (res.data.success) setAgencias(res.data.agencias);
    });
    axios.get("/api/agentes").then((res) => {
      if (res.data.success) setAgentes(res.data.agentes);
    });
    axios.get("/api/provincias").then((res) => {
      if (res.data.success) setProvincias(res.data.provincias);
    });
  }, []);

  return (
    <div className="container my-4">
      <h2>Agencias</h2>
      <table className="table table-hover rounded shadow-sm">
        <thead className="table-light">
          <tr>
            <th>Nombre</th>
            <th>Agente</th>
            <th>Comisión</th>
            <th>Localidad</th>
            <th>Provincia</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {agencias.map((ag) => (
            <tr key={ag.id}>
              <td>{ag.nombre}</td>
              <td>{ag.agente}</td>
              <td>{ag.comision}%</td>
              <td>{ag.localidad}</td>
              <td>{ag.provincia}</td>
              <td>
                <button
                  className="btn btn-light"
                  onClick={() => setEditAgencia(ag)}
                >
                  <span style={{ fontSize: 22 }}>⋮</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {editAgencia && (
        <AgenciaEditModal
          agencia={editAgencia}
          agentes={agentes}
          provincias={provincias}
          onClose={() => setEditAgencia(null)}
          onSave={() => {
            setEditAgencia(null);
            axios.get("/api/agencias").then((res) => {
              if (res.data.success) setAgencias(res.data.agencias);
            });
          }}
        />
      )}
    </div>
  );
}

export default AgenciasPanel;
