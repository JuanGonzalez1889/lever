import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

function ConfiguracionBancos() {
  const [bancos, setBancos] = useState([]);
  const [bancoSeleccionado, setBancoSeleccionado] = useState("");
  const [productos, setProductos] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [plazos, setPlazos] = useState([]);
  const [ltvs, setLtvs] = useState([]);
  const [tipoCredito, setTipoCredito] = useState("");
  const [prioridad, setPrioridad] = useState(0);
  const [mensaje, setMensaje] = useState("");
  const [nuevoAnio, setNuevoAnio] = useState("");
  const [nuevoLtv, setNuevoLtv] = useState("");
  const [nuevoProducto, setNuevoProducto] = useState("");
  const [nuevoTipoCredito, setNuevoTipoCredito] = useState("PESOS");
  const [nuevoPlazo, setNuevoPlazo] = useState("");
  const [nuevoTna, setNuevoTna] = useState("");
  const [nuevoComision, setNuevoComision] = useState("");

  useEffect(() => {
    axios.get(`${API_URL}/api/bancos`).then((res) => {
      if (res.data.success) setBancos(res.data.bancos);
    });
  }, []);

  useEffect(() => {
    if (bancoSeleccionado) {
      axios
        .get(`${API_URL}/api/productos_bancos?banco_id=${bancoSeleccionado}`)
        .then((res) => {
          if (res.data.success) setProductos(res.data.productos);
        });
    } else {
      setProductos([]);
      setProductoSeleccionado("");
    }
  }, [bancoSeleccionado]);

  useEffect(() => {
    if (productoSeleccionado) {
      axios
        .get(
          `${API_URL}/api/banco_plazos?producto_banco_id=${productoSeleccionado}`
        )
        .then((res) => {
          if (res.data.success) setPlazos(res.data.plazos);
        });
      axios
        .get(
          `${API_URL}/api/config_ltv?producto_banco_id=${productoSeleccionado}`
        )
        .then((res) => {
          if (res.data.success) setLtvs(res.data.ltvs);
        });
      const prod = productos.find((p) => p.id === Number(productoSeleccionado));
      setTipoCredito(prod?.tipo_credito || "");
      setPrioridad(prod?.prioridad || 0);
    } else {
      setPlazos([]);
      setLtvs([]);
      setTipoCredito("");
      setPrioridad(0);
    }
  }, [productoSeleccionado, productos]);

  const guardarProducto = async () => {
    const prod = productos.find((p) => p.id === Number(productoSeleccionado));
    await axios.put(`${API_URL}/api/productos_bancos/${productoSeleccionado}`, {
      nombre: prod?.nombre, // <-- Agregá esto
      tipo_credito: tipoCredito,
      prioridad,
    });
    setMensaje("Producto actualizado");
    axios
      .get(`${API_URL}/api/productos_bancos?banco_id=${bancoSeleccionado}`)
      .then((res) => {
        if (res.data.success) {
          setProductos(res.data.productos);
          const existe = res.data.productos.find(
            (p) => p.id === Number(productoSeleccionado)
          );
          if (!existe) setProductoSeleccionado("");
        }
      });
    setTimeout(() => setMensaje(""), 1000);
  };



  const guardarPlazo = async (plazoId, plazo, tna, comision) => {
    await axios.put(`${API_URL}/api/banco_plazos/${plazoId}`, {
      plazo,
      tna,
      comision,
    });
    setMensaje("Plazo actualizado");
    axios
      .get(
        `${API_URL}/api/banco_plazos?producto_banco_id=${productoSeleccionado}`
      )
      .then((res) => {
        if (res.data.success) setPlazos(res.data.plazos);
      });
    setTimeout(() => setMensaje(""), 1000);
  };

  const guardarLtv = async (ltvId, anio, ltv) => {
    await axios.put(`${API_URL}/api/config_ltv/${ltvId}`, {
      anio,
      ltv,
    });
    setMensaje("LTV actualizado");
    axios
      .get(
        `${API_URL}/api/config_ltv?producto_banco_id=${productoSeleccionado}`
      )
      .then((res) => {
        if (res.data.success) setLtvs(res.data.ltvs);
      });
    setTimeout(() => setMensaje(""), 1000);
  };

  // Agregar LTV
  const agregarLtv = async () => {
    if (!nuevoAnio || !nuevoLtv || !productoSeleccionado) return;
    await axios.post(`${API_URL}/api/config_ltv`, {
      producto_banco_id: productoSeleccionado,
      anio: nuevoAnio,
      ltv: nuevoLtv,
    });
    setMensaje("LTV agregado");
    setNuevoAnio("");
    setNuevoLtv("");
    axios
      .get(
        `${API_URL}/api/config_ltv?producto_banco_id=${productoSeleccionado}`
      )
      .then((res) => {
        if (res.data.success) setLtvs(res.data.ltvs);
      });
    setTimeout(() => setMensaje(""), 1000);
  };

  // Eliminar LTV
  const eliminarLtv = async (ltvId) => {
    await axios.delete(`${API_URL}/api/config_ltv/${ltvId}`);
    setMensaje("LTV eliminado");
    axios
      .get(
        `${API_URL}/api/config_ltv?producto_banco_id=${productoSeleccionado}`
      )
      .then((res) => {
        if (res.data.success) setLtvs(res.data.ltvs);
      });
    setTimeout(() => setMensaje(""), 1000);
  };

  // Agregar producto
  const agregarProducto = async (e) => {
    e.preventDefault();
    if (!nuevoProducto || !bancoSeleccionado) return;
    await axios.post(`${API_URL}/api/productos_bancos`, {
      banco_id: bancoSeleccionado,
      nombre: nuevoProducto.toUpperCase(),
      tipo_credito: nuevoTipoCredito,
    });
    setMensaje("Producto agregado");
    setNuevoProducto("");
    setNuevoTipoCredito("PESOS");
    axios
      .get(`${API_URL}/api/productos_bancos?banco_id=${bancoSeleccionado}`)
      .then((res) => {
        if (res.data.success) setProductos(res.data.productos);
      });
    setTimeout(() => setMensaje(""), 1000);
  };

  // Eliminar producto
  const eliminarProducto = async (id) => {
    // Eliminar plazos asociados
    await axios.delete(`${API_URL}/api/banco_plazos/producto/${id}`);
    // Eliminar LTV asociados
    await axios.delete(`${API_URL}/api/config_ltv/producto/${id}`);
    // Eliminar el producto
    await axios.delete(`${API_URL}/api/productos_bancos/${id}`);
    setMensaje("Producto eliminado");
    axios
      .get(`${API_URL}/api/productos_bancos?banco_id=${bancoSeleccionado}`)
      .then((res) => {
        if (res.data.success) {
          setProductos(res.data.productos);
          if (Number(productoSeleccionado) === Number(id)) {
            setProductoSeleccionado("");
          }
        }
      });
    setTimeout(() => setMensaje(""), 1000);
  };

  return (
    <div className="container mt-4" style={{ maxWidth: 800, margin: "0 auto" }}>
      <div className="card shadow rounded-4 mb-4">
        <div className="card-header bg-primary text-white rounded-top-4 text-center">
          <b>Configuración de Bancos y Productos</b>
        </div>
        <div className="card-body p-4">
          {mensaje && (
            <div className="alert alert-info py-2 text-center">{mensaje}</div>
          )}
          {/* Select de bancos */}
          <div className="mb-3">
            <label className="form-label fw-bold">Banco:</label>
            <select
              className="form-select"
              value={bancoSeleccionado}
              onChange={(e) => setBancoSeleccionado(e.target.value)}
            >
              <option value="">-- Elegí un banco --</option>
              {bancos.map((banco) => (
                <option key={banco.id} value={banco.id}>
                  {banco.nombre.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          {/* Agregar producto */}
          {bancoSeleccionado && (
            <form
              className="row g-3 align-items-center mb-3"
              onSubmit={agregarProducto}
              style={{ marginBottom: 24 }}
            >
              <div className="col-12 col-md-5">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nuevo producto"
                  value={nuevoProducto}
                  onChange={(e) =>
                    setNuevoProducto(e.target.value.toUpperCase())
                  }
                />
              </div>
              <div className="col-12 col-md-4">
                <select
                  className="form-select"
                  value={nuevoTipoCredito}
                  onChange={(e) => setNuevoTipoCredito(e.target.value)}
                >
                  <option value="PESOS">PESOS</option>
                  <option value="UVA">UVA</option>
                </select>
              </div>
              <div className="col-12 col-md-3 d-grid">
                <button type="submit" className="btn btn-success w-100">
                  Agregar producto
                </button>
              </div>
            </form>
          )}
          {/* Select de productos */}
          {bancoSeleccionado && (
            <div className="mb-3">
              <label className="form-label fw-bold">Producto:</label>
              <select
                className="form-select"
                value={productoSeleccionado}
                onChange={(e) => setProductoSeleccionado(e.target.value)}
              >
                <option value="">-- Elegí un producto --</option>
                {productos.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    {prod.nombre.toUpperCase()}
                  </option>
                ))}
              </select>
              {/* Eliminar producto */}
              {productoSeleccionado && (
                <button
                  className="btn btn-outline-danger mt-2 w-100"
                  onClick={() => eliminarProducto(productoSeleccionado)}
                >
                  Eliminar producto
                </button>
              )}
            </div>
          )}
          {/* Edición de producto */}
          {productoSeleccionado && (
            <>
              <div className="row g-3 mb-3">
                <div className="col-12 col-md-6">
                  <label className="form-label">Tipo de crédito</label>
                  <select
                    className="form-select w-100"
                    value={tipoCredito}
                    onChange={(e) => setTipoCredito(e.target.value)}
                  >
                    <option value="PESOS">PESOS</option>
                    <option value="UVA">UVA</option>
                  </select>
                </div>
              </div>
              <button
                className="btn btn-success mb-4 w-100"
                onClick={guardarProducto}
              >
                Guardar producto
              </button>
              {/* Plazos */}
              {productoSeleccionado && (
                <form
                  className="row g-3 align-items-center mb-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    // Validación simple
                    if (
                      !productoSeleccionado ||
                      !nuevoPlazo ||
                      !nuevoTna ||
                      !nuevoComision
                    )
                      return;
                    await axios.post(`${API_URL}/api/banco_plazos`, {
                      producto_banco_id: productoSeleccionado,
                      plazo: nuevoPlazo,
                      tna: nuevoTna,
                      comision: nuevoComision,
                    });
                    setMensaje("Plazo agregado");
                    setNuevoPlazo("");
                    setNuevoTna("");
                    setNuevoComision("");
                    // Recargar plazos
                    axios
                      .get(
                        `${API_URL}/api/banco_plazos?producto_banco_id=${productoSeleccionado}`
                      )
                      .then((res) => {
                        if (res.data.success) setPlazos(res.data.plazos);
                      });
                    setTimeout(() => setMensaje(""), 1000);
                  }}
                >
                  <div className="col-12 col-md-3">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Plazo"
                      value={nuevoPlazo}
                      onChange={(e) => setNuevoPlazo(e.target.value)}
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="TNA (%)"
                      value={nuevoTna}
                      onChange={(e) => setNuevoTna(e.target.value)}
                    />
                  </div>
                  <div className="col-12 col-md-3">
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Comisión (%)"
                      value={nuevoComision}
                      onChange={(e) => setNuevoComision(e.target.value)}
                    />
                  </div>
                  <div className="col-12 col-md-3 d-grid">
                    <button type="submit" className="btn btn-success w-100">
                      Agregar plazo
                    </button>
                  </div>
                </form>
              )}
              <div className="card mb-4">
                <div className="card-header bg-secondary text-white">
                  Plazos, TNA y Comisión
                </div>
                <div className="card-body">
                  <table className="table table-bordered align-middle">
                    <thead>
                      <tr>
                        <th>Plazo</th>
                        <th>TNA (%)</th>
                        <th>Comisión (%)</th>
                        <th>Guardar</th>
                        <th>Eliminar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plazos.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={row.plazo}
                              onChange={(e) =>
                                setPlazos((prev) =>
                                  prev.map((p) =>
                                    p.id === row.id
                                      ? { ...p, plazo: e.target.value }
                                      : p
                                  )
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={row.tna}
                              onChange={(e) =>
                                setPlazos((prev) =>
                                  prev.map((p) =>
                                    p.id === row.id
                                      ? { ...p, tna: e.target.value }
                                      : p
                                  )
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={row.comision}
                              onChange={(e) =>
                                setPlazos((prev) =>
                                  prev.map((p) =>
                                    p.id === row.id
                                      ? { ...p, comision: e.target.value }
                                      : p
                                  )
                                )
                              }
                            />
                          </td>
                          <td>
                            <button
                              className="btn btn-success btn-sm w-100"
                              onClick={() =>
                                guardarPlazo(
                                  row.id,
                                  row.plazo,
                                  row.tna,
                                  row.comision
                                )
                              }
                            >
                              Guardar
                            </button>
                          </td>
                          <td>
                            <button
                              className="btn btn-outline-danger btn-sm w-100"
                              onClick={async () => {
                                await axios.delete(
                                  `${API_URL}/api/banco_plazos/${row.id}`
                                );
                                setMensaje("Plazo eliminado");
                                axios
                                  .get(
                                    `${API_URL}/api/banco_plazos?producto_banco_id=${productoSeleccionado}`
                                  )
                                  .then((res) => {
                                    if (res.data.success)
                                      setPlazos(res.data.plazos);
                                  });
                                setTimeout(() => setMensaje(""), 1000);
                              }}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                      {plazos.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center text-muted">
                            No hay plazos cargados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* LTV */}
              <div className="card mb-4">
                <div className="card-header bg-secondary text-white">
                  LTV por Año
                </div>
                <div className="card-body">
                  <form
                    className="row g-3 align-items-center mb-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      agregarLtv();
                    }}
                  >
                    <div className="col-12 col-md-4">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Año"
                        value={nuevoAnio}
                        onChange={(e) => setNuevoAnio(e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <input
                        type="number"
                        className="form-control"
                        placeholder="LTV"
                        value={nuevoLtv}
                        onChange={(e) => setNuevoLtv(e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-md-4 d-grid">
                      <button type="submit" className="btn btn-success w-100">
                        Agregar LTV
                      </button>
                    </div>
                  </form>
                  <table className="table table-bordered align-middle">
                    <thead>
                      <tr>
                        <th>Año</th>
                        <th>LTV</th>
                        <th>Guardar</th>
                        <th>Eliminar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ltvs.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={row.anio}
                              onChange={(e) =>
                                setLtvs((prev) =>
                                  prev.map((l) =>
                                    l.id === row.id
                                      ? { ...l, anio: e.target.value }
                                      : l
                                  )
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={row.ltv}
                              onChange={(e) =>
                                setLtvs((prev) =>
                                  prev.map((l) =>
                                    l.id === row.id
                                      ? { ...l, ltv: e.target.value }
                                      : l
                                  )
                                )
                              }
                            />
                          </td>
                          <td>
                            <button
                              className="btn btn-success btn-sm w-100"
                              onClick={() =>
                                guardarLtv(row.id, row.anio, row.ltv)
                              }
                            >
                              Guardar
                            </button>
                          </td>
                          <td>
                            <button
                              className="btn btn-outline-danger btn-sm w-100"
                              onClick={() => eliminarLtv(row.id)}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                      {ltvs.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center text-muted">
                            No hay LTV cargados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConfiguracionBancos;
