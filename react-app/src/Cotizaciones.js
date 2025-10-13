import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Button, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { CiSearch } from "react-icons/ci";
import "./Cotizaciones.css";
const API_URL = process.env.REACT_APP_API_URL;

function Cotizaciones() {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtroAgencia, setFiltroAgencia] = useState("");
  const [filtroUsuario, setFiltroUsuario] = useState("");
  const [filtroProducto, setFiltroProducto] = useState("");
  const [filtroFecha, setFiltroFecha] = useState(""); // formato: "YYYY-MM-DD"
  const [observacionEditada, setObservacionEditada] = useState("");
  

  useEffect(() => {
    axios
      .get(`${API_URL}/api/cotizaciones`)
      .then((res) => {
        if (res.data.success) setCotizaciones(res.data.cotizaciones);
      })
      .catch((err) => console.error("Error al cargar cotizaciones:", err));
  }, []);

  const handleVerMas = (cotizacion) => {
    setCotizacionSeleccionada(cotizacion);
    setObservacionEditada(cotizacion.observaciones || "");
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setCotizacionSeleccionada(null);
  };

  const handleRecotizar = () => {
    if (cotizacionSeleccionada && cotizacionSeleccionada.id) {
      navigate(`/dashboard/cotizador?id=${cotizacionSeleccionada.id}`);
    } else {
      alert("No hay cotización seleccionada");
    }
  };

 const handleGuardarObservacion = () => {
   if (!cotizacionSeleccionada) return;
   axios
     .post(`${API_URL}/api/cotizaciones/observacion`, {
       id: cotizacionSeleccionada.id,
       observaciones: observacionEditada,
     })
     .then((res) => {
       alert("Observación guardada");
       // Actualiza la lista de cotizaciones
       setCotizaciones((prev) =>
         prev.map((c) =>
           c.id === cotizacionSeleccionada.id
             ? { ...c, observaciones: observacionEditada }
             : c
         )
       );
       // Actualiza la cotización seleccionada
       setCotizacionSeleccionada((prev) =>
         prev ? { ...prev, observaciones: observacionEditada } : prev
       );
       // Limpia el campo SOLO después de guardar
       setObservacionEditada("");
     })
     .catch(() => alert("Error al guardar observación"));
 };
  
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    if (id && cotizaciones.length > 0) {
      const cot = cotizaciones.find((c) => String(c.id) === String(id));
      if (cot) {
        setCotizacionSeleccionada(cot);
        setShowModal(true);
      }
    }
  }, [location.search, cotizaciones]);

  const [filtro, setFiltro] = useState("");

  const cotizacionesFiltradas = cotizaciones.filter((cot) => {
    const texto = filtro.trim().toLowerCase();

    // Filtro general por DNI, nombre o apellido
    if (
      texto &&
      !(
        cot.cliente_dni?.toString().toLowerCase().includes(texto) ||
        cot.cliente_nombre?.toLowerCase().includes(texto) ||
        cot.cliente_apellido?.toLowerCase().includes(texto)
      )
    ) {
      return false;
    }

    // Filtro por agencia
    if (
      filtroAgencia &&
      !cot.agencia?.toLowerCase().includes(filtroAgencia.trim().toLowerCase())
    ) {
      return false;
    }

    // Filtro por usuario
    if (
      filtroUsuario &&
      !cot.usuario?.toLowerCase().includes(filtroUsuario.trim().toLowerCase())
    ) {
      return false;
    }

    // Filtro por producto
    if (
      filtroProducto &&
      !cot.producto?.toLowerCase().includes(filtroProducto.trim().toLowerCase())
    ) {
      return false;
    }

    // Filtro por fecha (YYYY-MM-DD)
    if (filtroFecha && !cot.fecha?.slice(0, 10).includes(filtroFecha)) {
      return false;
    }

    return true;
  });

  return (
    <div className="content">
      <h1>Cotizaciones</h1>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        {/* Botón de filtros a la izquierda */}
        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => setMostrarFiltros((prev) => !prev)}
          style={{
            borderRadius: 30,
            height: 44,
            minWidth: 150,
            fontSize: "1rem",
            padding: "0 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            whiteSpace: "nowrap",
            lineHeight: "44px",
            marginTop: "3px",
          }}
        >
          {mostrarFiltros ? "Ocultar filtros" : "Filtros avanzados"}
        </Button>

        {/* Buscador a la derecha */}
        <div
          style={{
            position: "relative",
            width: 270,
            height: 44,
            display: "flex",
            alignItems: "center",
          }}
        >
          <input
            type="text"
            className="form-control"
            style={{
              paddingRight: 44,
              borderRadius: 30,
              height: 44,
              fontSize: "1rem",
              margin: 0,
            }}
            placeholder="Buscar cotización..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
          <span
            style={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              background: "linear-gradient(135deg, #7de2fc 0%, #b9b6e5 100%)",
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
            }}
          >
            <CiSearch size={20} color="#fff" />
          </span>
        </div>
      </div>

      {/* Filtros avanzados debajo del botón, alineados a la izquierda */}
      {mostrarFiltros && (
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "flex-start", // <-- cambia a flex-start
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            className="form-control"
            style={{ maxWidth: "168px", height: "40px", fontSize: "21px" }}
            placeholder="Agencia"
            value={filtroAgencia}
            onChange={(e) => setFiltroAgencia(e.target.value)}
          />
          <input
            type="text"
            className="form-control"
            style={{ maxWidth: "168px", height: "40px", fontSize: "21px" }}
            placeholder="Usuario"
            value={filtroUsuario}
            onChange={(e) => setFiltroUsuario(e.target.value)}
          />
          <input
            type="text"
            className="form-control"
            style={{ maxWidth: "168px", height: "40px", fontSize: "21px" }}
            placeholder="Producto"
            value={filtroProducto}
            onChange={(e) => setFiltroProducto(e.target.value)}
          />
          <input
            type="date"
            className="form-control"
            style={{ maxWidth: "168px", height: "40px", marginTop: "3px" }}
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
          />
        </div>
      )}
      <div className="table-scroll">
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>DNI</th>
              <th>Agencia</th>
              <th>Producto</th>
              <th>Monto</th>
              <th>Usuario</th>
              <th>Recotizado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {cotizacionesFiltradas.map((cot) => (
              <tr key={cot.id}>
                <td>{cot.id}</td>
                <td>
                  {cot.fecha
                    ? new Date(cot.fecha.replace(" ", "T")).toLocaleString(
                        "es-AR",
                        {
                          timeZone: "America/Argentina/Buenos_Aires",
                          hour12: false,
                        }
                      )
                    : ""}
                </td>
                <td>{cot.cliente_nombre}</td>
                <td>{cot.cliente_apellido}</td>
                <td>{cot.cliente_dni}</td>
                <td>{cot.agencia}</td>
                <td>{cot.producto}</td>
                <td>${cot.monto?.toLocaleString("es-AR")}</td>
                <td>{cot.usuario}</td>
                <td>{cot.recotizado ? "Sí" : "No"}</td>
                <td style={{ textAlign: "center" }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleVerMas(cot)}
                    title="Ver más datos de cotización"
                    style={{
                      borderRadius: "50%",
                      width: 44,
                      height: 44,
                      padding: 0,
                      background:
                        "linear-gradient(135deg, #7de2fc 0%, #b9b6e5 100%)",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                      color: "#fff",
                      fontSize: "1.6rem",
                      marginTop: "0px",
                    }}
                  >
                    ⋮
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      <Modal show={showModal} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Detalle de cotización</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {cotizacionSeleccionada && (
            <div>
              <p>
                <strong>ID:</strong> {cotizacionSeleccionada.id}
              </p>
              {cotizacionSeleccionada.cotizacion_original_id && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <span style={{ fontWeight: "bold", marginRight: 10 }}>
                    Cotización original:
                  </span>
                  <Button
                    variant="primary"
                    style={{
                      borderRadius: 30,
                      height: 40,
                      minWidth: 100,
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                      background:
                        "linear-gradient(3deg, #484892f5 0%, rgb(35, 35, 66) 100%)",
                      color: "#fff",
                      border: "none",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                      padding: "0 24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      marginTop: "0px",
                    }}
                    onClick={() =>
                      navigate(
                        `/dashboard/cotizaciones?id=${cotizacionSeleccionada.cotizacion_original_id}`
                      )
                    }
                  >
                    COD {cotizacionSeleccionada.cotizacion_original_id}
                  </Button>
                </div>
              )}
              <p>
                <strong>Fecha:</strong>{" "}
                {cotizacionSeleccionada.fecha?.slice(0, 19).replace("T", " ")}
              </p>
              <p>
                <strong>Cliente:</strong>{" "}
                {cotizacionSeleccionada.cliente_nombre}{" "}
                {cotizacionSeleccionada.cliente_apellido} (
                {cotizacionSeleccionada.cliente_dni})
              </p>
              <p>
                <strong>Agencia:</strong> {cotizacionSeleccionada.agencia}
              </p>
              <p>
                <strong>Producto:</strong> {cotizacionSeleccionada.producto}
              </p>
              <p>
                <strong>Monto:</strong> $
                {cotizacionSeleccionada.monto?.toLocaleString("es-AR")}
              </p>
              <p>
                <strong>Vehículo:</strong>{" "}
                {cotizacionSeleccionada.vehiculo_marca}{" "}
                {cotizacionSeleccionada.vehiculo_modelo}{" "}
                {cotizacionSeleccionada.vehiculo_anio} ($
                {cotizacionSeleccionada.vehiculo_precio?.toLocaleString(
                  "es-AR"
                )} 
                )
              </p>
              <p>
                <strong>Persona:</strong> {cotizacionSeleccionada.persona}
              </p>
              <p>
                <strong>Sellado:</strong> {cotizacionSeleccionada.sellado}
              </p>
              <p>
                <strong>Usuario:</strong> {cotizacionSeleccionada.usuario}
              </p>
              {cotizacionSeleccionada.fiador_nombre &&
                cotizacionSeleccionada.fiador_dni && (
                  <p>
                    <b>Fiador:</b> {cotizacionSeleccionada.fiador_nombre}{" "}
                    {cotizacionSeleccionada.fiador_apellido} (
                    {cotizacionSeleccionada.fiador_dni})
                  </p>
                )}
              <p>
                <strong>Observaciones:</strong>
                {cotizacionSeleccionada.observaciones && (
                  <span style={{ marginLeft: 8 }}>
                    {cotizacionSeleccionada.observaciones}
                  </span>
                )}
              </p>
              <textarea
                className="form-control"
                style={{ minHeight: 60, resize: "vertical", marginBottom: 12 }}
                value={observacionEditada}
                onChange={(e) => setObservacionEditada(e.target.value)}
                placeholder="Escriba una observación..."
              />
              <Button
                variant="success"
                size="sm"
                style={{
                  borderRadius: 20,
                  marginBottom: 12,
                  fontWeight: "bold",
                  background:
                    "linear-gradient(135deg, #7de2fc 0%, #b9b6e5 100%)",
                  color: "#232342",
                  border: "none",
                }}
                onClick={() => {
                  handleGuardarObservacion();
                  setObservacionEditada(""); // limpia el campo
                }}
              >
                Guardar observación
              </Button>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div
            style={{
              display: "flex",
              gap: 16,
              justifyContent: "center",
              width: "100%",
            }}
          >
            <Button
              variant="primary"
              onClick={handleRecotizar}
              style={{
                borderRadius: 30,
                height: 54,
                minWidth: 160,
                fontSize: "14px",
                fontWeight: "bold",
                background: "linear-gradient(135deg, #232342 0%, #232342 100%)",
                color: "#fff",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                letterSpacing: "1px",
              }}
            >
              RE COTIZAR
            </Button>
            <Button
              variant="primary"
              onClick={handleClose}
              style={{
                borderRadius: 30,
                height: 54,
                minWidth: 160,
                fontSize: "19px",
                fontWeight: "bold",
                background: "linear-gradient(135deg, #232342 0%, #232342 100%)",
                color: "#fff",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                letterSpacing: "1px",
              }}
            >
              Cerrar
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Cotizaciones;
