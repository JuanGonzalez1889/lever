import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Cotizador.css'; // Importar el archivo CSS personalizado

function Cotizador() {
    const [year, setYear] = useState('');
    const [marca, setMarca] = useState('');
    const [modelo, setModelo] = useState('');
    const [marcas, setMarcas] = useState([]);
    const [modelos, setModelos] = useState([]);
    const [precio, setPrecio] = useState(null);
    const [maxAFinanciar, setMaxAFinanciar] = useState(null);
    const [minAFinanciar, setMinAFinanciar] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState('a');
    const [capital, setCapital] = useState('');
    const [cuotas, setCuotas] = useState([]);

    useEffect(() => {
        // Fetch minAFinanciar from calculadora.txt
        const fetchMinAFinanciar = async () => {
            try {
                const response = await axios.get('http://localhost:5000/files/calculadora.txt');
                const data = response.data;
                setMinAFinanciar(data.minAFinanciar.valor);
            } catch (error) {
                console.error('Error fetching minAFinanciar:', error);
            }
        };
        fetchMinAFinanciar();
    }, []);

    const fetchMarcas = async (year) => {
        try {
            const response = await axios.post('http://localhost/lever/php/curl.php', { year, action: 'getBrandsByYear' });
            setMarcas(response.data.brands);
        } catch (error) {
            console.error('Error fetching marcas:', error);
        }
    };

    const fetchModelos = async (idMarca, year) => {
        try {
            const response = await axios.post('http://localhost/lever/php/curl.php', { idMarca, year, action: 'getModelsByBrand' });
            setModelos(response.data.models);
        } catch (error) {
            console.error('Error fetching modelos:', error);
        }
    };

    const fetchPriceCar = async (codia, year) => {
        try {
            const response = await axios.post('http://localhost/lever/php/curl.php', { codia, year, action: 'getPriceByCodia' });
            setPrecio(response.data.price);
            calculateMaxAFinanciar(response.data.price, year);
        } catch (error) {
            console.error('Error fetching price:', error);
        }
    };

    const calculateMaxAFinanciar = (precio, year) => {
        let maxAFinanciar;
        if (selectedProduct === 'a') {
            if (year <= 2025 && year >= 2020) {
                maxAFinanciar = precio * 0.7;
            } else if (year <= 2019 && year >= 2015) {
                maxAFinanciar = precio * 0.6;
            } else if (year <= 2014 && year >= 2012) {
                maxAFinanciar = precio * 0.5;
            }
        } else {
            if (year <= 2024 && year >= 2020) {
                maxAFinanciar = precio * 0.7;
            } else if (year <= 2019 && year >= 2015) {
                maxAFinanciar = precio * 0.7;
            } else if (year <= 2014 && year >= 2002) {
                maxAFinanciar = precio * 0.5;
            }
        }
        setMaxAFinanciar(maxAFinanciar);
    };

    const handleYearChange = (e) => {
        setYear(e.target.value);
        fetchMarcas(e.target.value);
    };

    const handleMarcaChange = (e) => {
        setMarca(e.target.value);
        fetchModelos(e.target.value, year);
    };

    const handleModeloChange = (e) => {
        setModelo(e.target.value);
        fetchPriceCar(e.target.value, year);
    };

    const handleProductChange = (e) => {
        setSelectedProduct(e.target.value);
        calculateMaxAFinanciar(precio, year);
    };

    const handleCapitalChange = (e) => {
        setCapital(e.target.value);
    };

    const handleCotizacion = () => {
        if (!capital || capital <= 0) {
            alert('Por favor, ingrese un capital válido.');
            return;
        }
        if (capital > maxAFinanciar) {
            alert(`El capital ingresado excede el máximo a financiar: $${maxAFinanciar.toLocaleString('es-AR')}`);
            return;
        }
        // Lógica para calcular la cotización basada en el capital y el producto seleccionado
        const cuotasCalculadas = calcularCuotas(capital, selectedProduct);
        setCuotas(cuotasCalculadas);
    };

    const calcularCuotas = (capital, producto) => {
        // Lógica para calcular las cuotas basadas en el capital y el producto seleccionado
        const cuotas = [];
        const plazos = producto === 'a' ? [12, 18, 24, 36, 48, 60] : [12, 24, 36, 48, 60];
        const tasas = producto === 'a' ? [50.9, 50.9, 45.9, 43.9, 43.9, 43.9] : [70, 55.9, 53.9, 53.9, 53.9];
        const fees = producto === 'a' ? [0.09, 0.09, 0.09, 0.09, 0.09, 0.09] : [0.1, 0.1, 0.1, 0.1, 0.1];

        for (let i = 0; i < plazos.length; i++) {
            const cuotaMensual = calcularCuota(capital, tasas[i], plazos[i], fees[i]);
            cuotas.push(`Cuota ${plazos[i]} meses: $${cuotaMensual.toFixed(2)}`);
        }
        return cuotas;
    };

    const calcularCuota = (montoPrincipal, tasaInteresAnual, plazo, fee) => {
        const interesMensual = (tasaInteresAnual / 100) / 12;
        const comision = montoPrincipal * fee * 1.21;
        const saldo = montoPrincipal + comision;
        const factor = Math.pow(1 + interesMensual, plazo);
        const cuotaMensual = saldo * interesMensual * factor / (factor - 1);
        return cuotaMensual;
    };

    return (
        <div className="content">
            <h1>Cotizador</h1>
            <form className="cotizador-form">
                <div className="form-row">
                    <div className="form-group">
                        <label>Año:</label>
                        <select value={year} onChange={handleYearChange}>
                            <option value="" disabled>Seleccione un año</option>
                            <option value="2025">2025</option>
                            <option value="2024">2024</option>
                            <option value="2023">2023</option>
                            <option value="2022">2022</option>
                            <option value="2021">2021</option>
                            <option value="2020">2020</option>
                            <option value="2019">2019</option>
                            <option value="2018">2018</option>
                            <option value="2017">2017</option>
                            <option value="2016">2016</option>
                            <option value="2015">2015</option>
                            <option value="2014">2014</option>
                            <option value="2013">2013</option>
                            <option value="2012">2012</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Marca:</label>
                        <select value={marca} onChange={handleMarcaChange}>
                            <option value="" disabled>Seleccione una marca</option>
                            {marcas.map((marca) => (
                                <option key={marca.id} value={marca.id}>{marca.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Modelo:</label>
                        <select value={modelo} onChange={handleModeloChange}>
                            <option value="" disabled>Seleccione un modelo</option>
                            {modelos.map((modelo) => (
                                <option key={modelo.codia} value={modelo.codia}>{modelo.modelo}</option>
                            ))}
                        </select>
                        {precio && <p className="info-text">* Valor de info: ${precio.toLocaleString('es-AR')}</p>}
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Producto:</label>
                        <select value={selectedProduct} onChange={handleProductChange}>
                            <option value="a">Producto A</option>
                            <option value="b">Producto B</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Capital a Financiar:</label>
                        <input type="number" value={capital} onChange={handleCapitalChange} />
                        {maxAFinanciar && <p className="info-text">* Máximo a financiar: ${maxAFinanciar.toLocaleString('es-AR')}</p>}
                    </div>
                </div>
                <button type="button" onClick={handleCotizacion}>Obtener Cotización</button>
                <div>
                    <label>Cuotas:</label>
                    <ul>
                        {cuotas.map((cuota, index) => (
                            <li key={index}>{cuota}</li>
                        ))}
                    </ul>
                </div>
            </form>
        </div>
    );
}

export default Cotizador;
