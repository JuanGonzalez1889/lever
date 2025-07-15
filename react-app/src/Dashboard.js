import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, Route, Routes } from 'react-router-dom';
import { Navbar, Nav, Container, Table, Button, Modal, Form } from 'react-bootstrap';
import { FaTimes } from 'react-icons/fa';
import { House, Calculator, Briefcase, Book, BoxArrowRight } from 'react-bootstrap-icons';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Dashboard.css'; // Importar el archivo CSS personalizado
import Cotizador from './Cotizador'; // Importar el nuevo componente Cotizador

const API_URL = process.env.REACT_APP_API_URL; // Leer la URL desde .env
console.log('API_URL (Dashboard):', API_URL); // Verificar que se está utilizando el .env

function Tablero() {
    const [data, setData] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [products, setProducts] = useState([]);
    const [minAFinanciar, setMinAFinanciar] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [ltv, setLtv] = useState({});
    const [showNewProductModal, setShowNewProductModal] = useState(false); // Nuevo estado para el modal
    const [newProduct, setNewProduct] = useState({
        nombre: '',
        minAFinanciar: '',
        ltv: {},
        plazos: {}
    });
    const [newProductName, setNewProductName] = useState(''); // Estado para el nuevo nombre del producto

    console.log('API_URL (Tablero):', API_URL); // Verificar la URL

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(
                    `${API_URL}/api/data`, // Usar la URL global
                    { withCredentials: true }
                );
                setData(response.data);
                setProducts(Object.keys(response.data.productos)); // Obtener los nombres de los productos
                setMinAFinanciar(formatNumber(response.data.minAFinanciar));
                setLtv(response.data.ltv || {});
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedProduct) {
            setNewProductName(selectedProduct); // Inicializar el nuevo nombre con el nombre actual
        }
    }, [selectedProduct]);

    const formatNumber = (number) => {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const handleSave = async () => {
        // --- CORRECCIÓN: Normalizar el objeto LTV ---
        const updatedLtv = {};
        Object.keys(ltv).forEach(year => {
            // Si el valor es un objeto, mantener value y show
            if (typeof ltv[year] === 'object') {
                updatedLtv[year] = {
                    value: ltv[year].value ?? ltv[year],
                    show: ltv[year].show ?? 1
                };
            } else {
                // Si es un número, poner como value y show=1
                updatedLtv[year] = { value: ltv[year], show: 1 };
            }
        });

        const updatedData = {
            minAFinanciar: parseInt(minAFinanciar.replace(/\./g, '')),
            productos: {
                [selectedProduct]: data.productos[selectedProduct] // Solo enviar el producto seleccionado
            },
            ltv: {
                [selectedProduct]: updatedLtv // Solo enviar el LTV del producto seleccionado
            },
            newProductName // Enviar el nuevo nombre del producto
        };

        try {
            await axios.post(
                `${API_URL}/api/data`, // Usa la URL dinámica
                updatedData,
                { withCredentials: true }
            );

            // Actualizar el estado local con el nuevo nombre
            setData(prevData => {
                const newProductos = { ...prevData.productos };
                newProductos[newProductName] = newProductos[selectedProduct];
                delete newProductos[selectedProduct];
                return {
                    ...prevData,
                    productos: newProductos
                };
            });

            setProducts(prevProducts => prevProducts.map(product => (product === selectedProduct ? newProductName : product)));
            setSelectedProduct(newProductName); // Actualizar el producto seleccionado
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
                            [nuevoPlazo]: { interest: '', fee: '', minfee: '' } // Inicializar valores vacíos
                        }
                    }
                }
            }));
        }
    };

    const generarPlazoHtml = (producto, plazo, datos) => {
        if (!datos) return null; // Manejar el caso en que los datos sean undefined
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

    const eliminarPlazo = async (producto, plazo) => {
        try {
            // Enviar solicitud al backend para eliminar el plazo
            await axios.delete(`${API_URL}/api/plazo`, {
                data: { producto, plazo },
                withCredentials: true
            });

            // Actualizar el estado local después de eliminar
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
        } catch (error) {
            console.error('Error eliminando el plazo:', error);
        }
    };

    const handleNewProductChange = (e, field) => {
        setNewProduct(prev => ({
            ...prev,
            [field]: e.target.value
        }));
    };

    const handleNewProductLtvChange = (e, year, field) => {
        const value = field === 'show' ? e.target.checked : e.target.value;
        setNewProduct(prev => ({
            ...prev,
            ltv: {
                ...prev.ltv,
                [year]: {
                    ...prev.ltv[year],
                    [field]: value
                }
            }
        }));
    };

    const handleNewProductPlazoChange = (e, plazo, field) => {
        const value = e.target.value;
        setNewProduct(prev => ({
            ...prev,
            plazos: {
                ...prev.plazos,
                [plazo]: {
                    ...prev.plazos[plazo],
                    [field]: value
                }
            }
        }));
    };

    const agregarNuevoPlazo = () => {
        const nuevoPlazo = prompt('Ingrese el nuevo plazo en meses:');
        if (nuevoPlazo) {
            setNewProduct(prev => ({
                ...prev,
                plazos: {
                    ...prev.plazos,
                    [nuevoPlazo]: { interest: '', fee: '', minfee: '' }
                }
            }));
        }
    };

    const handleSaveNewProduct = async () => {
        try {
            await axios.post(
                `${API_URL}/api/new-product`,
                newProduct,
                { withCredentials: true }
            );
            setShowNewProductModal(false);
            setNewProduct({ nombre: '', minAFinanciar: '', ltv: {}, plazos: {} });
            // Recargar los datos
            const response = await axios.get(`${API_URL}/api/data`, { withCredentials: true });
            setData(response.data);
            setProducts(Object.keys(response.data.productos));
        } catch (error) {
            console.error('Error saving new product:', error);
        }
    };

    const eliminarProducto = async () => {
        const confirmacion = window.confirm(`¿Está seguro que desea eliminar el producto "${selectedProduct}" y todos sus datos asociados?`);
        if (!confirmacion) return;

        try {
            // Enviar solicitud al backend para eliminar el producto
            await axios.delete(`${API_URL}/api/producto`, {
                data: { producto: selectedProduct },
                withCredentials: true
            });

            // Actualizar el estado local después de eliminar
            setData(prevData => {
                const newProductos = { ...prevData.productos };
                delete newProductos[selectedProduct];
                return {
                    ...prevData,
                    productos: newProductos
                };
            });

            setProducts(prevProducts => prevProducts.filter(product => product !== selectedProduct));
            setSelectedProduct(''); // Limpiar el producto seleccionado
        } catch (error) {
            console.error('Error eliminando el producto:', error);
        }
    };

    const eliminarLtv = async (producto, year) => {
        try {
            // Enviar solicitud al backend para eliminar el año de LTV
            await axios.delete(`${API_URL}/api/ltv`, {
                data: { producto, year },
                withCredentials: true
            });

            // Actualizar el estado local después de eliminar
            setLtv(prevLtv => {
                const newLtv = { ...prevLtv };
                delete newLtv[year];
                return newLtv;
            });
        } catch (error) {
            console.error('Error eliminando el LTV:', error);
        }
    };

    const agregarAnoLtv = () => {
        const nuevoAno = prompt('Ingrese el nuevo año:');
        if (nuevoAno && !ltv[nuevoAno]) {
            setLtv(prevLtv => ({
                ...prevLtv,
                [nuevoAno]: { value: '' } // Inicializar con un valor vacío
            }));
        } else if (ltv[nuevoAno]) {
            alert('El año ya existe en el LTV.');
        }
    };

    if (!data) return <div>Cargando...</div>;

    return (
        <div className="content">
            <h1>Tablero de Configuración</h1>
            <Button variant="primary" onClick={() => setShowNewProductModal(true)}>Nuevo Producto</Button>
            {selectedProduct && (
                <Button variant="danger" onClick={eliminarProducto} style={{ marginLeft: '10px' }}>
                    Eliminar Producto
                </Button>
            )}
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
                        {products.map(product => ( // Renderizar dinámicamente los productos
                            <option key={product} value={product}>{product}</option>
                        ))}
                    </Form.Control>
                </Form.Group>
                {selectedProduct && (
                    <Form.Group controlId="newProductName">
                        <Form.Label>Modificar Nombre del Producto:</Form.Label>
                        <Form.Control
                            type="text"
                            value={newProductName}
                            onChange={(e) => setNewProductName(e.target.value)}
                            required
                        />
                    </Form.Group>
                )}
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
                                {data.productos[selectedProduct]?.plazos &&
                                    Object.keys(data.productos[selectedProduct].plazos).map(plazo =>
                                        generarPlazoHtml(selectedProduct, plazo, data.productos[selectedProduct].plazos[plazo])
                                    )}
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
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.keys(ltv).map(year => (
                                    <tr key={`${selectedProduct}${year}Ltv`}>
                                        <td>{year}</td>
                                        <td>
                                            <Form.Control
                                                type="number"
                                                value={ltv[year]?.value || ''}
                                                onChange={(e) => handleLtvChange(e, year, 'value')}
                                                required
                                            />
                                        </td>
                                        <td style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            <FaTimes
                                                color="red"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => eliminarLtv(selectedProduct, year)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                        <Button variant="secondary" onClick={agregarAnoLtv}>Agregar Año</Button>
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

            {/* Modal para nuevo producto */}
            <Modal show={showNewProductModal} onHide={() => setShowNewProductModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Nuevo Producto</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group controlId="newProductName">
                            <Form.Label>Nombre del Producto:</Form.Label>
                            <Form.Control
                                type="text"
                                value={newProduct.nombre}
                                onChange={(e) => handleNewProductChange(e, 'nombre')}
                                required
                            />
                        </Form.Group>
                        <Form.Group controlId="newProductMinAFinanciar">
                            <Form.Label>Mínimo a Financiar:</Form.Label>
                            <Form.Control
                                type="text"
                                value={newProduct.minAFinanciar}
                                onChange={(e) => handleNewProductChange(e, 'minAFinanciar')}
                                required
                            />
                        </Form.Group>
                        <h5>LTV</h5>
                        <Table striped bordered hover>
                            <thead>
                                <tr>
                                    <th>Año</th>
                                    <th>LTV</th>
                                    <th>Mostrar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[2025, 2024, 2023, 2022, 2021].map(year => (
                                    <tr key={year}>
                                        <td>{year}</td>
                                        <td>
                                            <Form.Control
                                                type="number"
                                                value={newProduct.ltv[year]?.value || ''}
                                                onChange={(e) => handleNewProductLtvChange(e, year, 'value')}
                                            />
                                        </td>
                                        <td>
                                            <Form.Check
                                                type="checkbox"
                                                checked={newProduct.ltv[year]?.show || false}
                                                onChange={(e) => handleNewProductLtvChange(e, year, 'show')}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                        <h5>Plazos</h5>
                        <Table striped bordered hover>
                            <thead>
                                <tr>
                                    <th>Plazo</th>
                                    <th>Interés</th>
                                    <th>Fee</th>
                                    <th>Min Fee</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.keys(newProduct.plazos).map(plazo => (
                                    <tr key={plazo}>
                                        <td>{plazo} meses</td>
                                        <td>
                                            <Form.Control
                                                type="number"
                                                value={newProduct.plazos[plazo]?.interest || ''}
                                                onChange={(e) => handleNewProductPlazoChange(e, plazo, 'interest')}
                                            />
                                        </td>
                                        <td>
                                            <Form.Control
                                                type="number"
                                                value={newProduct.plazos[plazo]?.fee || ''}
                                                onChange={(e) => handleNewProductPlazoChange(e, plazo, 'fee')}
                                            />
                                        </td>
                                        <td>
                                            <Form.Control
                                                type="number"
                                                value={newProduct.plazos[plazo]?.minfee || ''}
                                                onChange={(e) => handleNewProductPlazoChange(e, plazo, 'minfee')}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                        <Button variant="secondary" onClick={agregarNuevoPlazo}>Agregar Plazo</Button>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowNewProductModal(false)}>Cancelar</Button>
                    <Button variant="primary" onClick={handleSaveNewProduct}>Guardar</Button>
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
                `${API_URL}/api/logout`, // Usar la URL global
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
