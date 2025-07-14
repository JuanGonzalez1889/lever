import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Cotizador.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Select from 'react-select';
import CuadroCredito from './CuadroCredito';

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
    // Nuevos estados para la sección CLIENTE
    const [clienteNombre, setClienteNombre] = useState('');
    const [clienteDni, setClienteDni] = useState('');
    const [agencia, setAgencia] = useState('');
    const [clienteSexo, setClienteSexo] = useState('');
    // Nuevo estado para BANCO
    const [banco, setBanco] = useState('');
    // Nuevo estado para tipo de crédito y persona
    const [tipoCredito, setTipoCredito] = useState('');
    const [tipoPersona, setTipoPersona] = useState('');
    // Estado para mostrar/ocultar el cuadro de opciones
    const [mostrarOpciones, setMostrarOpciones] = useState(false);
    // Nuevo estado para búsqueda de agencia
    const [agenciaBusqueda, setAgenciaBusqueda] = useState('');
    // Estado para cobro de sellado
    const [cobroSellado, setCobroSellado] = useState('');
    // Opciones para el select de cobro de sellado
    const cobroSelladoOptions = [
        { value: '', label: 'Seleccione una opción', isDisabled: true },
        { value: 'abona', label: 'Abona sellado' },
        { value: 'exento', label: 'Exento' }
    ];
    // Lista de agencias para react-select
    const agenciasLista = [
        { value: "Agencia 1", label: "Agencia 1" },
        { value: "Agencia 2", label: "Agencia 2" },
        { value: "Agencia 3", label: "Agencia 3" },
        { value: "Agencia 4", label: "Agencia 4" },
        // ...agrega todas tus agencias aquí...
    ];

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
        setMostrarOpciones(true); // Mostrar el cuadro de opciones al cotizar
    };

    const calcularCuotas = (capital, producto) => {
        // Lógica para calcular las cuotas basadas en el capital y el producto seleccionado
        const cuotas = [];
        const plazos = producto === 'a' ? [12, 18, 24, 36, 48, 60] : [12, 24, 36, 48, 60];
        const tasas = producto === 'a' ? [50.9, 50.9, 45.9, 43.9, 43.9, 43.9] : [70, 55.9, 53.9, 53.9, 53.9];
        const fees = producto === 'a' ? [0.09, 0.09, 0.09, 0.09, 0.09, 0.09] : [0.1, 0.1, 0.1, 0.1, 0.1];

        for (let i = 0; i < plazos.length; i++) {
            const cuotaMensual = calcularCuota(capital, tasas[i], plazos[i], fees[i]);
            console.log(`Plazo: ${plazos[i]} meses, Tasa: ${tasas[i]}, Fee: ${fees[i]}, Cuota Mensual: ${cuotaMensual}`);
            cuotas.push(`Cuota ${plazos[i]} meses: $${cuotaMensual.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        }
        return cuotas;
    };

    const calcularCuota = (montoPrincipal, tasaInteresAnual, plazo, fee) => {
        const interesMensual = parseFloat(((tasaInteresAnual / 100) / 12).toFixed(7)); // Redondear a 7 decimales
        const comision = parseFloat((montoPrincipal * fee * 1.21).toFixed(2)); // Redondear a 2 decimales
        const saldo = parseFloat((parseFloat(montoPrincipal) + comision).toFixed(2)); // Asegurarse de que montoPrincipal sea un número y redondear a 2 decimales
        console.log(`Monto Principal: ${montoPrincipal}, Tasa Interes Anual: ${tasaInteresAnual}, Plazo: ${plazo}, Fee: ${fee}, Interes Mensual: ${interesMensual}, Comision: ${comision}, Saldo: ${saldo}`);
        const factor = parseFloat(Math.pow(1 + interesMensual, plazo).toFixed(6)); // Redondear a 6 decimales
        console.log(`Interes Mensual: ${interesMensual}, Plazo: ${plazo}, Factor Calculado: ${factor}`);
        const cuotaMensual = parseFloat((saldo * interesMensual * factor / (factor - 1)).toFixed(2)); // Redondear a 2 decimales
        console.log(`Factor: ${factor}, Cuota Mensual: ${cuotaMensual}`);
        return cuotaMensual;
    };

    // Nueva función para calcular las opciones del cuadro
    function calcularCreditoPrendario({
      capitalNeto,
      comision = 0.07775,
      tna = 0.539,
      plazoMeses = 24,
      iva = 0.21,
      ltv = 0.5545,
      tipoPersona = 'HUMANA',
      abonaSellado = true,
      exento = false
    }) {
      const capitalConGasto = capitalNeto / (1 - comision);
      const selladoHumano = abonaSellado ? (capitalConGasto * plazoMeses * 0.005) : 0;
      const selladoJuridico = exento ? 0 : capitalNeto * 0.005;
      const sellado = tipoPersona === 'JURIDICA' ? selladoJuridico : selladoHumano;
      const capitalBruto = capitalConGasto + sellado;
      const gastoConIVA = capitalConGasto * comision;
      const tasaMensual = tna / 12;
      const cuotaPura = capitalBruto * (
        (tasaMensual * Math.pow(1 + tasaMensual, plazoMeses)) /
        (Math.pow(1 + tasaMensual, plazoMeses) - 1)
      );
      const interesPrimerMes = capitalBruto * tasaMensual;
      const ivaSobreInteres = interesPrimerMes * iva;
      const cuotaConIVA = cuotaPura + ivaSobreInteres;
      const montoPrenda = capitalNeto / ltv;

      return {
        capitalConGasto: capitalConGasto.toFixed(2),
        sellado: sellado.toFixed(2),
        capitalBruto: capitalBruto.toFixed(2),
        gastoConIVA: gastoConIVA.toFixed(2),
        cuotaPura: cuotaPura.toFixed(2),
        interesPrimerMes: interesPrimerMes.toFixed(2),
        ivaSobreInteres: ivaSobreInteres.toFixed(2),
        cuotaConIVA: cuotaConIVA.toFixed(2),
        montoPrenda: montoPrenda.toFixed(2)
      };
    }

    // Opciones del cuadro (A, B, C) usando la función actualizada
    const opciones = [
        {
            nombre: "OPCIÓN A",
            plazo: 24,
            tna: 53.90,
            ...calcularCreditoPrendario({
                capitalNeto: capital ? Number(capital) : 0,
                plazoMeses: 24,
                tna: 53.9 / 100,
                tipoPersona: tipoPersona === 'juridica' ? 'JURIDICA' : 'HUMANA',
                abonaSellado: cobroSellado === 'abona',
                exento: cobroSellado === 'exento'
            }),
            comisionPorc: 7.775,
            comisionMonto: capital ? (Number(capital) / (1 - 0.07775)) * 0.07775 : 0,
            minimo: 242000.00
        },
        {
            nombre: "OPCIÓN B",
            plazo: 36,
            tna: 53.90,
            ...calcularCreditoPrendario({
                capitalNeto: capital ? Number(capital) : 0,
                plazoMeses: 36,
                tna: 53.9 / 100,
                tipoPersona: tipoPersona === 'juridica' ? 'JURIDICA' : 'HUMANA',
                abonaSellado: cobroSellado === 'abona',
                exento: cobroSellado === 'exento'
            }),
            comisionPorc: 7.775,
            comisionMonto: capital ? (Number(capital) / (1 - 0.07775)) * 0.07775 : 0,
            minimo: 242000.00
        },
        {
            nombre: "OPCIÓN C",
            plazo: 48,
            tna: 53.90,
            ...calcularCreditoPrendario({
                capitalNeto: capital ? Number(capital) : 0,
                plazoMeses: 48,
                tna: 53.9 / 100,
                tipoPersona: tipoPersona === 'juridica' ? 'JURIDICA' : 'HUMANA',
                abonaSellado: cobroSellado === 'abona',
                exento: cobroSellado === 'exento'
            }),
            comisionPorc: 7.775,
            comisionMonto: capital ? (Number(capital) / (1 - 0.07775)) * 0.07775 : 0,
            minimo: 242000.00
        }
    ];

    // Opciones para selects
    const sexoOptions = [
        { value: '', label: 'Seleccione sexo', isDisabled: true },
        { value: 'masculino', label: 'Masculino' },
        { value: 'femenino', label: 'Femenino' }
    ];
    const bancoOptions = [
        { value: '', label: 'Seleccione un banco', isDisabled: true },
        { value: 'ICBC', label: 'ICBC' },
        { value: 'GALICIA', label: 'GALICIA' },
        { value: 'SANTANDER', label: 'SANTANDER' },
        { value: 'COLUMBIA', label: 'COLUMBIA' },
        { value: 'SUPERVIELLE', label: 'SUPERVIELLE' }
    ];
    const productoOptions = [
        { value: 'a', label: 'Producto A' },
        { value: 'b', label: 'Producto B' }
    ];
    const tipoCreditoOptions = [
        { value: '', label: 'Seleccione tipo de crédito', isDisabled: true },
        { value: 'pesos', label: 'En Pesos' },
        { value: 'uva', label: 'UVA' }
    ];
    const tipoPersonaOptions = [
        { value: '', label: 'Seleccione tipo de persona', isDisabled: true },
        { value: 'fisica', label: 'Persona física' },
        { value: 'juridica', label: 'Persona jurídica' }
    ];
    const yearOptions = [
        { value: '', label: 'Seleccione un año', isDisabled: true },
        { value: '2025', label: '2025' },
        { value: '2024', label: '2024' },
        { value: '2023', label: '2023' },
        { value: '2022', label: '2022' },
        { value: '2021', label: '2021' },
        { value: '2020', label: '2020' },
        { value: '2019', label: '2019' },
        { value: '2018', label: '2018' },
        { value: '2017', label: '2017' },
        { value: '2016', label: '2016' },
        { value: '2015', label: '2015' },
        { value: '2014', label: '2014' },
        { value: '2013', label: '2013' },
        { value: '2012', label: '2012' }
    ];

    // Estilos personalizados para react-select
    const customSelectStyles = {
        control: (provided) => ({
            ...provided,
            borderRadius: 30,
            minHeight: 59,
            height: 59,
            fontFamily: 'Montserrat, sans-serif',
            fontSize: '1rem'
        }),
        valueContainer: (provided) => ({
            ...provided,
            height: 59,
            padding: '0 1rem'
        }),
        input: (provided) => ({
            ...provided,
            margin: 0,
            padding: 0
        }),
        indicatorsContainer: (provided) => ({
            ...provided,
            height: 59
        }),
        option: (provided, state) => ({
            ...provided,
            fontFamily: 'Montserrat, sans-serif',
            fontSize: '1rem'
        })
    };

    // Elimina los objetos LTVS e INTERESES_NETOS HARDCODEADOS y usa los datos del backend

// Nuevo estado para LTVs y tasas por banco/año
const [ltvsPorBanco, setLtvsPorBanco] = useState({});
const [tasasPorBanco, setTasasPorBanco] = useState({});

// Al cargar el componente, trae los datos del backend (tablero interno)
useEffect(() => {
    async function fetchTableroInterno() {
        try {
            const productosRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/interno/productos`);
            const ltvRes = await axios.get(`${process.env.REACT_APP_API_URL}/api/interno/ltv`);

            // Armar estructura: { BANCO: { año: ltv } }
            const ltvObj = {};
            ltvRes.data.forEach(row => {
                const banco = (row.producto || '').toUpperCase();
                if (!ltvObj[banco]) ltvObj[banco] = {};
                ltvObj[banco][String(row.year)] = Number(row.value);
            });
            setLtvsPorBanco(ltvObj);

            // Armar estructura: { BANCO: { plazo: { interest, fee, minfee } } }
            const tasasObj = {};
            productosRes.data.forEach(row => {
                const banco = (row.nombre || '').toUpperCase();
                if (!tasasObj[banco]) tasasObj[banco] = {};
                tasasObj[banco][String(row.plazo)] = {
                    interest: Number(row.interes),
                    fee: Number(row.fee),
                    minfee: Number(row.minfee)
                };
            });
            setTasasPorBanco(tasasObj);
        } catch (err) {
            console.error('Error trayendo datos de tablero interno:', err);
        }
    }
    fetchTableroInterno();
}, []);

// Función para obtener el LTV según banco y año desde la base
function getLtvPorBancoYAnio(banco, anio) {
    if (!banco || !anio) return 0;
    const ltvBanco = ltvsPorBanco[(banco || '').toUpperCase()];
    if (!ltvBanco) return 0;
    return ltvBanco[String(anio)] || 0;
}

// Función para obtener la tasa de interés (interest) según banco y plazo desde la base
function getTasaPorBancoYPlazo(banco, plazo) {
    if (!banco || !plazo) return 0;
    const tasasBanco = tasasPorBanco[(banco || '').toUpperCase()];
    if (!tasasBanco) return 0;
    return tasasBanco[String(plazo)]?.interest || 0;
}

// Función para obtener el fee según banco y plazo desde la base
function getFeePorBancoYPlazo(banco, plazo) {
    if (!banco || !plazo) return 0;
    const tasasBanco = tasasPorBanco[(banco || '').toUpperCase()];
    if (!tasasBanco) return 0;
    return tasasBanco[String(plazo)]?.fee || 0;
}

// Calcula el máximo neto por banco usando la fórmula de Excel y los datos del backend
function calcularMaxNetoBanco({ banco, precio, year }) {
    const anio = String(year);
    const ltv = getLtvPorBancoYAnio(banco, anio);
    if (!precio || !ltv) return 0;

    // El máximo permitido por banco (precio * ltv)
    const base = precio * ltv;

    // El máximo neto es simplemente el base (precio * ltv), sin descontar interés
    // Esto es lo que corresponde si tu Excel no descuenta el interés neto en el cálculo de "máximo neto"
    return base;
}

// Reemplaza maximosNetos por el cálculo dinámico con datos del backend:
const bancosLista = ["ICBC", "GALICIA", "SANTANDER", "COLUMBIA", "SUPERVIELLE"];
const maximosNetos = bancosLista.map((banco, idx) => ({
    banco,
    maxNeto: calcularMaxNetoBanco({ banco, precio, year }),
    prioridad: idx + 1
}));

    return (
        <div className="container mt-4">
            <h1 className="mb-4">Cotizador</h1>
            {/* Sección 1: CLIENTE */}
            <div className="card mb-3">
                <div className="card-header bg-primary text-white">CLIENTE</div>
                <div className="card-body">
                    <div className="row mb-3">
                        <div className="col-md-3">
                            <label className="form-label">Apellido y Nombre del cliente</label>
                            <input
                                type="text"
                                className="form-control"
                                value={clienteNombre}
                                onChange={e => setClienteNombre(e.target.value)}
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">DNI del cliente</label>
                            <input
                                type="text"
                                className="form-control"
                                value={clienteDni}
                                onChange={e => setClienteDni(e.target.value)}
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">Sexo</label>
                            <Select
                                classNamePrefix="react-select"
                                styles={customSelectStyles}
                                options={sexoOptions}
                                value={sexoOptions.find(opt => opt.value === clienteSexo) || sexoOptions[0]}
                                onChange={option => setClienteSexo(option ? option.value : '')}
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">Agencia</label>
                            <Select
                                classNamePrefix="react-select"
                                styles={customSelectStyles}
                                options={agenciasLista}
                                value={agenciasLista.find(a => a.value === agencia) || null}
                                onChange={option => setAgencia(option ? option.value : '')}
                                placeholder="Seleccione o busque una agencia..."
                                isClearable
                            />
                        </div>
                    </div>
                </div>
            </div>
            {/* Sección 2: VEHÍCULO */}
            <div className="card mb-3">
                <div className="card-header bg-primary text-white">VEHÍCULO</div>
                <div className="card-body">
                    <div className="row mb-3">
                        <div className="col-md-4">
                            <label className="form-label">Año</label>
                            <Select
                                classNamePrefix="react-select"
                                styles={customSelectStyles}
                                options={yearOptions}
                                value={yearOptions.find(opt => opt.value === year) || yearOptions[0]}
                                onChange={option => {
                                    setYear(option ? option.value : '');
                                    fetchMarcas(option ? option.value : '');
                                }}
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Marca</label>
                            <Select
                                classNamePrefix="react-select"
                                styles={customSelectStyles}
                                options={[
                                    { value: '', label: 'Seleccione una marca', isDisabled: true },
                                    ...marcas.map(marca => ({ value: marca.id, label: marca.name }))
                                ]}
                                value={
                                    marcas.length
                                        ? [{ value: '', label: 'Seleccione una marca', isDisabled: true }, ...marcas.map(marca => ({ value: marca.id, label: marca.name }))].find(opt => opt.value === marca)
                                        : { value: '', label: 'Seleccione una marca', isDisabled: true }
                                }
                                onChange={option => {
                                    setMarca(option ? option.value : '');
                                    fetchModelos(option ? option.value : '', year);
                                }}
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Modelo</label>
                            <Select
                                classNamePrefix="react-select"
                                styles={customSelectStyles}
                                options={[
                                    { value: '', label: 'Seleccione un modelo', isDisabled: true },
                                    ...modelos.map(modelo => ({ value: modelo.codia, label: modelo.modelo }))
                                ]}
                                value={
                                    modelos.length
                                        ? [{ value: '', label: 'Seleccione un modelo', isDisabled: true }, ...modelos.map(modelo => ({ value: modelo.codia, label: modelo.modelo }))].find(opt => opt.value === modelo)
                                        : { value: '', label: 'Seleccione un modelo', isDisabled: true }
                                }
                                onChange={option => {
                                    setModelo(option ? option.value : '');
                                    fetchPriceCar(option ? option.value : '', year);
                                }}
                            />
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-4">
                            <label className="form-label">Valor del vehículo en Infoauto</label>
                            <input
                                type="text"
                                className="form-control"
                                value={precio ? `$${precio.toLocaleString('es-AR')}` : ''}
                                readOnly
                            />
                        </div>
                    </div>
                </div>
            </div>
            {/* Sección 3: PRODUCTO */}
            <div className="card mb-3">
                <div className="card-header bg-primary text-white">PRODUCTO</div>
                <div className="card-body">
                    <div className="row mb-3">
                        <div className="col-md-4">
                            <label className="form-label">Seleccioná BANCO</label>
                            <Select
                                classNamePrefix="react-select"
                                styles={customSelectStyles}
                                options={bancoOptions}
                                value={bancoOptions.find(opt => opt.value === banco) || bancoOptions[0]}
                                onChange={option => {
                                    setBanco(option ? option.value : '');
                                    setMostrarOpciones(false);
                                }}
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Producto</label>
                            <Select
                                classNamePrefix="react-select"
                                styles={customSelectStyles}
                                options={productoOptions}
                                value={productoOptions.find(opt => opt.value === selectedProduct) || productoOptions[0]}
                                onChange={option => {
                                    setSelectedProduct(option ? option.value : '');
                                    calculateMaxAFinanciar(precio, year);
                                    setMostrarOpciones(false);
                                }}
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Capital solicitado NETO</label>
                            <input
                                type="number"
                                className="form-control"
                                value={capital}
                                onChange={e => {
                                    handleCapitalChange(e);
                                    setMostrarOpciones(false);
                                }}
                                style={{ borderRadius: 30, height: 59 }}
                            />
                            {maxAFinanciar && (
                                <div className="form-text text-danger">
                                    Valor MÁXIMO PERMITIDO: ${maxAFinanciar.toLocaleString('es-AR')}
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Nueva fila para los selects adicionales */}
                    <div className="row mb-3">
                        <div className="col-md-4">
                            <label className="form-label">Tipo de crédito</label>
                            <Select
                                classNamePrefix="react-select"
                                styles={customSelectStyles}
                                options={tipoCreditoOptions}
                                value={tipoCreditoOptions.find(opt => opt.value === tipoCredito) || tipoCreditoOptions[0]}
                                onChange={option => {
                                    setTipoCredito(option ? option.value : '');
                                    setMostrarOpciones(false);
                                }}
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Persona</label>
                            <Select
                                classNamePrefix="react-select"
                                styles={customSelectStyles}
                                options={tipoPersonaOptions}
                                value={tipoPersonaOptions.find(opt => opt.value === tipoPersona) || tipoPersonaOptions[0]}
                                onChange={option => {
                                    setTipoPersona(option ? option.value : '');
                                    setMostrarOpciones(false);
                                }}
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">Cobro de SELLADO</label>
                            <Select
                                classNamePrefix="react-select"
                                styles={customSelectStyles}
                                options={cobroSelladoOptions}
                                value={cobroSelladoOptions.find(opt => opt.value === cobroSellado) || cobroSelladoOptions[0]}
                                onChange={option => {
                                    setCobroSellado(option ? option.value : '');
                                    setMostrarOpciones(false);
                                }}
                            />
                        </div>
                        
                    </div>
                </div>
            </div>
            {/* Botón Cotizar */}
            <div className="d-flex justify-content-center mb-4">
                <button type="button" className="btn btn-success btn-lg" onClick={handleCotizacion}>
                    Cotizar
                </button>
            </div>

            {/* Mostrar cuadro de máximos netos por banco SOLO si mostrarOpciones */}
            {mostrarOpciones && (
              <div className="row mb-4 justify-content-center">
                <div className="col-12 col-lg-8 mb-3">
                  {/* Cuadro de las 3 opciones (CuadroCredito) */}
                  <CuadroCredito
                    capitalNeto={capital ? Number(capital) : 0}
                    tna={0.539}
                    comisionPorc={7.00}
                    tipoPersona={tipoPersona}
                    abonaSellado={cobroSellado === 'abona'}
                    exento={cobroSellado === 'exento'}
                  />
                </div>
                <div className="col-12 col-lg-4 mb-3 d-flex align-items-stretch">
                  {/* Cuadro de máximos netos por banco, más angosto y al lado derecho */}
                  <div
                    className="card w-100"
                    style={{
                      minWidth: 250,
                      maxWidth: 350,
                      marginLeft: "auto",
                      height: "fit-content", // Ajusta la altura al contenido
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                    }}
                  >
                    <div className="card-header bg-dark text-white text-center py-2">
                      <b>MÁXIMO NETO</b>
                    </div>
                    <div className="card-body p-0">
                      <table className="table table-bordered mb-0 text-center align-middle" style={{ marginBottom: 0 }}>
                        <thead>
                          <tr>
                            <th>BANCO</th>
                            <th style={{ background: "#00ff00" }}>MÁXIMO NETO</th>
                            <th>PRIORIDAD</th>
                          </tr>
                        </thead>
                        <tbody>
                          {maximosNetos.map((row, idx) => (
                            <tr key={idx}>
                              <td>{row.banco}</td>
                              <td style={{ background: "#00ff00", color: "#000" }}>
                                ${row.maxNeto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="fw-bold">{row.prioridad}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
    );
}

export default Cotizador;
                            