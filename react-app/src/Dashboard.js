import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, Route, Routes } from 'react-router-dom';
import { Navbar, Nav, Container, Table, Button, Modal, Form } from 'react-bootstrap';
import { FaTimes } from 'react-icons/fa';
import { House, Calculator, Briefcase, Book, BoxArrowRight } from 'react-bootstrap-icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Dashboard.css'; // Importar el archivo CSS personalizado
import Cotizador from './Cotizador'; // Importar el nuevo componente Cotizador

function Tablero() {
    const [data, setData] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [minAFinanciar, setMinAFinanciar] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [ltv, setLtv] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(
                  "https://api.lever.com.ar/api/data",
                  { withCredentials: true }
                );
                setData(response.data);
                setMinAFinanciar(formatNumber(response.data.minAFinanciar));
                setLtv(response.data.ltv || {});
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, []);

    const formatNumber = (number) => {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const handleSave = async () => {
        const updatedLtv = { ...ltv };
        // Convertir los valores de LTV a números si es necesario
        Object.keys(updatedLtv).forEach(year => {
            if (typeof updatedLtv[year] === 'object' && updatedLtv[year].value) {
                updatedLtv[year] = parseFloat(updatedLtv[year].value);
            }
        });

        const updatedData = {
            minAFinanciar: parseInt(minAFinanciar.replace(/\./g, '')),
            productos: {
                [selectedProduct]: data.productos[selectedProduct]
            },
            ltv: {
                ...data.ltv,
                [selectedProduct]: updatedLtv
            }
        };
        try {
            await axios.post(
              "https://api.lever.com.ar/api/data",
              updatedData,
              { withCredentials: true }
            );
            setShowModal(true);
        } catch (error) {
            console.error('Error saving data:', error);
        }
    };

    const handleProductChange = (e) => {
        setSelectedProduct(e.target.value);
        // Cargar los LTV del producto seleccionado
        if (data && data.ltv && data.ltv[e.target.value]) {
            setLtv(data.ltv[e.target.value]);
        }
    };

    const handleInputChange = (e, product, plazo, field) => {
        const value = e.target.value; // Mantener los puntos como separadores decimales
        setData(prevData => ({
            ...prevData,
            productos: {
                ...prevData.productos,
                [product]: {
                    ...prevData.productos[product],
                    plazos: {
                        ...prevData.productos[product].plazos,
                        [plazo]: {
                            ...prevData.productos[product].plazos[plazo],
                            [field]: value
                        }
                    }
                }
            }
        }));
    };

    const handleLtvChange = (e, year, field) => {
        const value = field === 'show' ? e.target.checked : e.target.value; // Manejar checkbox para 'show'
        setLtv(prevLtv => ({
            ...prevLtv,
            [year]: {
                ...prevLtv[year],
                [field]: value
            }
        }));
    };

    const agregarPlazo = () => {
        const nuevoPlazo = prompt('Ingrese el nuevo plazo en meses:');
        if (nuevoPlazo) {
            setData(prevData => ({
                ...prevData,
                productos: {
                    ...prevData.productos,
                    [selectedProduct]: {
                        ...prevData.productos[selectedProduct],
                        plazos: {
                            ...prevData.productos[selectedProduct].plazos,
                            [nuevoPlazo]: { interest: '', fee: '', minfee: '' }
                        }
                    }
                }
            }));
        }
    };

    const generarPlazoHtml = (producto, plazo, datos) => {
        return (
            <tr key={`${producto}${plazo}Form`}>
                <td>{plazo} meses</td>
                <td>
                    <Form.Control
                        type="number"
                        value={datos.interest} // Mantener los puntos como separadores decimales
                        onChange={(e) => handleInputChange(e, producto, plazo, 'interest')}
                        required
                    />
                </td>
                <td>
                    <Form.Control
                        type="number"
                        value={datos.fee} // Mantener los puntos como separadores decimales
                        onChange={(e) => handleInputChange(e, producto, plazo, 'fee')}
                        required
                    />
                </td>
                <td>
                    <Form.Control
                        type="number"
                        value={datos.minfee} // Mantener los puntos como separadores decimales
                        onChange={(e) => handleInputChange(e, producto, plazo, 'minfee')}
                        required
                    />
                </td>
                <td style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <FaTimes
                        color="red"
                        style={{ cursor: 'pointer' }}
                        onClick={() => confirmarEliminarPlazo(producto, plazo)}
                    />
                </td>
            </tr>
        );
    };

    const confirmarEliminarPlazo = (producto, plazo) => {
        const confirmacion = window.confirm('¿Está seguro que desea eliminar el plazo seleccionado?');
        if (confirmacion) {
            eliminarPlazo(producto, plazo);
        }
    };

    const eliminarPlazo = (producto, plazo) => {
        setData(prevData => {
            const newPlazos = { ...prevData.productos[producto].plazos };
            delete newPlazos[plazo];
            return {
                ...prevData,
                productos: {
                    ...prevData.productos,
                    [producto]: {
                        ...prevData.productos[producto],
                        plazos: newPlazos
                    }
                }
            };
        });
    };

    if (!data) return <div>Cargando...</div>;

    return (
        <div className="content">
            <h1>Tablero de Configuración</h1>
            <Form id="configForm">
                <Form.Group controlId="minAFinanciar">
                    <Form.Label>Mínimo a Financiar:</Form.Label>
                    <Form.Control
                        type="text"
                        value={minAFinanciar} // Mantener los puntos como separadores decimales
                        onChange={(e) => setMinAFinanciar(formatNumber(e.target.value.replace(/\./g, '')))} // Mantener los puntos como separadores decimales
                    />
                </Form.Group>
                <Form.Group controlId="selectedProduct">
                    <Form.Label>Seleccionar Producto:</Form.Label>
                    <Form.Control as="select" value={selectedProduct} onChange={handleProductChange}>
                        <option value="" disabled>Seleccione un producto</option>
                        <option value="a">Producto A</option>
                        <option value="b">Producto B</option>
                    </Form.Control>
                </Form.Group>
                {selectedProduct && (
                    <div id="productoForm">
                        <h2>Producto {selectedProduct.toUpperCase()}</h2>
                        <Table striped bordered hover>
                            <thead>
                                <tr>
                                    <th>Plazo</th>
                                    <th>Interés</th>
                                    <th>Fee</th>
                                    <th>Min Fee</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.keys(data.productos[selectedProduct].plazos).map(plazo => (
                                    generarPlazoHtml(selectedProduct, plazo, data.productos[selectedProduct].plazos[plazo])
                                ))}
                            </tbody>
                        </Table>
                        <Button variant="primary" onClick={agregarPlazo}>Agregar Plazo</Button>
                    </div>
                )}
                {selectedProduct && (
                    <div id="ltvForm">
                        <h2>LTV por Año para Producto {selectedProduct.toUpperCase()}</h2>
                        <Table striped bordered hover>
                            <thead>
                                <tr>
                                    <th>Año</th>
                                    <th>LTV</th>
                                    <th>Mostrar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012].map(year => (
                                    <tr key={`${selectedProduct}${year}Ltv`}>
                                        <td>{year}</td>
                                        <td>
                                            <Form.Control
                                                type="number"
                                                value={ltv[year]?.value || ltv[year] || ''} // Mantener los puntos como separadores decimales
                                                onChange={(e) => handleLtvChange(e, year, 'value')}
                                                required
                                            />
                                        </td>
                                        <td>
                                            <Form.Check
                                                type="checkbox"
                                                checked={ltv[year]?.show || false}
                                                onChange={(e) => handleLtvChange(e, year, 'show')}
                                                disabled // Deshabilitar el checkbox
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                )}
                <Button variant="success" onClick={handleSave}>Guardar</Button>
            </Form>
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>¡Cambios guardados exitosamente!</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Los cambios han sido guardados correctamente.</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cerrar</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

function Cotizar() {
    return <Cotizador />;
}

function Operaciones() {
    return <div className="content"><h1>Operaciones</h1><p>Página en construcción...</p></div>;
}

function Instructivos() {
    return <div className="content"><h1>Instructivos</h1><p>Página en construcción...</p></div>;
}

function Dashboard() {
    const handleLogout = async () => {
        try {
            await axios.post(
              "https://api.lever.com.ar/api/logout",
              {},
              { withCredentials: true }
            );
            window.location.reload();
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <Navbar bg="dark" variant="dark" expand="lg" className="flex-column sidebar">
                <Container className="d-flex flex-column h-100">
                    <Navbar.Brand href="#">LEVER</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav" className="flex-grow-1">
                        <Nav className="flex-column flex-grow-1" style={{ marginBottom: '16rem' }}>
                            <Nav.Link as={Link} to="/dashboard/tablero"><House className="me-2" />Tablero</Nav.Link>
                            <Nav.Link as={Link} to="/dashboard/cotizar"><Calculator className="me-2" />Cotizar</Nav.Link>
                            <Nav.Link as={Link} to="/dashboard/operaciones"><Briefcase className="me-2" />Operaciones</Nav.Link>
                            <Nav.Link as={Link} to="/dashboard/instructivos"><Book className="me-2" />Instructivos</Nav.Link>
                        </Nav>
                    </Navbar.Collapse>
                    <Nav className="flex-column mt-auto">
                        <Nav.Link onClick={handleLogout}><BoxArrowRight className="me-2" />Cerrar Sesión</Nav.Link>
                    </Nav>
                </Container>
            </Navbar>
            <div className="main-content">
                <Routes>
                    <Route path="tablero" element={<Tablero />} />
                    <Route path="cotizar" element={<Cotizador />} />
                    <Route path="operaciones" element={<Operaciones />} />
                    <Route path="instructivos" element={<Instructivos />} />
                </Routes>
            </div>
        </div>
    );
}

export default Dashboard;
