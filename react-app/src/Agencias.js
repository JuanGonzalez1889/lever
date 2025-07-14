import React, { useState } from 'react';
import { Button, Table, Modal, Dropdown, Form } from 'react-bootstrap';
import { ThreeDotsVertical } from 'react-bootstrap-icons';

// Datos de ejemplo (puedes reemplazar por fetch a backend)
const agenciasEjemplo = [
  {
    id: 1,
    vendedor: "Juan Gonzalez",
    agencia: "Agencia Centro",
    agente: "Eze Gomez",
    localidad: "Rosario",
    provincia: "Buenos Aires",
    domicilio: "Av. Corrientes 1234",
    comision: "5%",
    sellado: "Sí",
    telefono: "11-1234-5678",
    zona: "Norte",
  },
  {
    id: 2,
    vendedor: "Vanesa Montes",
    agencia: "Agencia Sur",
    agente: "Eze Gomez",
    localidad: "Rosario",
    provincia: "Buenos Aires",
    domicilio: "Calle 50 456",
    comision: "4%",
    sellado: "No",
    telefono: "221-567-8901",
    zona: "Sur",
  },
  {
    id: 3,
    vendedor: "Joel Venturini",
    agencia: "Agencia Norte",
    agente: "Eze Gomez",
    localidad: "Rosario",
    provincia: "Buenos Aires",
    domicilio: "Calle 50 456",
    comision: "4%",
    sellado: "No",
    telefono: "221-567-8901",
    zona: "Sur",
  },
  {
    id: 4,
    vendedor: "La PINA",
    agencia: "Agencia Este",
    agente: "Eze Gomez",
    localidad: "Rosario",
    provincia: "Buenos Aires",
    domicilio: "Calle 50 456",
    comision: "4%",
    sellado: "No",
    telefono: "221-567-8901",
    zona: "Sur",
  },
  {
    id: 5,
    vendedor: "Leandro Billone",
    agencia: "Agencia Oeste",
    agente: "Eze Gomez",
    localidad: "Venado Tuerto",
    provincia: "Buenos Aires",
    domicilio: "Calle 50 456",
    comision: "4%",
    sellado: "No",
    telefono: "221-567-8901",
    zona: "Sur",
  },
  {
    id: 6,
    vendedor: "Jose Briones",
    agencia: "Agencia Sur",
    agente: "Eze Gomez",
    localidad: "Santa Fe",
    provincia: "Buenos Aires",
    domicilio: "Calle 50 456",
    comision: "4%",
    sellado: "No",
    telefono: "221-567-8901",
    zona: "Sur",
  },
  // ...más agencias
];

function Agencias() {
    const [agencias, setAgencias] = useState(agenciasEjemplo);
    const [showModal, setShowModal] = useState(false);
    const [agenciaSeleccionada, setAgenciaSeleccionada] = useState(null);
    const [editando, setEditando] = useState(false);
    const [agenciaEdit, setAgenciaEdit] = useState(null);

    // Nuevo estado para activar/inactivar
    const [estadoAgencias, setEstadoAgencias] = useState(
        agenciasEjemplo.reduce((acc, ag) => ({ ...acc, [ag.id]: true }), {})
    );

    const handleVerMas = (agencia) => {
        setAgenciaSeleccionada(agencia);
        setEditando(false);
        setShowModal(true);
    };

    const handleClose = () => {
        setShowModal(false);
        setAgenciaSeleccionada(null);
        setEditando(false);
    };

    const handleEditar = () => {
        setAgenciaEdit({ ...agenciaSeleccionada });
        setEditando(true);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setAgenciaEdit(prev => ({ ...prev, [name]: value }));
    };

    const handleGuardar = () => {
        setAgencias(prev =>
            prev.map(a => a.id === agenciaEdit.id ? { ...agenciaEdit } : a)
        );
        setAgenciaSeleccionada({ ...agenciaEdit });
        setEditando(false);
    };

    // Activar/Inactivar agencia
    const handleToggleEstado = (id) => {
        setEstadoAgencias(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    return (
        <div className="content">
            <h1>Agencias</h1>
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Vendedor</th>
                        <th>Agencia</th>
                        <th>Agente</th>
                        <th>Localidad</th>
                        <th>Sellado</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {agencias.map((agencia) => (
                        <tr key={agencia.id}>
                            <td>{agencia.id}</td>
                            <td>{agencia.vendedor}</td>
                            <td>{agencia.agencia}</td>
                            <td>{agencia.agente}</td>
                            <td>{agencia.localidad}</td>
                            <td>{agencia.sellado}</td>
                            <td style={{ textAlign: 'center' }}>
                                <Dropdown align="end">
                                    <Dropdown.Toggle
                                        as="span"
                                        style={{
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: 'none',
                                            background: 'none',
                                            padding: 0,
                                            boxShadow: 'none'
                                        }}
                                    >
                                        <ThreeDotsVertical size={22} />
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                        <Dropdown.Item onClick={() => handleVerMas(agencia)}>
                                            Ver más datos de agencia...
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={() => handleToggleEstado(agencia.id)}>
                                            {estadoAgencias[agencia.id] ? 'Inactivar' : 'Activar'}
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <Modal show={showModal} onHide={handleClose} centered dialogClassName="modal-agencia-ancha">
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editando ? 'Editar agencia' : 'Datos completos de la agencia'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {agenciaSeleccionada && !editando && (
                        <div>
                            <p><strong>ID:</strong> {agenciaSeleccionada.id}</p>
                            <p><strong>Vendedor:</strong> {agenciaSeleccionada.vendedor}</p>
                            <p><strong>Agencia:</strong> {agenciaSeleccionada.agencia}</p>
                            <p><strong>Agente:</strong> {agenciaSeleccionada.agente}</p>
                            <p><strong>Localidad:</strong> {agenciaSeleccionada.localidad}</p>
                            <p><strong>Provincia:</strong> {agenciaSeleccionada.provincia}</p>
                            <p><strong>Domicilio:</strong> {agenciaSeleccionada.domicilio}</p>
                            <p><strong>Comisión:</strong> {agenciaSeleccionada.comision}</p>
                            <p><strong>Sellado:</strong> {agenciaSeleccionada.sellado}</p>
                            <p><strong>Teléfono:</strong> {agenciaSeleccionada.telefono}</p>
                            <p><strong>Zona:</strong> {agenciaSeleccionada.zona}</p>
                        </div>
                    )}
                    {editando && agenciaEdit && (
                        <Form>
                            <Form.Group className="mb-2">
                                <Form.Label>ID</Form.Label>
                                <Form.Control type="text" name="id" value={agenciaEdit.id} disabled />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Vendedor</Form.Label>
                                <Form.Control type="text" name="vendedor" value={agenciaEdit.vendedor} onChange={handleEditChange} />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Agencia</Form.Label>
                                <Form.Control type="text" name="agencia" value={agenciaEdit.agencia} onChange={handleEditChange} />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Agente</Form.Label>
                                <Form.Control type="text" name="agente" value={agenciaEdit.agente} onChange={handleEditChange} />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Localidad</Form.Label>
                                <Form.Control type="text" name="localidad" value={agenciaEdit.localidad} onChange={handleEditChange} />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Provincia</Form.Label>
                                <Form.Control type="text" name="provincia" value={agenciaEdit.provincia} onChange={handleEditChange} />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Domicilio</Form.Label>
                                <Form.Control type="text" name="domicilio" value={agenciaEdit.domicilio} onChange={handleEditChange} />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Comisión</Form.Label>
                                <Form.Control type="text" name="comision" value={agenciaEdit.comision} onChange={handleEditChange} />
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Sellado</Form.Label>
                                <Form.Select
                                    name="sellado"
                                    value={agenciaEdit.sellado}
                                    onChange={handleEditChange}
                                >
                                    <option value="Sí">Sí</option>
                                    <option value="No">No</option>
                                </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-2">
                                <Form.Label>Zona</Form.Label>
                                <Form.Select
                                    name="zona"
                                    value={agenciaEdit.zona}
                                    onChange={handleEditChange}
                                >
                                    <option value="zona 1">zona 1</option>
                                    <option value="zona 2">zona 2</option>
                                    <option value="zona 3">zona 3</option>
                                    <option value="zona 4">zona 4</option>
                                    <option value="zona 5">zona 5</option>
                                </Form.Select>
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
        </div>
    );
}

export default Agencias;
