import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, Route, Routes } from 'react-router-dom';

function Tablero() {
    const [data, setData] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [minAFinanciar, setMinAFinanciar] = useState('');
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const response = await axios.get('http://localhost:5000/api/data', { withCredentials: true });
            setData(response.data);
            setMinAFinanciar(response.data.minAFinanciar.valor);
        };
        fetchData();
    }, []);

    const handleSave = async () => {
        const updatedData = {
            minAFinanciar: { valor: minAFinanciar },
            productos: {
                [selectedProduct]: data.productos[selectedProduct]
            }
        };
        await axios.post('http://localhost:5000/api/data', updatedData, { withCredentials: true });
        setShowModal(true);
    };

    const handleProductChange = (e) => {
        setSelectedProduct(e.target.value);
    };

    const handleInputChange = (e, product, plazo, field) => {
        const value = e.target.value;
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

    const agregarPlazo = () => {
        const nuevoPlazo = prompt('Ingrese el nuevo plazo en meses:');
        if (nuevoPlazo) {
            const productoForm = document.getElementById('productoForm');
            const nuevoPlazoHtml = generarPlazoHtml(selectedProduct, nuevoPlazo, { interest: '', fee: '', minfee: '' });
            productoForm.insertAdjacentHTML('beforeend', nuevoPlazoHtml);
        }
    };

    const generarPlazoHtml = (producto, plazo, datos) => {
        return (
            <div id={`${producto}${plazo}Form`} key={`${producto}${plazo}Form`}>
                <label htmlFor={`${producto}${plazo}Interest`}>Interés {plazo} meses:</label>
                <input
                    type="number"
                    id={`${producto}${plazo}Interest`}
                    name={`${producto}${plazo}Interest`}
                    value={datos.interest}
                    onChange={(e) => handleInputChange(e, producto, plazo, 'interest')}
                    required
                />
                <label htmlFor={`${producto}${plazo}Fee`}>Fee {plazo} meses:</label>
                <input
                    type="number"
                    id={`${producto}${plazo}Fee`}
                    name={`${producto}${plazo}Fee`}
                    value={datos.fee}
                    onChange={(e) => handleInputChange(e, producto, plazo, 'fee')}
                    required
                />
                <label htmlFor={`${producto}${plazo}MinFee`}>Min Fee {plazo} meses:</label>
                <input
                    type="number"
                    id={`${producto}${plazo}MinFee`}
                    name={`${producto}${plazo}MinFee}`}
                    value={datos.minfee}
                    onChange={(e) => handleInputChange(e, producto, plazo, 'minfee')}
                    required
                />
                <button type="button" onClick={() => confirmarEliminarPlazo(producto, plazo)}>Eliminar Plazo</button>
            </div>
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
        <div>
            <h1>Tablero de Configuración</h1>
            <form id="configForm">
                <div>
                    <label>Mínimo a Financiar:</label>
                    <input type="number" value={minAFinanciar} onChange={(e) => setMinAFinanciar(e.target.value)} />
                </div>
                <div>
                    <label>Seleccionar Producto:</label>
                    <select value={selectedProduct} onChange={handleProductChange}>
                        <option value="" disabled>Seleccione un producto</option>
                        <option value="a">Producto A</option>
                        <option value="b">Producto B</option>
                    </select>
                </div>
                <div id="productoForm" style={{ display: selectedProduct ? 'block' : 'none' }}>
                    {selectedProduct && (
                        <div>
                            <h2>Producto {selectedProduct.toUpperCase()}</h2>
                            {Object.keys(data.productos[selectedProduct].plazos).map(plazo => (
                                generarPlazoHtml(selectedProduct, plazo, data.productos[selectedProduct].plazos[plazo])
                            ))}
                        </div>
                    )}
                </div>
                <div id="plazosContainer" style={{ display: selectedProduct ? 'block' : 'none' }}>
                    <label>Plazos:</label>
                    <button type="button" id="agregarPlazoBtn" onClick={agregarPlazo}>Agregar Plazo</button>
                </div>
                <button type="button" onClick={handleSave}>Guardar</button>
            </form>
            {showModal && (
                <div id="myModal" className="modal" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <span className="close" onClick={() => setShowModal(false)}>&times;</span>
                        <p>¡Cambios guardados exitosamente!</p>
                    </div>
                </div>
            )}
        </div>
    );
}

function Cotizar() {
    return <div><h1>Cotizar</h1><p>Página en construcción...</p></div>;
}

function Operaciones() {
    return <div><h1>Operaciones</h1><p>Página en construcción...</p></div>;
}

function Instructivos() {
    return <div><h1>Instructivos</h1><p>Página en construcción...</p></div>;
}

function Dashboard() {
    const handleLogout = async () => {
        await axios.post('http://localhost:5000/api/logout', {}, { withCredentials: true });
        window.location.reload();
    };

    return (
        <div>
            <nav className="navbar">
                <img src="/lever.svg" alt="Lever Logo" className="logo" />
                <ul className="nav-links">
                    <li><Link to="/dashboard/tablero">Tablero</Link></li>
                    <li><Link to="/dashboard/cotizar">Cotizar</Link></li>
                    <li><Link to="/dashboard/operaciones">Operaciones</Link></li>
                    <li><Link to="/dashboard/instructivos">Instructivos</Link></li>
                </ul>
                <button className="buttonCs" onClick={handleLogout}>Cerrar Sesión</button>
            </nav>
            <Routes>
                <Route path="tablero" element={<Tablero />} />
                <Route path="cotizar" element={<Cotizar />} />
                <Route path="operaciones" element={<Operaciones />} />
                <Route path="instructivos" element={<Instructivos />} />
            </Routes>
        </div>
    );
}

export default Dashboard;
