import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Modal, Button, Form } from "react-bootstrap";

const API_URL = process.env.REACT_APP_API_URL || "https://api.lever.com.ar";

export default function UsuariosAgencias() {
  const [usuarios, setUsuarios] = useState([]);
  const [agentes, setAgentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [categoriaEdit, setCategoriaEdit] = useState("A");
  const [busqueda, setBusqueda] = useState("");
  const [editedAgencia, setEditedAgencia] = useState("");
  const [editedTelefono, setEditedTelefono] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingAgenteId, setSavingAgenteId] = useState(null);

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
    let active = true;

    Promise.allSettled([
      axios.get(`${API_URL}/api/admin/usuarios`, { withCredentials: true }),
      axios.get(`${API_URL}/api/agentes`, { withCredentials: true }),
    ])
      .then(([usuariosResult, agentesResult]) => {
        if (!active) return;

        if (usuariosResult.status === "fulfilled") {
          setUsuarios(usuariosResult.value.data || []);
        } else {
          setUsuarios([]);
        }

        if (agentesResult.status === "fulfilled") {
          setAgentes(agentesResult.value.data?.agentes || []);
        } else {
          setAgentes([]);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

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

  const handleActualizarAgente = async (usuarioId, agenteId) => {
    setSavingAgenteId(usuarioId);

    try {
      const agenteSeleccionado = agentes.find(
        (agente) => String(agente.id) === String(agenteId),
      );

      await axios.put(
        `${API_URL}/api/admin/usuarios/${usuarioId}`,
        { agente: agenteId || null },
        { withCredentials: true },
      );

      setUsuarios((prev) =>
        prev.map((usuario) =>
          usuario.id === usuarioId
            ? {
                ...usuario,
                agente: agenteId ? Number(agenteId) : null,
                agente_nombre: agenteSeleccionado?.nombre || "",
              }
            : usuario,
        ),
      );

      setUsuarioSeleccionado((prev) =>
        prev && prev.id === usuarioId
          ? {
              ...prev,
              agente: agenteId ? Number(agenteId) : null,
              agente_nombre: agenteSeleccionado?.nombre || "",
            }
          : prev,
      );
    } catch (err) {
      console.error("Error al actualizar agente:", err);
      alert("Error al actualizar el agente");
    } finally {
      setSavingAgenteId(null);
    }
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

  // BLOQUEAR / DESBLOQUEAR
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [blockingUserId, setBlockingUserId] = useState(null);
  const [blockingLoading, setBlockingLoading] = useState(false);

  const openBlockModal = (usuario) => {
    setBlockingUserId(usuario.id);
    setBlockReason("");
    setShowBlockModal(true);
    setUsuarioSeleccionado(usuario);
  };

  const handleConfirmBlock = async () => {
    if (!blockingUserId) return;
    setBlockingLoading(true);
    try {
      const currentlyBlocked = usuarioSeleccionado?.bloqueado === 1 || usuarioSeleccionado?.bloqueado === true;
      const resp = await axios.put(
        `${API_URL}/api/admin/agencias_users/${blockingUserId}/bloquear`,
        { bloqueado: currentlyBlocked ? 0 : 1, motivo: blockReason },
        { withCredentials: true }
      );

      if (resp.data?.success) {
        setUsuarios((prev) =>
          prev.map((u) =>
            u.id === blockingUserId
              ? { ...u, bloqueado: !currentlyBlocked, bloqueo_motivo: currentlyBlocked ? null : blockReason }
              : u
          )
        );
        alert(`Usuario ${currentlyBlocked ? 'desbloqueado' : 'bloqueado'} correctamente`);
        // actualizar también el usuario seleccionado para que el modal muestre el motivo
        setUsuarioSeleccionado((prev) =>
          prev && prev.id === blockingUserId ? { ...prev, bloqueado: !currentlyBlocked, bloqueo_motivo: currentlyBlocked ? null : blockReason } : prev
        );
        setShowBlockModal(false);
      } else {
        alert('No se pudo actualizar el estado de bloqueo');
      }
    } catch (err) {
      console.error('Error bloqueando usuario:', err?.response?.data || err);
      alert('Error bloqueando/desbloqueando usuario');
    } finally {
      setBlockingLoading(false);
    }
  };

  const usuariosFiltrados = usuarios.filter(
    (u) =>
      (u.nombre_completo &&
        u.nombre_completo.toLowerCase().includes(busqueda.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(busqueda.toLowerCase())) ||
      (u.agencia && u.agencia.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const [showBlockInfoModal, setShowBlockInfoModal] = useState(false);
  const [blockInfoReason, setBlockInfoReason] = useState("");

  const openBlockInfo = (usuario) => {
    setBlockInfoReason(usuario?.bloqueo_motivo || usuario?.bloqueoMotivo || usuario?.motivo || "Sin motivo especificado");
    setShowBlockInfoModal(true);
  };

  const formatearFechaRegistro = (createdAt) => {
    if (!createdAt) return { fecha: "-", hora: "" };

    const [fecha, hora = ""] = createdAt.slice(0, 19).replace("T", " ").split(" ");
    return { fecha, hora };
  };

  if (loading)
    return <div style={{ color: "white", padding: 24 }}>Cargando...</div>;

  return (
    <div
      style={{ padding: 24, color: "white" }}
      className="usuarios-agencias-view"
    >
      <style>
        {`
          .usuarios-agencias-view {
            color: #f5f7ff;
          }
          .usuarios-agencias-view .usuarios-panel {
            position: relative;
            overflow: hidden;
            padding: 20px 22px 14px;
            border-radius: 22px;
            border: 1px solid rgba(196, 206, 255, 0.1);
            background:
              radial-gradient(circle at top right, rgba(126, 160, 255, 0.08), transparent 24%),
              linear-gradient(180deg, rgba(89, 92, 122, 0.2) 0%, rgba(63, 66, 96, 0.22) 100%);
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.04),
              0 18px 34px rgba(12, 16, 35, 0.12);
            backdrop-filter: blur(14px);
            -webkit-backdrop-filter: blur(14px);
          }
          .usuarios-agencias-view .usuarios-panel::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), transparent 34%);
          }
          .usuarios-agencias-view .btn,
          .usuarios-agencias-view button {
            font-size: 0.8rem !important;
          }
          .usuarios-agencias-view .table-title {
            position: relative;
            z-index: 1;
            margin-bottom: 14px;
          }
          .usuarios-agencias-view .table-title h2 {
            margin: 0;
            font-size: 1.8rem;
            font-weight: 700;
            letter-spacing: -0.02em;
            color: #ffffff;
          }
          .usuarios-agencias-view .table-title p {
            margin: 4px 0 0;
            color: rgba(226, 231, 255, 0.62);
            font-size: 0.88rem;
          }
          .usuarios-agencias-view .search-shell {
            position: relative;
            z-index: 1;
            margin-bottom: 14px;
          }
          .usuarios-agencias-view .search-shell svg {
            position: absolute;
            left: 18px;
            top: 50%;
            width: 18px;
            height: 18px;
            transform: translateY(-50%);
            stroke: rgba(235, 239, 255, 0.45);
            pointer-events: none;
          }
          .usuarios-agencias-view .search-input {
            width: 100%;
            padding: 12px 18px 12px 46px;
            border-radius: 999px;
            border: 1px solid rgba(214, 223, 255, 0.18);
            background: rgba(255, 255, 255, 0.04);
            color: #fff;
            outline: none;
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
            transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
          }
          .usuarios-agencias-view .search-input:focus {
            border-color: rgba(129, 177, 255, 0.7);
            box-shadow: 0 0 0 4px rgba(101, 151, 255, 0.14);
            background: rgba(255, 255, 255, 0.08);
          }
          .usuarios-agencias-view .search-input::placeholder {
            color: rgba(255, 255, 255, 0.54);
          }
          .usuarios-agencias-view .usuarios-table {
            position: relative;
            z-index: 1;
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          .usuarios-agencias-view .usuarios-table th {
            padding: 0 12px 10px;
            text-align: left;
            font-size: 0.78rem;
            font-weight: 700;
            letter-spacing: 0.03em;
            text-transform: uppercase;
            color: rgba(230, 235, 255, 0.68);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          }
          .usuarios-agencias-view .usuarios-table td {
            padding: 14px 12px;
            vertical-align: middle;
            background: transparent;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          }
          .usuarios-agencias-view .name-cell-td {
            padding-left: 22px !important;
          }
          .usuarios-agencias-view .usuarios-table tbody tr {
            transition: background 0.18s ease;
          }
          .usuarios-agencias-view .usuarios-table tbody tr:hover {
            background: rgba(255, 255, 255, 0.025);
          }
          .usuarios-agencias-view .cell-truncate {
            display: block;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .usuarios-agencias-view .cell-id {
            display: inline-flex;
            min-width: 40px;
            padding: 6px 10px;
            border-radius: 10px;
            justify-content: center;
            background: rgba(17, 26, 61, 0.26);
            font-weight: 800;
            color: #ffffff;
          }
          .usuarios-agencias-view .name-cell {
            display: block;
            min-width: 0;
          }
          .usuarios-agencias-view .name-copy {
            min-width: 0;
            width: 100%;
          }
          .usuarios-agencias-view .name-title {
            display: block;
            font-size: 0.98rem;
            font-weight: 700;
            color: #ffffff;
            line-height: 1.2;
            white-space: normal;
            overflow: visible;
            text-overflow: unset;
          }
          .usuarios-agencias-view .email-text {
            color: #eef2ff;
            font-weight: 500;
          }
          .usuarios-agencias-view .agency-text,
          .usuarios-agencias-view .phone-text {
            color: rgba(246, 248, 255, 0.86);
          }
          .usuarios-agencias-view .phone-text {
            display: block;
            white-space: nowrap;
            overflow: visible;
            text-overflow: clip;
            font-variant-numeric: tabular-nums;
          }
          .usuarios-agencias-view .cell-date {
            display: flex;
            flex-direction: column;
            gap: 3px;
            line-height: 1.1;
            white-space: nowrap;
            font-weight: 700;
            color: #ffffff;
          }
          .usuarios-agencias-view .cell-date-hour {
            font-size: 0.8rem;
            color: rgba(227, 233, 255, 0.62);
          }
          .usuarios-agencias-view .form-select-custom {
            height: 38px !important;
            border-radius: 999px !important;
            border: 0 !important;
            background-color: transparent !important;
            color: #243157 !important;
            font-size: 0.88rem !important;
            font-weight: 700;
            padding-left: 24px !important;
            padding-right: 34px !important;
            box-shadow: none !important;
          }
          .usuarios-agencias-view .form-select-custom:focus {
            box-shadow: none !important;
          }
          .usuarios-agencias-view .agente-select-cell {
            min-width: 0;
          }
          .usuarios-agencias-view .agente-select-shell {
            position: relative;
            display: inline-flex;
            align-items: center;
            width: 100%;
            max-width: 100%;
            min-width: 0;
            border-radius: 14px;
            border: 1px solid rgba(210, 218, 243, 0.55);
            background: rgba(250, 251, 255, 0.96);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
            transition: border-color 0.18s ease, box-shadow 0.18s ease;
          }
          .usuarios-agencias-view .agente-select-shell:hover {
            border-color: rgba(169, 183, 232, 0.95);
            box-shadow: 0 0 0 3px rgba(103, 129, 203, 0.08);
          }
          .usuarios-agencias-view .agente-select-shell.is-empty {
            background: rgba(246, 248, 252, 0.96);
          }
          .usuarios-agencias-view .agente-select {
            width: 100%;
            min-width: 0;
            max-width: 100%;
          }
          .usuarios-agencias-view .agente-select-cell .form-select-custom {
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;
          }
          .usuarios-agencias-view .categoria-badge {
            display: inline-flex;
            min-width: 36px;
            justify-content: center;
            padding: 7px 10px;
            border-radius: 10px;
            color: white;
            font-weight: 800;
            box-shadow: 0 8px 14px rgba(10, 16, 36, 0.12);
          }
          .usuarios-agencias-view .actions-cell {
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            height: 100%;
          }
          .usuarios-agencias-view .action-icon-btn {
            width: 50px;
            height: 50px;
            border: none;
            border-radius: 18px;
            background: linear-gradient(135deg, #7fd8ff 0%, #7f8df8 100%);
            color: #fff;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 4px;
            cursor: pointer;
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.28),
              0 10px 20px rgba(72, 94, 188, 0.22);
            transition: background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
            margin: 0 auto;
          }
          .usuarios-agencias-view .action-icon-btn:hover {
            background: linear-gradient(135deg, #8ee0ff 0%, #8b96ff 100%);
            transform: translateY(-1px);
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.32),
              0 14px 24px rgba(72, 94, 188, 0.28);
          }
          .usuarios-agencias-view .action-dot {
            width: 5px;
            height: 5px;
            display: block;
            border-radius: 999px;
            background: #ffffff;
            opacity: 0.95;
          }
          .usuarios-agencias-view .col-id { width: 4%; }
          .usuarios-agencias-view .col-nombre { width: 20%; }
          .usuarios-agencias-view .col-email { width: 20%; }
          .usuarios-agencias-view .col-agencia { width: 11%; }
          .usuarios-agencias-view .col-telefono { width: 11%; }
          .usuarios-agencias-view .col-categoria { width: 7%; }
          .usuarios-agencias-view .col-fecha { width: 9%; }
          .usuarios-agencias-view .col-agente { width: 13%; }
          .usuarios-agencias-view .col-acciones { width: 5%; }
          @media (max-width: 1400px) {
            .usuarios-agencias-view .usuarios-panel {
              padding-left: 18px;
              padding-right: 18px;
            }
            .usuarios-agencias-view .usuarios-table th,
            .usuarios-agencias-view .usuarios-table td {
              padding-left: 10px;
              padding-right: 10px;
              font-size: 0.92rem;
            }
            .usuarios-agencias-view .agente-select-shell {
              max-width: 100%;
            }
            .usuarios-agencias-view .name-cell-td {
              padding-left: 18px !important;
            }
          }
        `}
      </style>
      <div className="usuarios-panel">
        <div className="table-title">
          <h2>Usuarios registrados</h2>
          <p>Asigná agentes y administrá cada alta sin perder contexto.</p>
        </div>

        <div className="search-shell">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7"></circle>
            <path d="m20 20-3.5-3.5"></path>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por nombre, email o agencia..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

      <table className="usuarios-table">
        <colgroup>
          <col className="col-id" />
          <col className="col-nombre" />
          <col className="col-email" />
          <col className="col-agencia" />
          <col className="col-telefono" />
          <col className="col-categoria" />
          <col className="col-fecha" />
          <col className="col-agente" />
          <col className="col-acciones" />
        </colgroup>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Agencia</th>
            <th>Teléfono</th>
            <th>Categoría</th>
            <th>Fecha registro</th>
            <th>Agente</th>
            <th style={{ textAlign: "center" }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuariosFiltrados.map((u) => {
            const { fecha, hora } = formatearFechaRegistro(u.created_at);

            return (
            <tr key={u.id} style={u.bloqueado ? { opacity: 0.5, filter: 'grayscale(20%)' } : {}}>
              <td>
                <span className="cell-id">{u.id}</span>
              </td>
              <td className="name-cell-td" title={u.nombre_completo || "-"}>
                <div className="name-cell">
                  <span className="name-copy">
                    <span className="name-title">{u.nombre_completo || "-"}</span>
                  </span>
                </div>
              </td>
              <td title={u.email || "-"}>
                <span className="cell-truncate email-text">{u.email || "-"}</span>
              </td>
              <td title={u.agencia || "-"}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="cell-truncate agency-text">{u.agencia || "-"}</span>
                  {u.bloqueado ? (
                    <span style={{ background: '#dc3545', color: 'white', padding: '4px 8px', borderRadius: 8, fontWeight: 800, fontSize: '0.75rem' }}>
                      BLOQUEADO
                    </span>
                  ) : null}
                </div>
              </td>
              <td title={u.telefono || "-"}>
                <span className="phone-text">{u.telefono || "-"}</span>
              </td>
              <td>
                <span
                  className="categoria-badge"
                  style={{
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
              <td>
                <div className="cell-date">
                  <span>{fecha}</span>
                  {hora ? <span className="cell-date-hour">{hora}</span> : null}
                </div>
              </td>
              <td className="agente-select-cell">
                <div className={`agente-select-shell ${u.agente ? "is-assigned" : "is-empty"}`}>
                  <Form.Select
                    title={u.agente_nombre || "Sin asignar"}
                    value={u.agente ?? ""}
                    onChange={(e) => handleActualizarAgente(u.id, e.target.value)}
                    disabled={savingAgenteId === u.id}
                    className="form-select-custom agente-select"
                  >
                    <option value="">Sin asignar</option>
                    {agentes.map((agente) => (
                      <option key={agente.id} value={agente.id}>
                        {agente.nombre}
                      </option>
                    ))}
                  </Form.Select>
                </div>
              </td>
              <td className="actions-cell">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                <button
                  type="button"
                  aria-label={`Ver detalle de ${u.nombre_completo || "usuario"}`}
                  title="Ver más"
                  className="action-icon-btn"
                  onClick={() => handleVerMas(u)}
                >
                  <span className="action-dot"></span>
                  <span className="action-dot"></span>
                  <span className="action-dot"></span>
                </button>
                {/* El botón de info se muestra dentro del modal de detalle (si corresponde) */}
                </div>
              </td>
            </tr>
          );})}
        </tbody>
      </table>
      </div>

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
          <Button
            variant={usuarioSeleccionado?.bloqueado ? "warning" : "danger"}
            onClick={() => openBlockModal(usuarioSeleccionado)}
            style={{ fontSize: "0.8rem" }}
          >
            {usuarioSeleccionado?.bloqueado ? "Desbloquear" : "Bloquear"}
          </Button>
          {usuarioSeleccionado?.bloqueado ? (
            <Button
              variant="outline-info"
              onClick={() => openBlockInfo(usuarioSeleccionado)}
              style={{ fontSize: "0.8rem", marginLeft: 8 }}
            >
              Ver motivo de bloqueo
            </Button>
          ) : null}
        </Modal.Footer>
      </Modal>

      {/* Modal Confirmación Bloqueo */}
      <Modal show={showBlockModal} onHide={() => setShowBlockModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{usuarioSeleccionado?.bloqueado ? 'Desbloquear usuario' : 'Bloquear usuario'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            {usuarioSeleccionado
              ? `¿Estás seguro de ${usuarioSeleccionado.bloqueado ? 'desbloquear' : 'bloquear'} a ${usuarioSeleccionado.nombre_completo}?`
              : '¿Estás seguro?'}
          </p>
          <Form.Group>
            <Form.Label>Motivo (opcional)</Form.Label>
            <Form.Control as="textarea" rows={3} value={blockReason} onChange={(e) => setBlockReason(e.target.value)} />
            <small style={{ color: '#777' }}>El motivo quedará como referencia en la auditoría (si existe).</small>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowBlockModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleConfirmBlock} disabled={blockingLoading}>
            {blockingLoading ? 'Procesando...' : usuarioSeleccionado?.bloqueado ? 'Desbloquear' : 'Bloquear'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal que muestra motivo de bloqueo */}
      <Modal show={showBlockInfoModal} onHide={() => setShowBlockInfoModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Motivo de bloqueo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p style={{ whiteSpace: 'pre-wrap' }}>{blockInfoReason}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBlockInfoModal(false)}>Cerrar</Button>
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
