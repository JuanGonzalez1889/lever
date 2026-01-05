import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Button, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { CiSearch } from "react-icons/ci";
import "./Cotizaciones.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

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
  const [filtroFechaDesde, setFiltroFechaDesde] = useState("");
  const [filtroFechaHasta, setFiltroFechaHasta] = useState("");
  const [observacionEditada, setObservacionEditada] = useState("");
  const usuarioActual = sessionStorage.getItem("usuario") || "";
  const rolActual = sessionStorage.getItem("rol") || "";
  const [showGenerarOp, setShowGenerarOp] = useState(false);
  const [montoOp, setMontoOp] = useState("");
  const [plazoOp, setPlazoOp] = useState("");

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
  // Abrir modal de Generar OP
  const handleGenerarOp = () => {
    if (cotizacionSeleccionada) {
      setMontoOp(cotizacionSeleccionada.monto || "");
      setPlazoOp("");
      setShowGenerarOp(true);
    }
  };

  // Cerrar modal de Generar OP
  const handleCloseGenerarOp = () => {
    setShowGenerarOp(false);
    setMontoOp("");
    setPlazoOp("");
  };

  // Confirmar OP (por ahora solo muestra alert)
  const handleConfirmarOp = async () => {
    if (!cotizacionSeleccionada) return;

    try {
      const res = await axios.post(`${API_URL}/api/operaciones`, {
        cod_cotizacion: cotizacionSeleccionada.id,
        nombre: cotizacionSeleccionada.cliente_nombre,
        apellido: cotizacionSeleccionada.cliente_apellido,
        dni: cotizacionSeleccionada.cliente_dni,
        capital: montoOp,
        plazo: plazoOp,
      });

      if (res.data.success) {
        alert("Operación generada correctamente. Cod OP: " + res.data.id);
        setShowGenerarOp(false);
      } else {
        alert("Error al generar la operación");
      }
    } catch (err) {
      alert("Error al generar la operación");
      console.error(err);
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

    // NUEVO: Filtro por rango de fechas
    const fechaCot = cot.fecha?.slice(0, 10); // "YYYY-MM-DD"
    if (filtroFechaDesde && fechaCot < filtroFechaDesde) {
      return false;
    }
    if (filtroFechaHasta && fechaCot > filtroFechaHasta) {
      return false;
    }

    return true;
  });
  const exportarExcel = () => {
    // Solo exporta las cotizaciones filtradas
    const data = cotizacionesFiltradas.map((cot) => {
      // Formatear fecha a "DD/MM/YYYY HH:mm:ss"
      let fechaFormateada = "";
      if (cot.fecha) {
        const fecha = new Date(cot.fecha);
        fechaFormateada = fecha.toLocaleString("es-AR", {
          timeZone: "America/Argentina/Buenos_Aires",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      }
      return {
        ID: cot.id,
        Fecha: fechaFormateada,
        Nombre: cot.cliente_nombre,
        Apellido: cot.cliente_apellido,
        DNI: cot.cliente_dni,
        Agencia: cot.agencia,
        Producto: cot.producto,
        Monto: cot.monto,
        Usuario: cot.usuario,
        Recotizado: cot.recotizado ? "Sí" : "No",
        Observaciones: cot.observaciones,
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cotizaciones");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    saveAs(blob, "cotizaciones.xlsx");
  };
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
            placeholder="Buscar por DNI, nombre o apellido"
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
            value={filtroFechaDesde}
            onChange={(e) => setFiltroFechaDesde(e.target.value)}
            placeholder="Desde"
          />
          <input
            type="date"
            className="form-control"
            style={{ maxWidth: "168px", height: "40px", marginTop: "3px" }}
            value={filtroFechaHasta}
            onChange={(e) => setFiltroFechaHasta(e.target.value)}
            placeholder="Hasta"
          />
          {/* SOLO ADMIN: Botón de exportar a Excel */}
          {rolActual === "admin" && (
            <span
              className="icono-descargar-excel"
              onClick={exportarExcel}
              title="Descargar Excel"
              style={{
                cursor: "pointer",
                marginLeft: 10,
                display: "flex",
                alignItems: "center",
              }}
            >
              {/* SVG del ícono */}
              <svg
                viewBox="0 0 32 32"
                width="36"
                height="36"
                fill="#7de2fc"
                style={{ transition: "transform 0.2s" }}
              >
                <g>
                  <path
                    d="M598,1011 C598,1012.1 597.104,1013 596,1013 L572,1013 C570.896,1013 570,1012.1 570,1011 L570,987 C570,985.896 570.896,985 572,985 L596,985 C597.104,985 598,985.896 598,987 L598,1011 L598,1011 Z M596,983 L572,983 C569.791,983 568,984.791 568,987 L568,1011 C568,1013.21 569.791,1015 572,1015 L596,1015 C598.209,1015 600,1013.21 600,1011 L600,987 C600,984.791 598.209,983 596,983 L596,983 Z M589.121,999.465 L585,1003.59 L585,993 C585,992.447 584.553,992 584,992 C583.448,992 583,992.447 583,993 L583,1003.59 L578.879,999.465 C578.488,999.074 577.855,999.074 577.465,999.465 C577.074,999.855 577.074,1000.49 577.465,1000.88 L583.121,1006.54 C583.361,1006.78 583.689,1006.85 584,1006.79 C584.311,1006.85 584.639,1006.78 584.879,1006.54 L590.535,1000.88 C590.926,1000.49 590.926,999.855 590.535,999.465 C590.146,999.074 589.512,999.074 589.121,999.465 L589.121,999.465 Z"
                    transform="translate(-568 -983)"
                  />
                </g>
              </svg>
            </span>
          )}
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
                size="sb"
                style={{
                  borderRadius: 20,
                  marginBottom: 12,
                  fontWeight: "bold",
                  background: "linear-gradient(135deg, #232342 0%, #232342 100%)",
                  color: "#232342",
                  border: "none",
                  width: 227,
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
            className="w-100 d-flex justify-content-start mb-4 ms-5"
            style={{ gap: "16px" }}
          >
            <Button
              variant="primary"
              onClick={handleRecotizar}
              style={{
                borderRadius: 30,
                height: 44,
                minWidth: 120,
                fontSize: "14px",
                fontWeight: "bold",
                background: "linear-gradient(135deg, #232342 0%, #232342 100%)",
                color: "#fff",
                border: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                letterSpacing: "1px",
              }}
            >
              RE COTIZAR
            </Button>
            <Button
              variant="success"
              onClick={handleGenerarOp}
              style={{
                borderRadius: 30,
                height: 44,
                minWidth: 120,
                fontSize: "14px",
                fontWeight: "bold",
                background: "linear-gradient(135deg, #7de2fc 0%, #b9b6e5 100%)",
                color: "#232342",
                border: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                letterSpacing: "1px",
              }}
            >
              GENERAR OP
            </Button>
          </div>
          {/* <div className="w-100 d-flex justify-content-center pb-4">
            <Button
              variant="primary"
              onClick={handleClose}
              style={{
                borderRadius: 30,
                height: 44,
                minWidth: 160,
                fontSize: "16px",
                fontWeight: "bold",
                background: "linear-gradient(135deg, #232342 0%, #232342 100%)",
                color: "#fff",
                border: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
                letterSpacing: "1px",
              }}
            >
              Cerrar
            </Button>
          </div> */}
        </Modal.Footer>
      </Modal>

      {/* Modal de Generar OP */}
      <Modal show={showGenerarOp} onHide={handleCloseGenerarOp} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar operación</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ fontWeight: "bold" }}>Monto:</label>
              <input
                type="number"
                className="form-control"
                value={montoOp}
                onChange={(e) => setMontoOp(e.target.value)}
                style={{ marginTop: 6 }}
              />
            </div>
            <div>
              <label style={{ fontWeight: "bold" }}>Plazo:</label>
              <input
                type="number"
                className="form-control"
                value={plazoOp}
                onChange={(e) => setPlazoOp(e.target.value)}
                style={{ marginTop: 6 }}
                placeholder="Ingrese plazo en meses"
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="success"
            onClick={handleConfirmarOp}
            style={{
              borderRadius: 30,
              minWidth: 140,
              fontWeight: "bold",
              background: "linear-gradient(135deg, #7de2fc 0%, #b9b6e5 100%)",
              color: "#232342",
              border: "none",
            }}
          >
            Confirmar
          </Button>
          <Button
            variant="secondary"
            onClick={handleCloseGenerarOp}
            style={{
              borderRadius: 30,
              minWidth: 140,
              fontWeight: "bold",
              background: "linear-gradient(135deg, #232342 0%, #232342 100%)",
              color: "#fff",
              border: "none",
            }}
          >
            Cancelar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Cotizaciones;
