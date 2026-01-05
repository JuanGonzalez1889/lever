import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";

const API_URL = process.env.REACT_APP_API_URL || "https://api.lever.com.ar";

export default function UsuariosAgencias() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [categoriaEdit, setCategoriaEdit] = useState("A");
  const [busqueda, setBusqueda] = useState("");
  const [editedAgencia, setEditedAgencia] = useState("");
  const [editedTelefono, setEditedTelefono] = useState("");
  const [saving, setSaving] = useState(false);

  // Modal para editar/re-enviar verificación de email
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [editedEmail, setEditedEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [resending, setResending] = useState(false);

  // Solo abrir modal si NO está verificado
  const openEmailModal = () => {
    if (isEmailVerificado) return;
    setShowEmailModal(true);
  };
  const iconKeyDown = (e) => {
    if (isEmailVerificado) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setShowEmailModal(true);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = () => {
    axios
      .get(`${API_URL}/api/admin/usuarios`, { withCredentials: true })
      .then((res) => setUsuarios(res.data))
      .catch(() => setUsuarios([]))
      .finally(() => setLoading(false));
  };

  const handleVerMas = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setCategoriaEdit(usuario.categoria || "A");
    setEditedAgencia(usuario.agencia || "");
    setEditedTelefono(usuario.telefono || "");
    setEditedEmail(usuario.email || "");
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setUsuarioSeleccionado(null);
    setShowEmailModal(false);
  };

  const isTrueFlag = (v) =>
    v === true || v === 1 || v === "1" || v === "true" || v === "TRUE";

  // Determinar si el email está verificado
  const isEmailVerificado = useMemo(() => {
    const u = usuarioSeleccionado || {};
    const flags = [
      u.email_validado,
      u.email_verificado,
      u.verificado,
      u.validado_email,
      u.emailVerified,
      u.emailValidado,
    ];
    return flags.some(isTrueFlag);
  }, [usuarioSeleccionado]);

  // Determinar si se puede reenviar verificación
   const puedeReenviar = useMemo(() => {
     if (!usuarioSeleccionado) return false;

     const emailValidado = usuarioSeleccionado.email_validado;
     const emailToken = usuarioSeleccionado.email_token;

     const notValidado = !isTrueFlag(emailValidado);
     const hasToken =
       emailToken !== null && emailToken !== undefined && emailToken !== "";

     // habilitar solo si NO está validado y NO hay token pendiente
     return notValidado && !hasToken;
   }, [usuarioSeleccionado]);

  // Guardar: agencia, teléfono y categoría
  const handleGuardarCambios = async () => {
    if (!usuarioSeleccionado) return;
    if (!isEmailVerificado) {
      alert(
        "El email no está validado. No es posible editar hasta validar el correo."
      );
      return;
    }
    setSaving(true);
    try {
      await Promise.all([
        axios.put(
          `${API_URL}/api/admin/usuarios/${usuarioSeleccionado.id}`,
          { agencia: editedAgencia, telefono: editedTelefono },
          { withCredentials: true }
        ),
        axios.put(
          `${API_URL}/api/admin/usuarios/${usuarioSeleccionado.id}/categoria`,
          { categoria: categoriaEdit },
          { withCredentials: true }
        ),
      ]);

      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === usuarioSeleccionado.id
            ? {
                ...u,
                agencia: editedAgencia,
                telefono: editedTelefono,
                categoria: categoriaEdit,
              }
            : u
        )
      );

      alert("Cambios guardados correctamente");
      handleClose();
    } catch (err) {
      console.error("Error al guardar cambios:", err);
      alert("Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  // Guardar nuevo email
  const handleGuardarEmail = async () => {
    if (!usuarioSeleccionado) return;
    const newEmail = editedEmail.trim();
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      alert("Ingrese un email válido.");
      return;
    }
    setEmailSaving(true);
    try {
      const resp = await axios.put(
        `${API_URL}/api/admin/usuarios/${usuarioSeleccionado.id}/email`,
        { email: newEmail },
        { withCredentials: true }
      );
      if (resp.data?.success) {
        setUsuarios((prev) =>
          prev.map((u) =>
            u.id === usuarioSeleccionado.id
              ? {
                  ...u,
                  email: newEmail,
                  email_verificado: 0,
                  verificado: 0,
                  validado_email: 0,
                  emailVerified: false,
                }
              : u
          )
        );
        setUsuarioSeleccionado((prev) =>
          prev
            ? {
                ...prev,
                email: newEmail,
                email_verificado: 0,
                verificado: 0,
                validado_email: 0,
                emailVerified: false,
              }
            : prev
        );
        alert("Email actualizado. Debe validarse nuevamente.");
        setShowEmailModal(false);
      } else {
        alert("No se pudo actualizar el email.");
      }
    } catch (err) {
      console.error("Error al actualizar el email:", err);
      alert("Error al actualizar el email");
    } finally {
      setEmailSaving(false);
    }
  };

  // Reenviar verificación
 const handleReenviarVerificacion = async () => {
   if (!usuarioSeleccionado) return;
   setResending(true);
   try {
     const resp = await axios.post(
       `${API_URL}/api/admin/usuarios/${usuarioSeleccionado.id}/resend-verification`,
       {},
       { withCredentials: true }
     );
     if (resp.data?.success) {
       alert(
         "Se reenviaron las instrucciones de verificación al email del usuario."
       );
       setShowEmailModal(false);
     } else {
       alert("No se pudo reenviar la verificación.");
     }
   } catch (err) {
     console.error(
       "Error al reenviar verificación:",
       err?.response?.data || err
     ); // <--- aquí
     alert("Error al reenviar el email de verificación");
   } finally {
     setResending(false);
   }
 };

  const usuariosFiltrados = usuarios.filter(
    (u) =>
      (u.nombre_completo &&
        u.nombre_completo.toLowerCase().includes(busqueda.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(busqueda.toLowerCase())) ||
      (u.agencia && u.agencia.toLowerCase().includes(busqueda.toLowerCase()))
  );

  if (loading)
    return <div style={{ color: "white", padding: 24 }}>Cargando...</div>;

  return (
    <div
      style={{ padding: 24, color: "white" }}
      className="usuarios-agencias-view"
    >
      <style>
        {`
          .usuarios-agencias-view .btn,
          .usuarios-agencias-view button {
            font-size: 0.8rem !important;
          }
          .usuarios-agencias-view .form-select-custom {
            height: 35px !important;
            border-radius: 30px !important;
          }
        `}
      </style>
      <h2>Usuarios registrados</h2>

      <input
        type="text"
        placeholder="Buscar por nombre, email o agencia..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        style={{
          width: "100%",
          padding: "8px 12px",
          marginBottom: 16,
          borderRadius: 4,
          border: "1px solid #ccc",
        }}
      />

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #555" }}>
            <th style={{ padding: 8, textAlign: "left" }}>ID</th>
            <th style={{ padding: 8, textAlign: "left" }}>Nombre</th>
            <th style={{ padding: 8, textAlign: "left" }}>Email</th>
            <th style={{ padding: 8, textAlign: "left" }}>Agencia</th>
            <th style={{ padding: 8, textAlign: "left" }}>Teléfono</th>
            <th style={{ padding: 8, textAlign: "left" }}>Categoría</th>
            <th style={{ padding: 8, textAlign: "left" }}>Fecha registro</th>
            <th style={{ padding: 8, textAlign: "left" }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuariosFiltrados.map((u) => (
            <tr key={u.id} style={{ borderBottom: "1px solid #444" }}>
              <td style={{ padding: 8 }}>{u.id}</td>
              <td style={{ padding: 8 }}>{u.nombre_completo}</td>
              <td style={{ padding: 8 }}>{u.email}</td>
              <td style={{ padding: 8 }}>{u.agencia || "-"}</td>
              <td style={{ padding: 8 }}>{u.telefono || "-"}</td>
              <td style={{ padding: 8 }}>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 4,
                    backgroundColor:
                      u.categoria === "A"
                        ? "#28a745"
                        : u.categoria === "B"
                        ? "#ffc107"
                        : "#dc3545",
                    color: "white",
                    fontWeight: "bold",
                  }}
                >
                  {u.categoria || "A"}
                </span>
              </td>
              <td style={{ padding: 8 }}>
                {u.created_at && u.created_at.slice(0, 19).replace("T", " ")}
              </td>
              <td style={{ padding: 8 }}>
                <button
                  onClick={() => handleVerMas(u)}
                  style={{
                    padding: "4px 12px",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  Ver más
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal show={showModal} onHide={handleClose} size="lg">
        <Modal.Header closeButton>
          <Modal.Title style={{ flex: 1, textAlign: "center" }}>
            Detalle del Usuario
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {usuarioSeleccionado && (
            <div>
              <p style={{ textAlign: "center" }}>
                <strong>ID:</strong> {usuarioSeleccionado.id}
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <p style={{ margin: 0, textAlign: "center" }}>
                  <strong>Nombre:</strong> {usuarioSeleccionado.nombre_completo}
                </p>
              </div>

              {/* Email con acción para editar/reenviar verificación */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 8,
                  marginBottom: 8,
                  flexWrap: "nowrap",
                }}
              >
                <p style={{ margin: 0, textAlign: "center" }}>
                  <strong>Email:</strong> {usuarioSeleccionado.email}
                  {!isEmailVerificado && (
                    <span style={{ color: "#ffc107", marginLeft: 6 }}>
                      (no verificado)
                    </span>
                  )}
                </p>

                <span
                  role="button"
                  tabIndex={isEmailVerificado ? -1 : 0}
                  onClick={openEmailModal}
                  onKeyDown={iconKeyDown}
                  aria-label="Editar email / Reenviar verificación"
                  title={
                    isEmailVerificado
                      ? "Email ya verificado"
                      : "Editar email / Reenviar verificación"
                  }
                  aria-disabled={isEmailVerificado}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: isEmailVerificado ? "not-allowed" : "pointer",
                    padding: 0,
                    marginLeft: 6,
                    opacity: isEmailVerificado ? 0.4 : 1,
                    pointerEvents: isEmailVerificado ? "none" : "auto",
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    style={{ color: "#232342" }}
                  >
                    <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
                    <path
                      fillRule="evenodd"
                      d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"
                    />
                  </svg>
                </span>
              </div>

              <Form.Group className="mb-3">
                <Form.Label>
                  <strong>Agencia:</strong>
                </Form.Label>
                <Form.Control
                  type="text"
                  value={editedAgencia}
                  onChange={(e) => setEditedAgencia(e.target.value)}
                  placeholder="Ingrese agencia"
                  disabled={!isEmailVerificado}
                  style={
                    !isEmailVerificado
                      ? { backgroundColor: "#2c2c2c", color: "#aaa" }
                      : undefined
                  }
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>
                  <strong>Teléfono:</strong>
                </Form.Label>
                <Form.Control
                  type="text"
                  value={editedTelefono}
                  onChange={(e) => setEditedTelefono(e.target.value)}
                  placeholder="Ingrese teléfono"
                  disabled={!isEmailVerificado}
                  style={
                    !isEmailVerificado
                      ? { backgroundColor: "#2c2c2c", color: "#aaa" }
                      : undefined
                  }
                />
              </Form.Group>

              <p>
                <strong>Fecha registro:</strong>{" "}
                {usuarioSeleccionado.created_at
                  ? usuarioSeleccionado.created_at
                      .slice(0, 19)
                      .replace("T", " ")
                  : "-"}
              </p>

              <Form.Group className="mb-3">
                <Form.Label>
                  <strong>Categoría:</strong>
                </Form.Label>
                <Form.Select
                  value={categoriaEdit}
                  onChange={(e) => setCategoriaEdit(e.target.value)}
                  disabled={!isEmailVerificado}
                  className="form-select-custom"
                  style={{
                    borderRadius: "30px",
                    height: "35px",
                    width: "12rem",
                    fontSize: "1.5rem",
                    ...(!isEmailVerificado && {
                      backgroundColor: "#2c2c2c",
                      color: "#aaa",
                    }),
                  }}
                >
                  <option value="A">Categoría A</option>
                  <option value="B">Categoría B</option>
                  <option value="C">Categoría C</option>
                </Form.Select>
                {!isEmailVerificado && (
                  <small style={{ color: "#bbb" }}>
                    Debe validar el email para poder editar los datos.
                  </small>
                )}
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleClose}
            style={{ fontSize: "0.8rem" }}
          >
            Cerrar
          </Button>
          <Button
            variant="success"
            onClick={handleGuardarCambios}
            disabled={saving || !isEmailVerificado}
            className="me-2"
            style={{ fontSize: "0.8rem" }}
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Email: editar y reenviar verificación */}
      <Modal
        show={showEmailModal}
        onHide={() => setShowEmailModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Correo de la Agencia</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Correo electrónico</Form.Label>
            <Form.Control
              type="email"
              value={editedEmail}
              onChange={(e) => setEditedEmail(e.target.value)}
              placeholder="usuario@dominio.com"
            />
            <small style={{ color: "#bbb" }}>
              Si el correo está mal, corrígelo y guarda. Luego puedes reenviar
              la verificación.
            </small>
          </Form.Group>

          {/* Mostrar estado de validación */}
          {isEmailVerificado ? (
            <div
              style={{ color: "#28a745", fontSize: "0.9rem", marginBottom: 10 }}
            >
              ✓ Email ya verificado
            </div>
          ) : usuarioSeleccionado?.email_token ? (
            <div
              style={{ color: "#ffc107", fontSize: "0.9rem", marginBottom: 10 }}
            >
              ⏳ Email de verificación ya enviado (revisar bandeja de entrada)
            </div>
          ) : (
            <div
              style={{ color: "#dc3545", fontSize: "0.9rem", marginBottom: 10 }}
            >
              ✗ Email no verificado
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setShowEmailModal(false)}
            style={{ fontSize: "0.8rem" }}
          >
            Cancelar
          </Button>

          <Button
            variant="success"
            onClick={handleReenviarVerificacion}
            disabled={resending || !puedeReenviar}
            style={{ fontSize: "0.8rem" }}
          >
            {resending ? "Reenviando..." : "Reenviar Verificación"}
          </Button>

          <Button
            variant="primary"
            onClick={handleGuardarEmail}
            disabled={emailSaving}
            style={{ fontSize: "0.8rem" }}
          >
            {emailSaving ? "Guardando..." : "Guardar Email"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
