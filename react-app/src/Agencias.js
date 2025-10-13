import React, { useEffect, useState } from "react";
import { Button, Table, Modal, Dropdown, Form } from "react-bootstrap";
import { ThreeDotsVertical } from "react-bootstrap-icons";
import axios from "axios";

function Agencias() {
  const [agencias, setAgencias] = useState([]);
  const [agentes, setAgentes] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [localidades, setLocalidades] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [agenciaSeleccionada, setAgenciaSeleccionada] = useState(null);
  const [editando, setEditando] = useState(false);
  const [agenciaEdit, setAgenciaEdit] = useState(null);
  const [nuevoAgente, setNuevoAgente] = useState("");
  const [showNuevoModal, setShowNuevoModal] = useState(false);
  const [nuevaAgencia, setNuevaAgencia] = useState({
    nombre: "",
    agencia: "",
    agente: "",
    comision: "",
    telefono: "",
    localidad: "",
    provincia: "",
    domicilio: "",
    sellado: "SI",
    observaciones: "",
  });
  const [localidadesNueva, setLocalidadesNueva] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const API_URL = process.env.REACT_APP_API_URL; // para LOCAL

  useEffect(() => {
    axios.get(`${API_URL}/api/agencias`).then((res) => {
      if (res.data.success) setAgencias(res.data.agencias);
    });
    axios.get(`${API_URL}/api/agentes`).then((res) => {
      if (res.data.success) setAgentes(res.data.agentes);
    });
    axios.get(`${API_URL}/api/provincias`).then((res) => {
      if (res.data.success) setProvincias(res.data.provincias);
    });
  }, []);

  useEffect(() => {
    if (agenciaEdit && agenciaEdit.provincia) {
      const provinciaObj = provincias.find(
        (p) => p.nombre === agenciaEdit.provincia
      );
      if (provinciaObj) {
        axios
          .get(`${API_URL}/api/localidades?provincia_id=${provinciaObj.id}`)
          .then((res) => {
            if (res.data.success) setLocalidades(res.data.localidades);
          });
      }
    }
  }, [agenciaEdit?.provincia, provincias]);

  useEffect(() => {
    if (nuevaAgencia.provincia) {
      const provinciaObj = provincias.find(
        (p) => p.nombre === nuevaAgencia.provincia
      );
      if (provinciaObj) {
        axios
          .get(`${API_URL}/api/localidades?provincia_id=${provinciaObj.id}`)
          .then((res) => {
            if (res.data.success) setLocalidadesNueva(res.data.localidades);
          });
      }
    }
  }, [nuevaAgencia.provincia, provincias]);

  const handleVerMas = (agencia) => {
    setAgenciaSeleccionada(agencia);
    setEditando(false);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setAgenciaSeleccionada(null);
    setEditando(false);
    setAgenciaEdit(null);
    setLocalidades([]);
  };

  const handleEditar = () => {
    setAgenciaEdit({ ...agenciaSeleccionada });
    setEditando(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setAgenciaEdit((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardar = async () => {
    await axios.put(`${API_URL}/api/agencias/${agenciaEdit.id}`, agenciaEdit);
    setAgencias((prev) =>
      prev.map((a) => (a.id === agenciaEdit.id ? { ...agenciaEdit } : a))
    );
    setAgenciaSeleccionada({ ...agenciaEdit });
    setEditando(false);
    setAgenciaEdit(null);
  };

  const handleAddAgente = async () => {
    if (nuevoAgente) {
      await axios.post(`${API_URL}/api/agentes`, { nombre: nuevoAgente });
      setNuevoAgente("");
      const res = await axios.get(`${API_URL}/api/agentes`);
      if (res.data.success) setAgentes(res.data.agentes);
    }
  };

  // NUEVA AGENCIA
  const handleNuevaChange = (e) => {
    const { name, value } = e.target;
    setNuevaAgencia((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardarNueva = async () => {
    await axios.post(`${API_URL}/api/agencias`, nuevaAgencia);
    setShowNuevoModal(false);
    setNuevaAgencia({
      nombre: "",
      agencia: "",
      agente: "",
      comision: "",
      telefono: "",
      localidad: "",
      provincia: "",
      domicilio: "",
      sellado: "SI",
      observaciones: "",
    });
    axios.get(`${API_URL}/api/agencias`).then((res) => {
      if (res.data.success) setAgencias(res.data.agencias);
    });
  };

  const agenciasFiltradas = agencias.filter(
    (a) =>
      (a.nombre && a.nombre.toLowerCase().includes(busqueda.toLowerCase())) ||
      (a.agencia && a.agencia.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <div className="content">
      <h1>Agencias</h1>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Button
          variant="success"
          className="me-3"
          onClick={() => setShowNuevoModal(true)}
          style={{ minWidth: 180 }}
        >
          + Nueva agencia
        </Button>
        <input
          type="text"
          className="form-control"
          style={{
            maxWidth: 252,
            marginLeft: "auto",
            marginRight: 0,
            borderRadius: 30,
            fontSize: "1.25rem",
            marginTop: 26,

          }}
          placeholder="Buscar por nombre o agencia..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Agencia</th>
            <th>Agente</th>
            <th>Localidad</th>
            <th>Provincia</th>
            <th>Domicilio</th>
            <th>Comisión</th>
            <th>Sellado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {agenciasFiltradas.map((agencia) => (
            <tr key={agencia.id}>
              <td>{agencia.id}</td>
              <td>{agencia.nombre}</td>
              <td>{agencia.agencia}</td>
              <td>{agencia.agente}</td>
              <td>{agencia.localidad}</td>
              <td>{agencia.provincia}</td>
              <td>{agencia.domicilio}</td>
              <td>{agencia.comision}%</td>
              <td>{agencia.sellado}</td>
              <td style={{ textAlign: "center" }}>
                <button
                  className="btn btn-light"
                  style={{
                    borderRadius: 16,
                    padding: "4px 10px",
                    marginTop: 1,
                    width: "48%",
                  }}
                  onClick={() => handleVerMas(agencia)}
                  title="Ver más datos de agencia"
                >
                  <span style={{ fontSize: 22, color: "white" }}>⋮</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal de edición/ver más */}
      <Modal
        show={showModal}
        onHide={handleClose}
        centered
        dialogClassName="modal-agencia-ancha"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editando ? "Editar agencia" : "Datos completos de la agencia"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {agenciaSeleccionada && !editando && (
            <div>
              <p>
                <strong>ID:</strong> {agenciaSeleccionada.id}
              </p>
              <p>
                <strong>Nombre:</strong> {agenciaSeleccionada.nombre}
              </p>
              <p>
                <strong>Agencia:</strong> {agenciaSeleccionada.agencia}
              </p>
              <p>
                <strong>Agente:</strong> {agenciaSeleccionada.agente}
              </p>
              <p>
                <strong>Localidad:</strong> {agenciaSeleccionada.localidad}
              </p>
              <p>
                <strong>Provincia:</strong> {agenciaSeleccionada.provincia}
              </p>
              <p>
                <strong>Domicilio:</strong> {agenciaSeleccionada.domicilio}
              </p>
              <p>
                <strong>Comisión:</strong> {agenciaSeleccionada.comision}%
              </p>
              <p>
                <strong>Sellado:</strong> {agenciaSeleccionada.sellado}
              </p>
              <p>
                <strong>Teléfono:</strong> {agenciaSeleccionada.telefono}
              </p>
              <p>
                <strong>Observaciones:</strong>{" "}
                {agenciaSeleccionada.observaciones}
              </p>
            </div>
          )}
          {editando && agenciaEdit && (
            <Form>
              <Form.Group className="mb-2">
                <Form.Label>Nombre</Form.Label>
                <Form.Control
                  type="text"
                  name="nombre"
                  value={agenciaEdit.nombre}
                  onChange={handleEditChange}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Agencia</Form.Label>
                <Form.Control
                  type="text"
                  name="agencia"
                  value={agenciaEdit.agencia}
                  onChange={handleEditChange}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Agente</Form.Label>
                <Form.Select
                  name="agente"
                  value={agenciaEdit.agente}
                  onChange={handleEditChange}
                >
                  <option value="">Seleccione agente</option>
                  {agentes.map((a) => (
                    <option key={a.id} value={a.nombre}>
                      {a.nombre}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control
                  type="text"
                  value={nuevoAgente}
                  onChange={(e) => setNuevoAgente(e.target.value)}
                  placeholder="Nuevo agente"
                  className="mt-1"
                />
                <Button size="sm" className="mt-1" onClick={handleAddAgente}>
                  Agregar agente
                </Button>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Comisión (%)</Form.Label>
                <Form.Control
                  type="number"
                  name="comision"
                  value={agenciaEdit.comision}
                  onChange={handleEditChange}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Provincia</Form.Label>
                <Form.Select
                  name="provincia"
                  value={agenciaEdit.provincia}
                  onChange={handleEditChange}
                >
                  <option value="">Seleccione provincia</option>
                  {provincias.map((p) => (
                    <option key={p.id} value={p.nombre}>
                      {p.nombre}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Localidad</Form.Label>
                <Form.Select
                  name="localidad"
                  value={agenciaEdit.localidad}
                  onChange={handleEditChange}
                >
                  <option value="">Seleccione localidad</option>
                  {localidades.map((l) => (
                    <option key={l.id} value={l.nombre}>
                      {l.nombre}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Domicilio</Form.Label>
                <Form.Control
                  type="text"
                  name="domicilio"
                  value={agenciaEdit.domicilio}
                  onChange={handleEditChange}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Sellado</Form.Label>
                <Form.Select
                  name="sellado"
                  value={agenciaEdit.sellado}
                  onChange={handleEditChange}
                >
                  <option value="SI">SI</option>
                  <option value="NO">NO</option>
                </Form.Select>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Teléfono</Form.Label>
                <Form.Control
                  type="text"
                  name="telefono"
                  value={agenciaEdit.telefono}
                  onChange={handleEditChange}
                />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label>Observaciones</Form.Label>
                <Form.Control
                  as="textarea"
                  name="observaciones"
                  value={agenciaEdit.observaciones}
                  onChange={handleEditChange}
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          {!editando && (
            <>
              <Button variant="primary" onClick={handleEditar}>
                Editar agencia
              </Button>
              <Button variant="secondary" onClick={handleClose}>
                Cerrar
              </Button>
            </>
          )}
          {editando && (
            <>
              <Button variant="success" onClick={handleGuardar}>
                Guardar
              </Button>
              <Button variant="secondary" onClick={handleClose}>
                Cancelar
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>

      {/* Modal de nueva agencia */}
      <Modal
        show={showNuevoModal}
        onHide={() => setShowNuevoModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Nueva agencia</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Nombre</Form.Label>
              <Form.Control
                type="text"
                name="nombre"
                value={nuevaAgencia.nombre}
                onChange={handleNuevaChange}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Agencia</Form.Label>
              <Form.Control
                type="text"
                name="agencia"
                value={nuevaAgencia.agencia}
                onChange={handleNuevaChange}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Agente</Form.Label>
              <Form.Select
                name="agente"
                value={nuevaAgencia.agente}
                onChange={handleNuevaChange}
              >
                <option value="">Seleccione agente</option>
                {agentes.map((a) => (
                  <option key={a.id} value={a.nombre}>
                    {a.nombre}
                  </option>
                ))}
              </Form.Select>
              <Form.Control
                type="text"
                value={nuevoAgente}
                onChange={(e) => setNuevoAgente(e.target.value)}
                placeholder="Nuevo agente"
                className="mt-1"
              />
              <Button size="sm" className="mt-1" onClick={handleAddAgente}>
                Agregar agente
              </Button>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Comisión (%)</Form.Label>
              <Form.Control
                type="number"
                name="comision"
                value={nuevaAgencia.comision}
                onChange={handleNuevaChange}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Provincia</Form.Label>
              <Form.Select
                name="provincia"
                value={nuevaAgencia.provincia}
                onChange={handleNuevaChange}
              >
                <option value="">Seleccione provincia</option>
                {provincias.map((p) => (
                  <option key={p.id} value={p.nombre}>
                    {p.nombre}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Localidad</Form.Label>
              <Form.Select
                name="localidad"
                value={nuevaAgencia.localidad}
                onChange={handleNuevaChange}
              >
                <option value="">Seleccione localidad</option>
                {localidadesNueva.map((l) => (
                  <option key={l.id} value={l.nombre}>
                    {l.nombre}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Domicilio</Form.Label>
              <Form.Control
                type="text"
                name="domicilio"
                value={nuevaAgencia.domicilio}
                onChange={handleNuevaChange}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Sellado</Form.Label>
              <Form.Select
                name="sellado"
                value={nuevaAgencia.sellado}
                onChange={handleNuevaChange}
              >
                <option value="SI">SI</option>
                <option value="NO">NO</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Teléfono</Form.Label>
              <Form.Control
                type="text"
                name="telefono"
                value={nuevaAgencia.telefono}
                onChange={handleNuevaChange}
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Observaciones</Form.Label>
              <Form.Control
                as="textarea"
                name="observaciones"
                value={nuevaAgencia.observaciones}
                onChange={handleNuevaChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="success" onClick={handleGuardarNueva}>
            Guardar
          </Button>
          <Button variant="secondary" onClick={() => setShowNuevoModal(false)}>
            Cancelar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Agencias;
