import React, { useEffect, useState } from "react";
import axios from "axios";
import { Modal, Button } from "react-bootstrap";

const API_URL = process.env.REACT_APP_API_URL;

function Prenda() {
  const [operaciones, setOperaciones] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editOp, setEditOp] = useState(null);
  const [editFields, setEditFields] = useState({ I: "", LI: "", PR: "" });

  useEffect(() => {
    axios
      .get(`${API_URL}/api/operaciones`)
      .then((res) => {
        if (res.data.success) setOperaciones(res.data.operaciones);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleOpenModal = (op) => {
    setEditOp(op);
    setEditFields({
      I: op.I || "",
      LI: op.LI || "",
      PR: op.PR || "",
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditOp(null);
  };

  const handleSave = () => {
    axios
      .put(`${API_URL}/api/operaciones/${editOp.id}`, editFields)
      .then((res) => {
        if (res.data.success) {
          setOperaciones((prev) =>
            prev.map((op) =>
              op.id === editOp.id ? { ...op, ...editFields } : op
            )
          );
          setShowModal(false);
        }
      })
      .catch((err) => console.error(err));
  };

  return (
    <div className="content" style={{ padding: "7px" }}>
      <h1 style={{ marginBottom: 32, textAlign: "center" }}>
        Prenda
      </h1>
      <div
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "10px",
          margin: "0 auto",
          maxWidth: "100%",
          boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
        }}
      >
        <div className="table-scroll">
          <table className="table align-middle" style={{ marginBottom: 0 }}>
            <thead>
              <tr>
                <th
                  className="text-center"
                  style={{ borderRight: "1px solid #e0e0e0", width: "70px" }}
                >
                  Cod OP
                </th>
                <th
                  className="text-center"
                  style={{ borderRight: "1px solid #e0e0e0", width: "100px" }}
                >
                  Cod Cotización
                </th>
                <th
                  className="text-center"
                  style={{ borderRight: "1px solid #e0e0e0", width: "120px" }}
                >
                  Fecha operación
                </th>
                <th
                  className="text-center"
                  style={{ borderRight: "1px solid #e0e0e0", width: "180px" }}
                >
                  Nombre
                </th>
                <th
                  className="text-center"
                  style={{ borderRight: "1px solid #e0e0e0", width: "180px" }}
                >
                  Apellido
                </th>
                <th
                  className="text-center"
                  style={{ borderRight: "1px solid #e0e0e0" }}
                >
                  DNI
                </th>
                <th
                  className="text-center"
                  style={{ borderRight: "1px solid #e0e0e0" }}
                >
                  Capital
                </th>
                <th
                  className="text-center"
                  style={{ borderRight: "1px solid #e0e0e0" }}
                >
                  Plazo
                </th>
                <th
                  className="text-center"
                  style={{ borderRight: "1px solid #e0e0e0", width: "100px" }}
                >
                  I
                </th>
                <th
                  className="text-center"
                  style={{ borderRight: "1px solid #e0e0e0", width: "100px" }}
                >
                  LI
                </th>
                <th
                  className="text-center"
                  style={{ borderRight: "1px solid #e0e0e0", width: "100px" }}
                >
                  PR
                </th>
                <th className="text-center"></th>
              </tr>
            </thead>
            <tbody>
              {operaciones.map((op) => (
                <tr key={op.id}>
                  <td
                    className="text-center"
                    style={{ borderRight: "1px solid #e0e0e0" }}
                  >
                    {op.id}
                  </td>
                  <td
                    className="text-center"
                    style={{ borderRight: "1px solid #e0e0e0", width: "100px" }}
                  >
                    {op.cod_cotizacion}
                  </td>
                  <td
                    className="text-center"
                    style={{ borderRight: "1px solid #e0e0e0", width: "120px" }}
                  >
                    {op.fecha_operacion}
                  </td>
                  <td
                    className="text-center"
                    style={{ borderRight: "1px solid #e0e0e0", width: "180px" }}
                  >
                    {op.nombre}
                  </td>
                  <td
                    className="text-center"
                    style={{ borderRight: "1px solid #e0e0e0", width: "180px" }}
                  >
                    {op.apellido}
                  </td>
                  <td
                    className="text-center"
                    style={{ borderRight: "1px solid #e0e0e0" }}
                  >
                    {op.dni}
                  </td>
                  <td
                    className="text-center"
                    style={{ borderRight: "1px solid #e0e0e0" }}
                  >
                    {op.capital}
                  </td>
                  <td
                    className="text-center"
                    style={{ borderRight: "1px solid #e0e0e0" }}
                  >
                    {op.plazo}
                  </td>
                  <td
                    className="text-center"
                    style={{
                      borderRight: "1px solid #e0e0e0",
                      width: "100px",
                      fontSize: "12px",
                    }}
                  >
                    {op.I || ""}
                  </td>
                  <td
                    className="text-center"
                    style={{ borderRight: "1px solid #e0e0e0", width: "100px" }}
                  >
                    {op.LI || ""}
                  </td>
                  <td
                    className="text-center"
                    style={{ borderRight: "1px solid #e0e0e0", width: "100px" }}
                  >
                    {op.PR || ""}
                  </td>
                  <td className="text-center">
                    <button
                      className="btn btn-light"
                      style={{
                        borderRadius: "20px",
                        background:
                          "linear-gradient(135deg, #7de2fc 0%, #b9b6e5 100%)",
                        border: "none",
                        width: "40px",
                        height: "40px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "22px",
                        cursor: "pointer",
                      }}
                      onClick={() => handleOpenModal(op)}
                    >
                      <span style={{ fontWeight: "bold" }}>⋮</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para editar I, LI, PR */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Editar campos I, LI, PR</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label>I</label>
            <input
              type="text"
              className="form-control"
              value={editFields.I}
              onChange={(e) =>
                setEditFields({ ...editFields, I: e.target.value })
              }
            />
          </div>
          <div className="mb-3">
            <label>LI</label>
            <input
              type="text"
              className="form-control"
              value={editFields.LI}
              onChange={(e) =>
                setEditFields({ ...editFields, LI: e.target.value })
              }
            />
          </div>
          <div className="mb-3">
            <label>PR</label>
            <input
              type="text"
              className="form-control"
              value={editFields.PR}
              onChange={(e) =>
                setEditFields({ ...editFields, PR: e.target.value })
              }
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleSave}>
            Guardar
          </Button>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancelar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Prenda;
