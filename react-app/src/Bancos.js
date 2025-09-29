import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

function Bancos() {
  const [bancos, setBancos] = useState([]);
  const [nuevoBanco, setNuevoBanco] = useState("");
  const [nuevaPrioridad, setNuevaPrioridad] = useState(0);
  const [mensaje, setMensaje] = useState("");

  const cargarBancos = async () => {
    const res = await axios.get(`${API_URL}/api/bancos`);
    if (res.data.success) setBancos(res.data.bancos);
  };

  useEffect(() => {
    cargarBancos();
  }, []);

  const agregarBanco = async () => {
    if (!nuevoBanco) return;
    await axios.post(`${API_URL}/api/bancos`, {
      nombre: nuevoBanco.toUpperCase(),
      prioridad: nuevaPrioridad,
    });
    setNuevoBanco("");
    setNuevaPrioridad(0);
    setMensaje("Banco agregado");
    cargarBancos();
    setTimeout(() => setMensaje(""), 1000);
  };

  const eliminarBanco = async (id) => {
    await axios.delete(`${API_URL}/api/bancos/${id}`);
    setMensaje("Banco eliminado");
    cargarBancos();
    setTimeout(() => setMensaje(""), 1000);
  };

  const editarPrioridad = async (id, prioridad, nombre) => {
    await axios.put(`${API_URL}/api/bancos/${id}`, {
      prioridad,
      nombre: nombre.toUpperCase(),
    });
    setMensaje("Prioridad actualizada");
    cargarBancos();
    setTimeout(() => setMensaje(""), 1000);
  };

  const handlePrioridadChange = (id, value) => {
    setBancos((prev) =>
      prev.map((banco) =>
        banco.id === id ? { ...banco, prioridad: value } : banco
      )
    );
  };

  return (
    <div className="container my-5" style={{ maxWidth: 600 }}>
      <div className="card shadow rounded-4">
        <div className="card-header bg-primary text-white rounded-top-4">
          <b>Administrar Bancos</b>
        </div>
        <div className="card-body">
          <form
            className="row g-2 align-items-center mb-4"
            onSubmit={(e) => {
              e.preventDefault();
              agregarBanco();
            }}
          >
            <div className="col-12 col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="Nuevo banco"
                value={nuevoBanco}
                onChange={(e) => setNuevoBanco(e.target.value.toUpperCase())}
              />
            </div>
            <div className="col-12 col-md-4">
              <input
                type="number"
                className="form-control"
                placeholder="Prioridad"
                value={nuevaPrioridad}
                onChange={(e) => setNuevaPrioridad(e.target.value)}
                min={0}
              />
            </div>
            <div className="col-12 col-md-2 d-grid">
              <button type="submit" className="btn btn-success">
                Agregar
              </button>
            </div>
          </form>
          {mensaje && (
            <div className="alert alert-info py-2 text-center">{mensaje}</div>
          )}
          <table className="table table-hover align-middle rounded shadow-sm">
            <thead className="table-light">
              <tr>
                <th>Banco</th>
                <th>Prioridad</th>
                <th style={{ width: 110 }}>Guardar</th>
                <th style={{ width: 110 }}>Eliminar</th>
              </tr>
            </thead>
            <tbody>
              {bancos.map((banco) => (
                <tr key={banco.id}>
                  <td className="fw-semibold">{banco.nombre.toUpperCase()}</td>
                  <td>
                    <input
                      type="number"
                      className="form-control"
                      value={banco.prioridad}
                      onChange={(e) =>
                        handlePrioridadChange(banco.id, e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <button
                      className="btn btn-success btn-sm w-100"
                      onClick={() =>
                        editarPrioridad(banco.id, banco.prioridad, banco.nombre)
                      }
                    >
                      Guardar
                    </button>
                  </td>
                  <td>
                    <button
                      className="btn btn-outline-danger btn-sm w-100"
                      onClick={() => eliminarBanco(banco.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {bancos.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-muted">
                    No hay bancos cargados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Bancos;
