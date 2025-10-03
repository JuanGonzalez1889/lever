import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Cotizador.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Select from "react-select";
import CuadroCredito from "./CuadroCredito";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

function Cotizador() {
  const [year, setYear] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [precio, setPrecio] = useState(null);
  const [minAFinanciar, setMinAFinanciar] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState("a");
  const [capital, setCapital] = useState("");
  const [cuotas, setCuotas] = useState([]);
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteApellido, setClienteApellido] = useState("");
  const [clienteDni, setClienteDni] = useState("");
  const [agencia, setAgencia] = useState("");
  const [clienteSexo, setClienteSexo] = useState("");
  const [tipoPersona, setTipoPersona] = useState("");
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const [agenciaBusqueda, setAgenciaBusqueda] = useState("");
  const [cobroSellado, setCobroSellado] = useState("");
  const [bancos, setBancos] = useState([]);
  const [bancoSeleccionado, setBancoSeleccionado] = useState("");
  const [sexo, setSexo] = useState("");
  const [productos, setProductos] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState("");
  const [tnaBanco, setTnaBanco] = useState("");
  const [comisionBanco, setComisionBanco] = useState("");
  const [configBancos, setConfigBancos] = useState({});
  const [agenciasDb, setAgenciasDb] = useState([]);
  const [configBancosPlazos, setConfigBancosPlazos] = useState([]);
  const [plazoSeleccionado, setPlazoSeleccionado] = useState("");
  const [columnasSeleccionadas, setColumnasSeleccionadas] = useState([
    12, 18, 24, 36, 48,
  ]);
  const [mostrarFilasAvanzadas, setMostrarFilasAvanzadas] = useState(false);
  const [tipoCredito, setTipoCredito] = useState("");
  const [configLtv, setConfigLtv] = useState([]);
  const [nombreArchivoPDF, setNombreArchivoPDF] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/config-ltv`).then((res) => {
      if (res.data.success) setConfigLtv(res.data.ltvs);
    });
  }, []);

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/api/productos_bancos`)
      .then((res) => {
        if (res.data.success) setProductos(res.data.productos);
      });
  }, []);

  function calcularMaxAFinanciarPorLTV(
    precio,
    productoSeleccionado,
    year,
    configLtv
  ) {
    if (!precio || !productoSeleccionado || !year || !configLtv) return 0;
    const ltvObj = configLtv.find(
      (l) =>
        String(l.producto_banco_id) === String(productoSeleccionado) &&
        String(l.anio) === String(year)
    );
    const ltv = ltvObj ? Number(ltvObj.ltv) : 0;
    return ltv ? precio * ltv : 0;
  }

  function isPlazoDisponible(plazo) {
    return configBancosPlazos.some(
      (c) =>
        String(c.producto_banco_id) === String(productoSeleccionado) &&
        Number(c.plazo) === plazo
    );
  }
  const handleDescargarPDF = async () => {
    const params = new URLSearchParams(location.search);
    const cotizacionOriginalId = params.get("id"); // <-- AGREGA ESTA LÍNEA

    const productoObj = productos.find(
      (p) => String(p.id) === String(productoSeleccionado)
    );
    const marcaObj = marcas.find((m) => String(m.id) === String(marca));
    const modeloObj = modelos.find((m) => String(m.codia) === String(modelo));

    const cotizacion = {
      fecha: new Date().toISOString().slice(0, 19).replace("T", " "),
      cliente_dni: clienteDni,
      cliente_nombre: clienteNombre,
      cliente_apellido: clienteApellido,
      agencia: agencia,
      producto: productoObj ? productoObj.nombre : productoSeleccionado,
      monto: capital,
      usuario: "usuario_logueado",
      vehiculo_marca: marcaObj ? marcaObj.name : marca, // <-- nombre de la marca
      vehiculo_modelo: modeloObj ? modeloObj.modelo : modelo, // <-- nombre del modelo
      vehiculo_anio: year,
      vehiculo_precio: precio,
      persona: tipoPersona,
      sellado: cobroSellado,
      observaciones: "",
      ...(cotizacionOriginalId && {
        cotizacion_original_id: cotizacionOriginalId,
      }),
    };

    if (
      !clienteNombre.trim() ||
      !clienteApellido.trim() ||
      !clienteDni.trim() ||
      !agencia.trim() ||
      !clienteSexo.trim() ||
      !tipoPersona.trim() ||
      !cobroSellado.trim() ||
      !bancoSeleccionado ||
      !productoSeleccionado ||
      !capital.trim()
    ) {
      alert(
        "Por favor, complete todos los campos obligatorios antes de descargar el PDF."
      );
      return;
    }

    try {
      cotizacion.usuario = sessionStorage.getItem("usuario");
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/cotizaciones`,
        cotizacion
      );
      if (res.data.success) {
        handleGenerarPDF();
      } else {
        alert("Error al guardar la cotización");
      }
    } catch (err) {
      alert("Error al guardar la cotización");
      console.error(err);
    }
  };
  const cobroSelladoOptions = [
    { value: "", label: "Seleccione una opción", isDisabled: true },
    { value: "abona", label: "Abona sellado" },
    { value: "exento", label: "Exento" },
  ];
  const agenciasLista = agenciasDb.map((a) => ({
    value: a.agencia,
    label: a.agencia,
    sellado: a.sellado,
  }));

  useEffect(() => {
    const fetchMinAFinanciar = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/files/calculadora.txt"
        );
        const data = response.data;
        setMinAFinanciar(data.minAFinanciar.valor);
      } catch (error) {
        console.error("Error fetching minAFinanciar:", error);
      }
    };
    fetchMinAFinanciar();
  }, []);

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/api/config-bancos`, {
        withCredentials: true,
      })
      .then((res) => {
        if (res.data && res.data.success) {
          setConfigBancos(res.data.config || {});
        }
      });
  }, []);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/bancos`).then((res) => {
      if (res.data.success) setBancos(res.data.bancos);
    });
  }, []);

  useEffect(() => {
    setProductoSeleccionado("");
    setCapital("");
  }, [bancoSeleccionado]);

  useEffect(() => {
    if (bancoSeleccionado && configBancos[bancoSeleccionado]) {
      setTnaBanco(configBancos[bancoSeleccionado].tna);
      setComisionBanco(configBancos[bancoSeleccionado].comision);
    } else {
      const bancoObj = bancos.find(
        (b) => String(b.id) === String(productoSeleccionado)
      );
      setTnaBanco(bancoObj && bancoObj.tna ? bancoObj.tna : "");
      setComisionBanco(bancoObj && bancoObj.comision ? bancoObj.comision : "");
    }
  }, [bancoSeleccionado, configBancos, bancos]);

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/api/agencias`, {
        withCredentials: true,
      })
      .then((res) => {
        if (res.data.success) setAgenciasDb(res.data.agencias);
      });
  }, []);

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/api/config-bancos-plazos`, {
        withCredentials: true,
      })
      .then((res) => {
        if (res.data.success) setConfigBancosPlazos(res.data.config);
      });
  }, []);

  useEffect(() => {
    if (productoSeleccionado) {
      const prod = productos.find(
        (p) => String(p.id) === String(productoSeleccionado)
      );
      setTipoCredito(prod?.tipo_credito ? prod.tipo_credito.toUpperCase() : "");
    } else {
      setTipoCredito("");
    }
  }, [productoSeleccionado, productos]);

  const tnaYComision = configBancosPlazos.find(
    (c) =>
      String(c.producto_banco_id) === String(productoSeleccionado) &&
      String(c.plazo) === String(plazoSeleccionado)
  );
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cotizacionId = params.get("id");
    if (cotizacionId) {
      axios
        .get(
          `${process.env.REACT_APP_API_URL}/api/cotizaciones/${cotizacionId}`
        )
        .then((res) => {
          if (res.data.success) {
            const cot = res.data.cotizacion;
            setClienteNombre(cot.cliente_nombre || "");
            setClienteApellido(cot.cliente_apellido || "");
            setClienteDni(cot.cliente_dni || "");
            setAgencia(cot.agencia || "");
            setProductoSeleccionado(cot.producto || "");
            setCapital(cot.monto || "");
            setMarca(cot.vehiculo_marca || "");
            setModelo(cot.vehiculo_modelo || "");
            setYear(cot.vehiculo_anio || "");
            setPrecio(cot.vehiculo_precio || "");
            setTipoPersona(cot.persona || "");
            setCobroSellado(cot.sellado || "");
            setClienteSexo(cot.sexo || "");
            setBancoSeleccionado(cot.banco || "");
            setProductoSeleccionado(cot.producto || "");
            setCapital(cot.monto || "");
          }
        })
        .catch((err) => {
          console.error("Error al cargar cotización:", err);
        });
    }
  }, [location.search]);

  function calcularPromedioCuotaConIVA({
    capitalBruto,
    plazoMeses,
    tna,
    tipoPersona = "HUMANA",
  }) {
    const iva =
      tipoPersona === "juridica" || tipoPersona === "JURIDICA" ? 0.105 : 0.21;
    const tasaMensual = tna / 12;
    const cuotaPura =
      (tasaMensual / (1 - Math.pow(1 + tasaMensual, -plazoMeses))) *
      capitalBruto;

    let saldo = capitalBruto;
    let sumaCuotasConIVA = 0;

    for (let i = 0; i < plazoMeses; i++) {
      const interes = saldo * tasaMensual;
      const ivaInteres = interes * iva;
      const cuotaConIVA = cuotaPura + ivaInteres;
      sumaCuotasConIVA += cuotaConIVA;
      const amortizacion = cuotaPura - interes;
      saldo -= amortizacion;
    }

    return sumaCuotasConIVA / plazoMeses;
  }

  const tna = tnaYComision ? tnaYComision.tna : "";
  const comision = tnaYComision ? tnaYComision.comision : "";
  const PHP_API_URL =
    window.location.hostname === "localhost"
      ? "http://localhost/lever/php/curl.php"
      : "https://lever.com.ar/php/curl.php";

  const fetchMarcas = async (year) => {
    try {
      const response = await axios.post(PHP_API_URL, {
        year,
        action: "getBrandsByYear",
      });
      setMarcas(response.data.brands);
    } catch (error) {
      console.error("Error fetching marcas:", error);
    }
  };

  const fetchModelos = async (idMarca, year) => {
    try {
      const response = await axios.post(PHP_API_URL, {
        idMarca,
        year,
        action: "getModelsByBrand",
      });
      setModelos(response.data.models);
    } catch (error) {
      console.error("Error fetching modelos:", error);
    }
  };

  const fetchPriceCar = async (codia, year) => {
    try {
      const response = await axios.post(PHP_API_URL, {
        codia,
        year,
        action: "getPriceByCodia",
      });
      setPrecio(response.data.price);
    } catch (error) {
      console.error("Error fetching price:", error);
    }
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
      alert("Por favor, ingrese un capital válido.");
      return;
    }
    if (capital > maxAFinanciar) {
      alert(
        `El capital ingresado excede el máximo a financiar: $${maxAFinanciar.toLocaleString(
          "es-AR"
        )}`
      );
      return;
    }
    const cuotasCalculadas = calcularCuotas(capital, selectedProduct);
    setCuotas(cuotasCalculadas);
    setMostrarOpciones(true);
  };

  const calcularCuotas = (capital, producto) => {
    const cuotas = [];
    const plazos =
      producto === "a" ? [12, 18, 24, 36, 48, 60] : [12, 24, 36, 48, 60];
    const tasas =
      producto === "a"
        ? [50.9, 50.9, 45.9, 43.9, 43.9, 43.9]
        : [70, 55.9, 53.9, 53.9, 53.9];
    const fees =
      producto === "a"
        ? [0.09, 0.09, 0.09, 0.09, 0.09, 0.09]
        : [0.1, 0.1, 0.1, 0.1, 0.1];

    for (let i = 0; i < plazos.length; i++) {
      const cuotaMensual = calcularCuota(capital, tasas[i], plazos[i], fees[i]);
      cuotas.push(
        `Cuota ${plazos[i]} meses: $${cuotaMensual.toLocaleString("es-AR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      );
    }
    return cuotas;
  };

  const calcularCuota = (montoPrincipal, tasaInteresAnual, plazo, fee) => {
    const interesMensual = parseFloat((tasaInteresAnual / 100 / 12).toFixed(7));
    const comision = parseFloat((montoPrincipal * fee * 1.21).toFixed(2));
    const saldo = parseFloat(
      (parseFloat(montoPrincipal) + comision).toFixed(2)
    );
    const factor = parseFloat(Math.pow(1 + interesMensual, plazo).toFixed(6));
    const cuotaMensual = parseFloat(
      ((saldo * interesMensual * factor) / (factor - 1)).toFixed(2)
    );
    return cuotaMensual;
  };

  function calcularCreditoPrendario({
    capitalNeto,
    comision = 0.07,
    tna = 0.539,
    plazoMeses = 24,
    tipoPersona = "HUMANA",
    abonaSellado = false,
    exento = false,
  }) {
    // IVA según tipo de persona
    const iva =
      tipoPersona === "juridica" || tipoPersona === "JURIDICA" ? 0.105 : 0.21;

    // IVA de comisión SIEMPRE 21%
    const ivaComision = 0.21;

    const capitalNetoRedondeado = Number(capitalNeto.toFixed(2));
    const minimoConIVA = 200000 * (1 + ivaComision);
    const comisionConIVA = capitalNetoRedondeado * comision * (1 + ivaComision);
    const gastoConIVA = Math.max(comisionConIVA, minimoConIVA);
    const gastoConIVARedondeado = Number(gastoConIVA.toFixed(2));
    const conGasto = capitalNetoRedondeado + gastoConIVARedondeado;
    const conGastoRedondeado = Number(conGasto.toFixed(2));

    const tasaMensual = tna / 12;

    const cuotaPuraTemp =
      (tasaMensual / (1 - Math.pow(1 + tasaMensual, -plazoMeses))) *
      conGastoRedondeado;

    let sellado = 0;
    if (exento) {
      sellado = 0;
    } else if (tipoPersona === "juridica" || tipoPersona === "JURIDICA") {
      sellado = abonaSellado ? conGastoRedondeado * 0.005 : 0;
    } else {
      sellado = abonaSellado ? cuotaPuraTemp * plazoMeses * 0.005 : 0;
    }
    const capitalBruto = exento
      ? conGastoRedondeado
      : conGastoRedondeado + sellado;

    const cuotaPura =
      (tasaMensual / (1 - Math.pow(1 + tasaMensual, -plazoMeses))) *
      capitalBruto;

    const interesPrimerMes = capitalBruto * tasaMensual;
    const ivaSobreInteres = interesPrimerMes * iva;

    const cuotaConIVA = cuotaPura + ivaSobreInteres;

    const montoPrenda = cuotaPura * plazoMeses;

    return {
      capitalConGasto: conGastoRedondeado.toFixed(2),
      sellado: sellado.toFixed(2),
      capitalBruto: capitalBruto.toFixed(2),
      gastoConIVA: gastoConIVARedondeado.toFixed(2),
      comisionConIVA: comisionConIVA.toFixed(2),
      cuotaPura: cuotaPura.toFixed(2),
      interesPrimerMes: interesPrimerMes.toFixed(2),
      ivaSobreInteres: ivaSobreInteres.toFixed(2),
      cuotaConIVA: cuotaConIVA.toFixed(2),
      montoPrenda: montoPrenda.toFixed(2),
    };
  }

  const sexoOptions = [
    { value: "", label: "Seleccione sexo", isDisabled: true },
    { value: "masculino", label: "Masculino" },
    { value: "femenino", label: "Femenino" },
  ];

  const productoOptions = [
    { value: "a", label: "Producto A" },
    { value: "b", label: "Producto B" },
  ];
  const tipoPersonaOptions = [
    { value: "", label: "Seleccione tipo de persona", isDisabled: true },
    { value: "fisica", label: "Persona física" },
    { value: "juridica", label: "Persona jurídica" },
  ];
  const yearOptions = [
    { value: "", label: "Seleccione un año", isDisabled: true },
    { value: "2025", label: "2025" },
    { value: "2024", label: "2024" },
    { value: "2023", label: "2023" },
    { value: "2022", label: "2022" },
    { value: "2021", label: "2021" },
    { value: "2020", label: "2020" },
    { value: "2019", label: "2019" },
    { value: "2018", label: "2018" },
    { value: "2017", label: "2017" },
    { value: "2016", label: "2016" },
    { value: "2015", label: "2015" },
    { value: "2014", label: "2014" },
    { value: "2013", label: "2013" },
    { value: "2012", label: "2012" },
    { value: "2011", label: "2011" },
    { value: "2010", label: "2010" },
    { value: "2009", label: "2009" },
  ];

  const [capitalPorPlazo, setCapitalPorPlazo] = useState({
    12: "",
    18: "",
    24: "",
    36: "",
    48: "",
  });

  const customSelectStyles = {
    control: (provided) => ({
      ...provided,
      borderRadius: 24,
      minHeight: 38, // antes 48
      height: 38, // antes 48
      fontSize: "0.95rem", // antes 1rem
      paddingLeft: 8,
      paddingRight: 8,
    }),
    valueContainer: (provided) => ({
      ...provided,
      height: 38,
      padding: "0 8px",
    }),
    input: (provided) => ({
      ...provided,
      margin: 0,
      padding: 0,
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      height: 38,
    }),
    option: (provided, state) => ({
      ...provided,
      fontSize: "0.95rem",
      whiteSpace: "nowrap",
      padding: "8px 12px",
    }),
    menuList: (provided) => ({
      ...provided,
      maxHeight: 180,
      overflowY: "auto",
    }),
    singleValue: (provided) => ({
      ...provided,
      whiteSpace: "normal",
      overflow: "visible",
      textOverflow: "unset",
      maxWidth: "100%",
      wordBreak: "break-word",
    }),
  };

  const [ltvsPorBanco, setLtvsPorBanco] = useState({});
  const [tasasPorBanco, setTasasPorBanco] = useState({});
  const productosConLtv = productos.filter((producto) =>
    configLtv.some(
      (l) =>
        String(l.producto_banco_id) === String(producto.id) &&
        String(l.anio) === String(year)
    )
  );
  useEffect(() => {
    async function fetchTableroInterno() {
      try {
        const productosRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/interno/productos`
        );
        const ltvRes = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/interno/ltv`
        );

        const ltvObj = {};
        ltvRes.data.forEach((row) => {
          const banco = (row.producto || "").toUpperCase();
          if (!ltvObj[banco]) ltvObj[banco] = {};
          ltvObj[banco][String(row.year)] = Number(row.value);
        });
        setLtvsPorBanco(ltvObj);

        const tasasObj = {};
        productosRes.data.forEach((row) => {
          const banco = (row.nombre || "").toUpperCase();
          if (!tasasObj[banco]) tasasObj[banco] = {};
          tasasObj[banco][String(row.plazo)] = {
            interest: Number(row.interes),
            fee: Number(row.fee),
            minfee: Number(row.minfee),
          };
        });
        setTasasPorBanco(tasasObj);
      } catch (err) {
        console.error("Error trayendo datos de tablero interno:", err);
      }
    }
    fetchTableroInterno();
  }, []);

  function getLtvPorBancoYAnio(banco, anio) {
    if (!banco || !anio) return 0;
    const ltvBanco = ltvsPorBanco[(banco || "").toUpperCase()];
    if (!ltvBanco) return 0;
    return ltvBanco[String(anio)] || 0;
  }

  function getTasaPorBancoYPlazo(banco, plazo) {
    if (!banco || !plazo) return 0;
    const tasasBanco = tasasPorBanco[(banco || "").toUpperCase()];
    if (!tasasBanco) return 0;
    return tasasBanco[String(plazo)]?.interest || 0;
  }

  function getFeePorBancoYPlazo(banco, plazo) {
    if (!banco || !plazo) return 0;
    const tasasBanco = tasasPorBanco[(banco || "").toUpperCase()];
    if (!tasasBanco) return 0;
    return tasasBanco[String(plazo)]?.fee || 0;
  }

  function calcularMaxNetoBanco({ banco, precio, year }) {
    const anio = String(year);
    const ltv = getLtvPorBancoYAnio(banco, anio);
    if (!precio || !ltv) return 0;
    const base = precio * ltv;
    return base;
  }

  const bancosLista = [
    "ICBC",
    "GALICIA",
    "SANTANDER",
    "COLUMBIA",
    "SUPERVIELLE",
  ];
  const maximosNetos = bancosLista.map((banco, idx) => ({
    banco,
    maxNeto: calcularMaxNetoBanco({ banco, precio, year }),
    prioridad: idx + 1,
  }));

  const thStyle = {
    background: "#232342",
    color: "#fff",
    borderColor: "#fff",
    textAlign: "left",
    fontWeight: "bold",
    fontSize: "1.05rem",
    borderLeft: "2px solid #fff",
    borderBottom: "2px solid #fff",
  };

  const tdStyle = {
    background: "#fff", // Fondo blanco para contraste
    color: "#232342", // Texto azul oscuro para contraste
    borderColor: "#fff",
    borderBottom: "2px solid #fff",
    borderRight: "2px solid #fff",
  };

  const handleGenerarPDF = () => {
    const doc = new jsPDF("l", "pt", "a4");

    // Obtener tipo de crédito del banco seleccionado
    const productoObj = productos.find(
      (p) => String(p.id) === String(productoSeleccionado)
    );
    const bancoObj = bancos.find(
      (b) => String(b.id) === String(productoObj?.banco_id)
    );
    const tipoCredito = productoObj ? productoObj.tipo_credito : "";
    const marcaObj = marcas.find((m) => String(m.id) === String(marca));
    const modeloObj = modelos.find((m) => String(m.codia) === String(modelo));

    // Texto principal según tipo de crédito
    const textoCredito =
      tipoCredito === "UVA"
        ? "TASA FIJA AJUSTABLE POR CER - UVA"
        : "TASA FIJA EN PESOS - SISTEMA FRANCÉS";

    // Encabezado dividido en dos mitades
    const pageWidth = doc.internal.pageSize.getWidth();
    const headerHeight = 60;
    const headerY = 40;

    const abreviacionesBancos = {
      ICBC: "IC",
      COLUMBIA: "CO",
      GALICIA: "GA",
      SANTANDER: "SA",
      SUPERVIELLE: "SP",
      SUPERVILLE: "SP",
    };

    const bancoAbrev =
      bancoObj && bancoObj.nombre
        ? abreviacionesBancos[bancoObj.nombre.trim().toUpperCase()] || ""
        : "";

    // 1. Dibuja el fondo blanco primero
    doc.setFillColor(255, 255, 255); // azul claro
    doc.setDrawColor(0, 0, 0); // borde negro
    doc.rect(40, headerY, pageWidth / 2 - 40, headerHeight, "DF"); // "DF" = fill & stroke

    // Mitad izquierda: abreviación del banco
    if (bancoAbrev) {
      doc.setFontSize(11);
      doc.setTextColor(35, 35, 66);
      doc.setFont("helvetica", "bold");
      doc.text(bancoAbrev, 50, headerY + 17); // Ajusta la posición vertical si lo necesitas
    }

    // Mitad izquierda: texto principal
    doc.setFontSize(15);
    doc.setTextColor(35, 35, 66);
    doc.setFont("helvetica", "bold");
    doc.text(textoCredito, 50, headerY + headerHeight / 2 + 7);

    // Mitad izquierda: texto
    doc.setFillColor(255, 255, 255); // azul claro
    doc.setDrawColor(0, 0, 0); // borde negro

    doc.setFontSize(15);
    doc.setTextColor(35, 35, 66);
    doc.setFont("helvetica", "bold");
    doc.text(textoCredito, 50, headerY + headerHeight / 2 + 7);

    // Mitad derecha: logo
    doc.setFillColor(35, 35, 66); // azul oscuro
    doc.setDrawColor(0, 0, 0); // borde negro
    doc.rect(pageWidth / 2, headerY, pageWidth / 2 - 40, headerHeight, "DF");
    doc.setFontSize(38);
    doc.setTextColor(0, 222, 159);
    doc.setFont("helvetica", "bold");
    doc.text(
      "LEVER",
      pageWidth / 2 + (pageWidth / 2 - 40) / 2,
      headerY + headerHeight / 2 + 12,
      { align: "center" }
    );

    // Si el banco es ICBC, agrega la leyenda debajo del texto principal
    if (
      bancoObj &&
      bancoObj.nombre &&
      bancoObj.nombre.trim().toUpperCase() === "ICBC"
    ) {
      doc.setFontSize(12);
      doc.setTextColor(255, 0, 0); // Rojo para destacar
      doc.setFont("helvetica", "bold");
      doc.text(
        "SIMULACIÓN - REQUIERE APROBACIÓN",
        50,
        headerY + headerHeight / 2 + 25 // 18px debajo del texto principal
      );
      doc.setTextColor(35, 35, 66); // Vuelve al color original
      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
    }

    // Datos principales
    const datosPrincipales = [
      ["FECHA DE COTIZACIÓN", new Date().toLocaleDateString()],
      ["AGENCIA", agencia],
      ["NOMBRE Y APELLIDO", `${clienteNombre} ${clienteApellido}`],
      ["DNI/CUIT", clienteDni],
      [
        "VEHÍCULO",
        `${marcaObj ? marcaObj.name : ""} ${modeloObj ? modeloObj.modelo : ""}`,
      ],
      ["AÑO DE VEHÍCULO", year],
      [
        "PERSONA",
        tipoPersona === "juridica" ? "Persona Jurídica" : "Persona Física",
      ],
      ["SELLADO DE PRENDA", cobroSellado === "abona" ? "INCLUIDO" : "EXENTO"],
    ];

    // Opciones de crédito
    const columnasPlazos = columnasSeleccionadas
      .filter(isPlazoDisponible)
      .sort((a, b) => a - b);
    const filas = [
      [
        "CAPITAL NETO A PAGAR",
        ...columnasPlazos.map((p) =>
          capitalPorPlazo[p]
            ? `$${Math.round(Number(capitalPorPlazo[p])).toLocaleString(
                "es-AR",
                { maximumFractionDigits: 0 }
              )}`
            : "-"
        ),
      ],

      [
        "CAPITAL SOLICITADO CON GASTOS",
        ...columnasPlazos.map((p) => {
          const found = configBancosPlazos.find(
            (c) =>
              String(c.producto_banco_id) === String(productoSeleccionado) &&
              Number(c.plazo) === p
          );
          const tna = found ? Number(found.tna) / 100 : 0;
          const comision = found ? Number(found.comision) / 100 : 0;
          const datos = calcularCreditoPrendario({
            capitalNeto: Number(capitalPorPlazo[p]),
            comision: comision,
            tna: tna,
            plazoMeses: p,
            tipoPersona: tipoPersona === "juridica" ? "JURIDICA" : "HUMANA",
            abonaSellado: cobroSellado === "abona",
            exento: cobroSellado === "exento",
          });
          return datos.capitalBruto && !isNaN(datos.capitalBruto)
            ? `$${Math.round(Number(datos.capitalBruto)).toLocaleString(
                "es-AR",
                { maximumFractionDigits: 0 }
              )}`
            : "-";
        }),
      ],
      [
        "SELLADO PROVINCIAL",
        ...columnasPlazos.map((p) => {
          const found = configBancosPlazos.find(
            (c) =>
              String(c.producto_banco_id) === String(productoSeleccionado) &&
              Number(c.plazo) === p
          );
          const tna = found ? Number(found.tna) / 100 : 0;
          const comision = found ? Number(found.comision) / 100 : 0;
          const datos = calcularCreditoPrendario({
            capitalNeto: Number(capitalPorPlazo[p]),
            comision: comision,
            tna: tna,
            plazoMeses: p,
            tipoPersona: tipoPersona === "juridica" ? "JURIDICA" : "HUMANA",
            abonaSellado: cobroSellado === "abona",
            exento: cobroSellado === "exento",
          });
          return datos.sellado && !isNaN(datos.sellado)
            ? `$${Math.round(Number(datos.sellado)).toLocaleString("es-AR", {
                maximumFractionDigits: 0,
              })}`
            : "-";
        }),
      ],
      ["PLAZO", ...columnasPlazos.map((p) => (p ? p : "-"))],

      [
        "CUOTA INICIAL APROXIMADA SIN SEGURO",
        ...columnasPlazos.map((p) => {
          const found = configBancosPlazos.find(
            (c) =>
              String(c.producto_banco_id) === String(productoSeleccionado) &&
              Number(c.plazo) === p
          );
          const tna = found ? Number(found.tna) / 100 : 0;
          const comision = found ? Number(found.comision) / 100 : 0;
          const datos = calcularCreditoPrendario({
            capitalNeto: Number(capitalPorPlazo[p]),
            comision: comision,
            tna: tna,
            plazoMeses: p,
            tipoPersona: tipoPersona === "juridica" ? "JURIDICA" : "HUMANA",
            abonaSellado: cobroSellado === "abona",
            exento: cobroSellado === "exento",
          });
          return datos.cuotaConIVA && !isNaN(datos.cuotaConIVA)
            ? `$${Math.round(Number(datos.cuotaConIVA)).toLocaleString(
                "es-AR",
                { maximumFractionDigits: 0 }
              )}`
            : "-";
        }),
      ],
      [
        "CUOTA PROMEDIO SIN SEGURO",
        ...columnasPlazos.map((p) => {
          const found = configBancosPlazos.find(
            (c) =>
              String(c.producto_banco_id) === String(productoSeleccionado) &&
              Number(c.plazo) === p
          );
          const tna = found ? Number(found.tna) / 100 : 0;
          const comision = found ? Number(found.comision) / 100 : 0;
          const datos = calcularCreditoPrendario({
            capitalNeto: Number(capitalPorPlazo[p]),
            comision: comision,
            tna: tna,
            plazoMeses: p,
            tipoPersona: tipoPersona === "juridica" ? "JURIDICA" : "HUMANA",
            abonaSellado: cobroSellado === "abona",
            exento: cobroSellado === "exento",
          });
          const promedioCuotaConIVA = calcularPromedioCuotaConIVA({
            capitalBruto: Number(datos.capitalBruto),
            plazoMeses: p,
            tna: tna,
            tipoPersona: tipoPersona,
          });
          return promedioCuotaConIVA && !isNaN(promedioCuotaConIVA)
            ? `$${Math.round(Number(promedioCuotaConIVA)).toLocaleString(
                "es-AR",
                { maximumFractionDigits: 0 }
              )}`
            : "-";
        }),
      ],
      [
        "TNA",
        ...columnasPlazos.map((p) => {
          const found = configBancosPlazos.find(
            (c) =>
              String(c.producto_banco_id) === String(productoSeleccionado) &&
              Number(c.plazo) === p
          );
          return found && found.tna !== undefined && found.tna !== null
            ? `${Number(found.tna).toLocaleString("es-AR", {
                minimumFractionDigits: 2,
              })}%`
            : "-";
        }),
      ],
      // [
      //   "MONTO DE LA PRENDA",
      //   ...columnasPlazos.map((p) => {
      //     const found = configBancosPlazos.find(
      //       (c) =>
      //         String(c.producto_banco_id) === String(productoSeleccionado) &&
      //         Number(c.plazo) === p
      //     );
      //     const tna = found ? Number(found.tna) / 100 : 0;
      //     const comision = found ? Number(found.comision) / 100 : 0;
      //     const datos = calcularCreditoPrendario({
      //       capitalNeto: Number(capitalPorPlazo[p]),
      //       comision: comision,
      //       tna: tna,
      //       plazoMeses: p,
      //       tipoPersona: tipoPersona === "juridica" ? "JURIDICA" : "HUMANA",
      //       abonaSellado: cobroSellado === "abona",
      //       exento: cobroSellado === "exento",
      //     });
      //     return datos.montoPrenda && !isNaN(datos.montoPrenda)
      //       ? `$${Math.round(Number(datos.montoPrenda)).toLocaleString(
      //           "es-AR",
      //           { maximumFractionDigits: 0 }
      //         )}`
      //       : "-";
      //   }),
      // ],
      // [
      //   "% COMISIÓN OTORGAMIENTO",
      //   ...columnasPlazos.map((p) => {
      //     const found = configBancosPlazos.find(
      //       (c) =>
      //         String(c.producto_banco_id) === String(productoSeleccionado) &&
      //         Number(c.plazo) === p
      //     );
      //     return found &&
      //       found.comision !== undefined &&
      //       found.comision !== null
      //       ? `${Number(found.comision).toLocaleString("es-AR", {
      //           minimumFractionDigits: 2,
      //         })}%`
      //       : "-";
      //   }),
      // ],
    ];

    // Tabla de datos principales
    autoTable(doc, {
      startY: 110, // antes era 120
      head: [["", ""]],
      body: datosPrincipales,
      theme: "grid",
      styles: {
        fontSize: 9, // antes era 11
        cellPadding: 3, // antes era 4
        halign: "center",
        valign: "middle",
      },
      headStyles: {
        fillColor: [35, 35, 66],
        textColor: [0, 222, 159],
        fontSize: 11, // antes era 13
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: [35, 35, 66],
      },
      columnStyles: {
        0: {
          halign: "left",
          fontStyle: "bold",
          cellWidth: (pageWidth - 80) / 2,
        },
        1: { halign: "center", cellWidth: (pageWidth - 80) / 2 },
      },
      margin: { left: 40, right: 40 },
    });

    // Tabla de opciones de crédito
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 2,
      body: filas,
      theme: "grid",
      styles: {
        fontSize: 11,
        cellPadding: 4,
        halign: "center",
        valign: "middle",
      },
      headStyles: {
        fillColor: [35, 35, 66],
        textColor: [0, 222, 159],
        fontSize: 13,
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: [35, 35, 66],
      },
      columnStyles: {
        0: { halign: "left", fontStyle: "bold" },
      },
      margin: { left: 40, right: 40 },

      didParseCell: function (data) {
        const darkColor = [35, 35, 66];
        const greenColor = [0, 222, 159];
        // CAPITAL NETO A PAGAR (primera fila)
        if (data.section === "body" && data.row.index === 0) {
          data.cell.styles.fillColor = darkColor;
          data.cell.styles.textColor = greenColor;
          data.cell.styles.fontStyle = "bold";
        }

        // PLANO (fila cuyo primer valor es "PLAZO")
        if (data.section === "body" && data.row.cells[0].raw === "PLAZO") {
          data.cell.styles.fillColor = darkColor;
          data.cell.styles.textColor = greenColor;
          data.cell.styles.fontStyle = "bold";
        }

        // TNA (última fila)
        if (
          data.section === "body" &&
          data.row.index === data.table.body.length - 1
        ) {
          data.cell.styles.fillColor = darkColor;
          data.cell.styles.textColor = greenColor;
          data.cell.styles.fontStyle = "bold";
        }
        // CUOTA PROMEDIO (IVA INCLUIDO) SIN SEGURO queda sin color especial (fondo blanco, letras negras)
      },
    });

    const notaY = doc.lastAutoTable.finalY + 10;
    const fondoHeight = 40;
    const colWidth = (pageWidth - 80) / 2;

    // Fondo blanco para condiciones
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(0, 0, 0); // borde negro
    doc.rect(40, notaY, colWidth, fondoHeight, "DF"); // "DF" = fill & stroke

    // Fondo azul para SISTEMA FRANCÉS y web
    doc.setFillColor(35, 35, 66);
    doc.setDrawColor(0, 0, 0); // borde negro
    doc.rect(40 + colWidth, notaY, colWidth, fondoHeight, "DF");

    // Texto de condiciones (izquierda, dos líneas)
    doc.setFontSize(12);
    doc.setTextColor(35, 35, 66);
    doc.setFont("helvetica", "bold");
    doc.text(
      "Las condiciones de aprobación corresponden a esta fecha,",
      50,
      notaY + 18,
      { maxWidth: colWidth - 20 }
    );
    doc.text(
      "pueden sufrir modificaciones luego de la misma.",
      50,
      notaY + 32,
      {
        maxWidth: colWidth - 20,
      }
    );

    // Texto SISTEMA FRANCÉS y web (derecha)
    doc.setFontSize(12);
    doc.setTextColor(0, 222, 159);
    doc.setFont("helvetica", "bold");
    doc.text("SISTEMA FRANCÉS", 40 + colWidth + 10, notaY + 18, {
      align: "left",
    });

    doc.setFontSize(10);
    doc.setTextColor(0, 222, 159);
    doc.setFont("helvetica", "normal");
    doc.text("www.lever.com.ar", 40 + colWidth + 10, notaY + 32, {
      align: "left",
    });
    // Texto especial ICBC debajo de las condiciones y SISTEMA FRANCÉS
    if (
      bancoObj &&
      bancoObj.nombre &&
      bancoObj.nombre.trim().toUpperCase() === "ICBC"
    ) {
      const textoICBC =
        "SEGURO LIBERADO - ENDOSAR A FAVOR DE BANCO ICBC\n" +
        "Opciones: La Caja, Federación Patronal, San Cristobal, Mapfre, Provincia Seguros, La Meridional, Zurich, Berkley, Allianz, La Segunda";

      // Calcula la posición debajo del bloque de condiciones
      const extraY = notaY + fondoHeight + 10;
      const extraHeight = 40;

      doc.setFillColor(35, 35, 66); // fondo azul oscuro
      doc.rect(40, extraY, pageWidth - 80, extraHeight, "F");

      doc.setFontSize(11);
      doc.setTextColor(0, 222, 159); // verde
      doc.setFont("helvetica", "bold");
      doc.text(textoICBC, pageWidth / 2, extraY + 18, {
        align: "center",
        maxWidth: pageWidth - 100,
      });
    }

    // Texto UVA con fondo azul oscuro (solo si corresponde)
    if (tipoCredito && tipoCredito.trim().toUpperCase() === "UVA") {
      const textoUVA =
        "EL CAPITAL OTORGADO EN $ SE CONVERTIRÁ A SU EQUIVALENTE EN UVAs A LA FECHA DE LIQUIDACIÓN Y QUEDARÁ DEFINIDO\n" +
        "CANTIDAD DE UVAs A PAGAR POR CUOTA: CADA CUOTA RESULTARÁ DE MULTIPLICAR LOS UVAs CORRESPONDIENTES\n" +
        "POR EL VALOR DE COTIZACIÓN AL VENCIMIENTO DE CADA UNA";

      const fondoUvaY = notaY + fondoHeight;
      const fondoUvaHeight = 60;
      doc.setFillColor(35, 35, 66);
      doc.rect(40, fondoUvaY, pageWidth - 80, fondoUvaHeight, "F");

      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text(textoUVA, pageWidth / 2, fondoUvaY + 25, {
        align: "center",
        maxWidth: pageWidth - 100,
      });
    }

    const nombreArchivo =
      nombreArchivoPDF.trim() !== ""
        ? nombreArchivoPDF.trim().replace(/\s+/g, "_") + ".pdf"
        : `Cotizacion_${clienteNombre}_${clienteApellido}.pdf`;
    doc.save(nombreArchivo);
  };

  const maxAFinanciar = calcularMaxAFinanciarPorLTV(
    precio,
    productoSeleccionado,
    year,
    configLtv
  );

  return (
    <div className="container mt-4">
      <div className="card mb-3">
        <div className="card-header bg-primary text-white">CLIENTE</div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-3">
              <label className="form-label">Nombre del cliente</label>
              <input
                type="text"
                className="form-control"
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value.toUpperCase())}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Apellido del cliente</label>
              <input
                type="text"
                className="form-control"
                value={clienteApellido}
                onChange={(e) =>
                  setClienteApellido(e.target.value.toUpperCase())
                }
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">DNI del cliente</label>
              <input
                type="text"
                className="form-control"
                value={clienteDni}
                onChange={(e) => setClienteDni(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Sexo</label>
              <Select
                classNamePrefix="react-select"
                styles={customSelectStyles}
                options={sexoOptions}
                value={
                  sexoOptions.find((opt) => opt.value === clienteSexo) ||
                  sexoOptions[0]
                }
                onChange={(option) =>
                  setClienteSexo(option ? option.value : "")
                }
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Agencia</label>
              <Select
                id="select-agencia"
                classNamePrefix="react-select"
                styles={customSelectStyles}
                options={agenciasLista}
                value={agenciasLista.find((a) => a.value === agencia) || null}
                onChange={(option) => {
                  setAgencia(option ? option.value : "");
                  if (option) {
                    if (option.sellado === "SI") setCobroSellado("abona");
                    else if (option.sellado === "NO") setCobroSellado("exento");
                    else setCobroSellado("");
                  } else {
                    setCobroSellado("");
                  }
                }}
                placeholder="Seleccione agencia"
                isClearable
              />
            </div>
          </div>
        </div>
      </div>
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
                value={
                  yearOptions.find((opt) => opt.value === year) ||
                  yearOptions[0]
                }
                onChange={(option) => {
                  setYear(option ? option.value : "");
                  fetchMarcas(option ? option.value : "");
                }}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Marca</label>
              <Select
                classNamePrefix="react-select"
                styles={customSelectStyles}
                options={[
                  {
                    value: "",
                    label: "Seleccione una marca",
                    isDisabled: true,
                  },
                  ...marcas.map((marca) => ({
                    value: marca.id,
                    label: marca.name,
                  })),
                ]}
                value={
                  marcas.length
                    ? [
                        {
                          value: "",
                          label: "Seleccione una marca",
                          isDisabled: true,
                        },
                        ...marcas.map((marca) => ({
                          value: marca.id,
                          label: marca.name,
                        })),
                      ].find((opt) => opt.value === marca)
                    : {
                        value: "",
                        label: "Seleccione una marca",
                        isDisabled: true,
                      }
                }
                onChange={(option) => {
                  setMarca(option ? option.value : "");
                  fetchModelos(option ? option.value : "", year);
                }}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Modelo</label>
              <Select
                classNamePrefix="react-select"
                styles={customSelectStyles}
                options={[
                  {
                    value: "",
                    label: "Seleccione un modelo",
                    isDisabled: true,
                  },
                  ...modelos.map((modelo) => ({
                    value: modelo.codia,
                    label: modelo.modelo,
                  })),
                ]}
                value={
                  modelos.length
                    ? [
                        {
                          value: "",
                          label: "Seleccione un modelo",
                          isDisabled: true,
                        },
                        ...modelos.map((modelo) => ({
                          value: modelo.codia,
                          label: modelo.modelo,
                        })),
                      ].find((opt) => opt.value === modelo)
                    : {
                        value: "",
                        label: "Seleccione un modelo",
                        isDisabled: true,
                      }
                }
                onChange={(option) => {
                  setModelo(option ? option.value : "");
                  fetchPriceCar(option ? option.value : "", year);
                }}
              />
            </div>
          </div>
          <div className="row">
            <div className="col-md-4">
              <label className="form-label">
                Valor del vehículo en Infoauto
              </label>
              <input
                id="precio-vehiculo"
                type="text"
                className="form-control"
                value={precio ? `$${precio.toLocaleString("es-AR")}` : ""}
                readOnly
              />
            </div>
          </div>
        </div>
      </div>
      {precio && year && productos.length > 0 && (
        <div
          className="card mb-3"
          style={{ margin: "0 auto", background: "#232342" }}
        >
          <div className="card-header text-center">
            <b>MÁXIMO NETO</b>
          </div>
          <div className="card-body p-2" style={{ borderRadius: 16 }}>
            <table
              className="table table-borderless text-center align-middle table-maximos-netos"
              style={{ marginBottom: 0, fontSize: "0.98rem" }}
            >
              <thead>
                <tr>
                  {productosConLtv.map((producto) => {
                    const bancoObj = bancos.find(
                      (b) => String(b.id) === String(producto.banco_id)
                    );
                    return (
                      <th
                        key={producto.id}
                        style={{
                          background: "none",
                          color: "#232342",
                          fontWeight: 600,
                          padding: "4px 0",
                        }}
                      >
                        <div>{producto.nombre}</div>
                        <div style={{ color: "#888", fontSize: "0.9em" }}>
                          {bancoObj ? bancoObj.nombre : ""}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {productosConLtv.map((producto) => {
                    const maxNeto = calcularMaxAFinanciarPorLTV(
                      precio,
                      producto.id,
                      year,
                      configLtv
                    );
                    return (
                      <td
                        key={producto.id}
                        style={{
                          background: "none",
                          color: "#22d99e",
                          fontWeight: 700,
                          padding: "4px 0",
                        }}
                      >
                        $
                        {Math.round(maxNeto).toLocaleString("es-AR", {
                          maximumFractionDigits: 0,
                        })}
                        <br />
                        <span style={{ color: "#888", fontSize: "0.9em" }}>
                          TNA:{" "}
                          {(() => {
                            const found = configBancosPlazos.find(
                              (c) =>
                                String(c.producto_banco_id) ===
                                String(producto.id)
                            );
                            return found && found.tna
                              ? `${Number(found.tna).toLocaleString("es-AR", {
                                  minimumFractionDigits: 2,
                                })}%`
                              : "-";
                          })()}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="card mb-3">
        <div className="card-header bg-primary text-white">PRODUCTO</div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-4" id="select-banco">
              <label className="form-label">Seleccioná BANCO</label>
              <Select
                classNamePrefix="react-select"
                styles={customSelectStyles}
                options={[
                  { value: "", label: "Seleccione un banco", isDisabled: true },
                  ...bancos.map((b) => ({
                    value: b.id,
                    label: b.nombre.toUpperCase(),
                    tipoCredito: b.tipo_credito,
                  })),
                ]}
                value={
                  bancos.length
                    ? [
                        {
                          value: "",
                          label: "Seleccione un banco",
                          isDisabled: true,
                        },
                        ...bancos.map((b) => ({
                          value: b.id,
                          label: b.nombre.toUpperCase(),
                          tipoCredito: b.tipo_credito,
                        })),
                      ].find(
                        (opt) => String(opt.value) === String(bancoSeleccionado)
                      )
                    : {
                        value: "",
                        label: "Seleccione un banco",
                        isDisabled: true,
                      }
                }
                onChange={(option) => {
                  setBancoSeleccionado(option ? option.value : "");
                  setMostrarOpciones(false);
                }}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Seleccioná PRODUCTO</label>
              <Select
                classNamePrefix="react-select"
                styles={customSelectStyles}
                options={[
                  {
                    value: "",
                    label: "Seleccione un producto",
                    isDisabled: true,
                  },
                  ...productos
                    .filter(
                      (p) => String(p.banco_id) === String(bancoSeleccionado)
                    )
                    .map((p) => ({
                      value: p.id,
                      label: p.nombre,
                      tipoCredito: p.tipo_credito,
                    })),
                ]}
                value={
                  productos.length
                    ? [
                        {
                          value: "",
                          label: "Seleccione un producto",
                          isDisabled: true,
                        },
                        ...productos
                          .filter(
                            (p) =>
                              String(p.banco_id) === String(bancoSeleccionado)
                          )
                          .map((p) => ({
                            value: p.id,
                            label: p.nombre,
                            tipoCredito: p.tipo_credito,
                          })),
                      ].find(
                        (opt) =>
                          String(opt.value) === String(productoSeleccionado)
                      )
                    : {
                        value: "",
                        label: "Seleccione un producto",
                        isDisabled: true,
                      }
                }
                onChange={(option) => {
                  setProductoSeleccionado(option ? option.value : "");
                }}
                isDisabled={!bancoSeleccionado}
                placeholder="Seleccione un producto"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Capital solicitado NETO</label>
              <input
                type="text"
                className="form-control"
                value={
                  capital !== "" ? Number(capital).toLocaleString("es-AR") : ""
                }
                onChange={(e) => {
                  const raw = e.target.value
                    .replace(/\./g, "")
                    .replace(/[^0-9]/g, "");
                  setCapital(raw);
                  setCapitalPorPlazo((prev) => {
                    const todosIguales = Object.values(prev).every(
                      (v) => v === "" || v === prev[12]
                    );
                    if (todosIguales) {
                      return {
                        12: raw,
                        18: raw,
                        24: raw,
                        36: raw,
                        48: raw,
                      };
                    }
                    const nuevo = { ...prev };
                    [12, 18, 24, 36, 48].forEach((p) => {
                      if (!prev[p]) nuevo[p] = raw;
                    });
                    return nuevo;
                  });
                }}
                style={{ borderRadius: 30, height: 59 }}
              />
              {maxAFinanciar > 0 && (
                <div className="form-text text-danger">
                  Valor MÁXIMO PERMITIDO: $
                  {Math.round(maxAFinanciar).toLocaleString("es-AR")}
                </div>
              )}
            </div>
          </div>
          <div className="row mb-3">
            <div className="col-md-4">
              <label className="form-label">Tipo de crédito</label>
              <input
                type="text"
                className="form-control"
                value={tipoCredito}
                readOnly
                style={{ minHeight: 59, textTransform: "uppercase" }}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Persona</label>
              <Select
                classNamePrefix="react-select"
                styles={customSelectStyles}
                options={tipoPersonaOptions}
                value={
                  tipoPersonaOptions.find((opt) => opt.value === tipoPersona) ||
                  tipoPersonaOptions[0]
                }
                onChange={(option) => {
                  setTipoPersona(option ? option.value : "");
                  setMostrarOpciones(false);
                }}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Cobro de SELLADO</label>
              <input
                type="text"
                className="form-control"
                value={
                  cobroSellado === "abona"
                    ? "Abona sellado"
                    : cobroSellado === "exento"
                    ? "Exento"
                    : ""
                }
                readOnly
                style={{
                  borderRadius: 30,
                  height: 59,
                  background: "#f8f9fa",
                  marginTop: 0,
                  border: "1px solid #ccc",
                }}
              />
            </div>
            <div className="d-flex justify-content-center mb-4">
              <button
                type="button"
                className="btn btn-success btn-lg"
                onClick={handleCotizacion}
              >
                Cotizar
              </button>
            </div>
          </div>
        </div>
      </div>

      {mostrarOpciones && (
        <div
          className="card w-100 mb-4"
          style={{ background: "#232342", border: "none" }}
        >
          <div
            className="card-header text-white text-center"
            style={{
              background: "#1a1a2e",
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
              border: "none",
              fontWeight: "bold",
              fontSize: "1.1rem",
            }}
          >
            Opciones de Crédito
          </div>
          <div className="card-body p-0">
            <button
              className="btn btn-link mb-2"
              style={{
                color: "#fff",
                fontWeight: "bold",
                width: "161px",
                height: "62px",
                fontSize: "15px",
              }}
              onClick={() => setMostrarFilasAvanzadas((prev) => !prev)}
            >
              {mostrarFilasAvanzadas
                ? "Ocultar filas avanzadas ▲"
                : "Mostrar filas avanzadas ▼"}
            </button>
            <table
              className="table table-bordered mb-0 text-center align-middle"
              style={{
                borderCollapse: "separate",
                borderSpacing: 0,
                borderColor: "#fff",
                background: "#232342",
                color: "#fff",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      background: "#1a1a2e",
                      color: "#fff",
                      borderColor: "#fff",
                      borderTopLeftRadius: 10,
                      borderBottom: "2px solid #fff",
                      fontWeight: "bold",
                      textAlign: "left",
                      minWidth: 160,
                      fontSize: "0.88rem",
                    }}
                  ></th>
                  {[
                    { label: "OPCIÓN A", plazo: 12 },
                    { label: "OPCIÓN B", plazo: 18 },
                    { label: "OPCIÓN C", plazo: 24 },
                    { label: "OPCIÓN D", plazo: 36 },
                    { label: "OPCIÓN E", plazo: 48 },
                  ].map((op, idx, arr) => (
                    <th
                      key={op.label}
                      style={{
                        background: "#1a1a2e",
                        color: "#fff",
                        borderColor: "#fff",
                        borderBottom: "2px solid #fff",
                        fontWeight: "bold",
                        borderTopRightRadius: idx === arr.length - 1 ? 10 : 0,
                        opacity: isPlazoDisponible(op.plazo) ? 1 : 0.5,
                      }}
                    >
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          color: "#fff",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={columnasSeleccionadas.includes(op.plazo)}
                          onChange={(e) => {
                            setColumnasSeleccionadas((prev) =>
                              e.target.checked
                                ? [...prev, op.plazo]
                                : prev.filter((p) => p !== op.plazo)
                            );
                          }}
                        />
                        {op.label}
                      </label>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* 1. CAPITAL SOLICITADO NETO */}
                <tr>
                  <th style={thStyle}>CAPITAL SOLICITADO NETO</th>
                  {[12, 18, 24, 36, 48].map((plazo) => (
                    <td
                      style={{
                        ...tdStyle,
                        background: isPlazoDisponible(plazo)
                          ? tdStyle.background
                          : "#e0e0e0",
                        color: isPlazoDisponible(plazo)
                          ? tdStyle.color
                          : "#a0a0a0",
                      }}
                      key={plazo}
                    >
                      {isPlazoDisponible(plazo) ? (
                        <input
                          type="text"
                          className="form-control"
                          style={{ minWidth: 90, textAlign: "right" }}
                          value={
                            capitalPorPlazo[plazo] !== ""
                              ? Number(capitalPorPlazo[plazo]).toLocaleString(
                                  "es-AR"
                                )
                              : ""
                          }
                          onChange={(e) => {
                            const raw = e.target.value
                              .replace(/\./g, "")
                              .replace(/[^0-9]/g, "");
                            setCapitalPorPlazo((prev) => ({
                              ...prev,
                              [plazo]: raw,
                            }));
                          }}
                        />
                      ) : (
                        "-"
                      )}
                    </td>
                  ))}
                </tr>
                {/* 2. Gasto con IVA */}
                <tr>
                  <th style={thStyle}>Gasto con IVA</th>
                  {[12, 18, 24, 36, 48].map((plazo) => {
                    const found = configBancosPlazos.find(
                      (c) =>
                        String(c.producto_banco_id) ===
                          String(productoSeleccionado) &&
                        Number(c.plazo) === plazo
                    );
                    const tna = found ? Number(found.tna) / 100 : 0;
                    const comision = found ? Number(found.comision) / 100 : 0;
                    const datos = calcularCreditoPrendario({
                      capitalNeto: Number(capitalPorPlazo[plazo]),
                      comision: comision,
                      tna: tna,
                      plazoMeses: plazo,
                      tipoPersona:
                        tipoPersona === "juridica" ? "JURIDICA" : "HUMANA",
                      abonaSellado: cobroSellado === "abona",
                      exento: cobroSellado === "exento",
                    });
                    return (
                      <td
                        style={{
                          ...tdStyle,
                          background: isPlazoDisponible(plazo)
                            ? tdStyle.background
                            : "#e0e0e0",
                          color: isPlazoDisponible(plazo)
                            ? tdStyle.color
                            : "#a0a0a0",
                        }}
                        key={plazo}
                      >
                        {isPlazoDisponible(plazo)
                          ? datos.gastoConIVA
                            ? `$${Number(datos.gastoConIVA).toLocaleString(
                                "es-AR",
                                { minimumFractionDigits: 2 }
                              )}`
                            : "-"
                          : "-"}
                      </td>
                    );
                  })}
                </tr>
                {/* 3. Con Gasto */}
                <tr>
                  <th style={thStyle}>Con Gasto</th>
                  {[12, 18, 24, 36, 48].map((plazo) => {
                    const found = configBancosPlazos.find(
                      (c) =>
                        String(c.producto_banco_id) ===
                          String(productoSeleccionado) &&
                        Number(c.plazo) === plazo
                    );
                    const tna = found ? Number(found.tna) / 100 : 0;
                    const comision = found ? Number(found.comision) / 100 : 0;
                    const datos = calcularCreditoPrendario({
                      capitalNeto: Number(capitalPorPlazo[plazo]),
                      comision: comision,
                      tna: tna,
                      plazoMeses: plazo,
                      tipoPersona:
                        tipoPersona === "juridica" ? "JURIDICA" : "HUMANA",
                      abonaSellado: cobroSellado === "abona",
                      exento: cobroSellado === "exento",
                    });
                    return (
                      <td
                        style={{
                          ...tdStyle,
                          background: isPlazoDisponible(plazo)
                            ? tdStyle.background
                            : "#e0e0e0",
                          color: isPlazoDisponible(plazo)
                            ? tdStyle.color
                            : "#a0a0a0",
                        }}
                        key={plazo}
                      >
                        {isPlazoDisponible(plazo)
                          ? datos.capitalConGasto
                            ? `$${Number(datos.capitalConGasto).toLocaleString(
                                "es-AR",
                                { minimumFractionDigits: 2 }
                              )}`
                            : "-"
                          : "-"}
                      </td>
                    );
                  })}
                </tr>

                {/* FILAS AVANZADAS OCULTABLES */}
                {mostrarFilasAvanzadas && (
                  <>
                    {/* 4. Cuota Pura */}
                    <tr>
                      <th style={thStyle}>Cuota Pura</th>
                      {[12, 18, 24, 36, 48].map((plazo) => {
                        const found = configBancosPlazos.find(
                          (c) =>
                            String(c.producto_banco_id) ===
                              String(productoSeleccionado) &&
                            Number(c.plazo) === plazo
                        );
                        const tna = found ? Number(found.tna) / 100 : 0;
                        const comision = found
                          ? Number(found.comision) / 100
                          : 0;
                        const datos = calcularCreditoPrendario({
                          capitalNeto: Number(capitalPorPlazo[plazo]),
                          comision: comision,
                          tna: tna,
                          plazoMeses: plazo,
                          tipoPersona:
                            tipoPersona === "juridica" ? "JURIDICA" : "HUMANA",
                          abonaSellado: cobroSellado === "abona",
                          exento: cobroSellado === "exento",
                        });
                        return (
                          <td
                            style={{
                              ...tdStyle,
                              background: isPlazoDisponible(plazo)
                                ? tdStyle.background
                                : "#e0e0e0",
                              color: isPlazoDisponible(plazo)
                                ? tdStyle.color
                                : "#a0a0a0",
                            }}
                            key={plazo}
                          >
                            {isPlazoDisponible(plazo)
                              ? datos.cuotaPura
                                ? `$${Number(datos.cuotaPura).toLocaleString(
                                    "es-AR",
                                    { minimumFractionDigits: 2 }
                                  )}`
                                : "-"
                              : "-"}
                          </td>
                        );
                      })}
                    </tr>
                    {/* 9. CUOTA PURA SIN IVA, SIN SEGURO */}
                    <tr>
                      <th
                        style={{
                          ...thStyle,
                          background: "#ffe5d0",
                          color: "#232342",
                        }}
                      >
                        CUOTA PURA SIN IVA, SIN SEGURO
                      </th>
                      {[12, 18, 24, 36, 48].map((plazo) => {
                        const found = configBancosPlazos.find(
                          (c) =>
                            String(c.producto_banco_id) ===
                              String(productoSeleccionado) &&
                            Number(c.plazo) === plazo
                        );
                        const tna = found ? Number(found.tna) / 100 : 0;
                        const comision = found
                          ? Number(found.comision) / 100
                          : 0;
                        const datos = calcularCreditoPrendario({
                          capitalNeto: Number(capitalPorPlazo[plazo]),
                          comision: comision,
                          tna: tna,
                          plazoMeses: plazo,
                          tipoPersona:
                            tipoPersona === "juridica" ? "JURIDICA" : "HUMANA",
                          abonaSellado: cobroSellado === "abona",
                          exento: cobroSellado === "exento",
                        });
                        return (
                          <td
                            style={{
                              ...tdStyle,
                              background: isPlazoDisponible(plazo)
                                ? "#ffe5d0"
                                : "#e0e0e0",
                              color: isPlazoDisponible(plazo)
                                ? "#232342"
                                : "#a0a0a0",
                            }}
                            key={plazo}
                          >
                            {isPlazoDisponible(plazo)
                              ? datos.cuotaPura
                                ? `$${Number(datos.cuotaPura).toLocaleString(
                                    "es-AR",
                                    { minimumFractionDigits: 2 }
                                  )}`
                                : "-"
                              : "-"}
                          </td>
                        );
                      })}
                    </tr>
                    {/* 15. MONTO DE COMISIÓN C/IVA */}
                    <tr>
                      <th
                        style={{
                          ...thStyle,
                          background: "#d0e3ff",
                          color: "#232342",
                        }}
                      >
                        MONTO DE COMISIÓN C/IVA
                      </th>
                      {[12, 18, 24, 36, 48].map((plazo) => {
                        const found = configBancosPlazos.find(
                          (c) =>
                            String(c.producto_banco_id) ===
                              String(productoSeleccionado) &&
                            Number(c.plazo) === plazo
                        );
                        const tna = found ? Number(found.tna) / 100 : 0;
                        const comision = found
                          ? Number(found.comision) / 100
                          : 0;
                        const datos = calcularCreditoPrendario({
                          capitalNeto: Number(capitalPorPlazo[plazo]),
                          comision: comision,
                          tna: tna,
                          plazoMeses: plazo,
                          tipoPersona:
                            tipoPersona === "juridica" ? "JURIDICA" : "HUMANA",
                          abonaSellado: cobroSellado === "abona",
                          exento: cobroSellado === "exento",
                        });

                        return (
                          <td
                            style={{
                              ...tdStyle,
                              background: isPlazoDisponible(plazo)
                                ? "#d0e3ff"
                                : "#e0e0e0",
                              color: isPlazoDisponible(plazo)
                                ? "#232342"
                                : "#a0a0a0",
                            }}
                            key={plazo}
                          >
                            {isPlazoDisponible(plazo)
                              ? datos.comisionConIVA
                                ? `$${Number(
                                    datos.comisionConIVA
                                  ).toLocaleString("es-AR", {
                                    minimumFractionDigits: 2,
                                  })}`
                                : "-"
                              : "-"}
                          </td>
                        );
                      })}
                    </tr>
                    {/* 17. MONTO A PERCIBIR */}
                    <tr>
                      <th
                        style={{
                          ...thStyle,
                          background: "#d0e3ff",
                          color: "#232342",
                        }}
                      >
                        MONTO A PERCIBIR
                      </th>
                      {[12, 18, 24, 36, 48].map((plazo) => (
                        <td
                          style={{
                            ...tdStyle,
                            background: isPlazoDisponible(plazo)
                              ? "#d0e3ff"
                              : "#e0e0e0",
                            color: isPlazoDisponible(plazo)
                              ? "#232342"
                              : "#a0a0a0",
                          }}
                          key={plazo}
                        >
                          {isPlazoDisponible(plazo)
                            ? capitalPorPlazo[plazo]
                              ? `$${Number(
                                  capitalPorPlazo[plazo]
                                ).toLocaleString("es-AR", {
                                  minimumFractionDigits: 2,
                                })}`
                              : "-"
                            : "-"}
                        </td>
                      ))}
                    </tr>
                  </>
                )}

                {/* 5. CAPITAL BRUTO */}
                <tr>
                  <th style={{ ...thStyle, background: "rgb(35, 35, 66)" }}>
                    CAPITAL BRUTO
                  </th>
                  {[12, 18, 24, 36, 48].map((plazo) => {
                    const found = configBancosPlazos.find(
                      (c) =>
                        String(c.producto_banco_id) ===
                          String(productoSeleccionado) &&
                        Number(c.plazo) === plazo
                    );
                    const tna = found ? Number(found.tna) / 100 : 0;
                    const comision = found ? Number(found.comision) / 100 : 0;
                    const datos = calcularCreditoPrendario({
                      capitalNeto: Number(capitalPorPlazo[plazo]),
                      comision: comision,
                      tna: tna,
                      plazoMeses: plazo,
                      tipoPersona:
                        tipoPersona === "juridica" ? "JURIDICA" : "HUMANA",
                      abonaSellado: cobroSellado === "abona",
                      exento: cobroSellado === "exento",
                    });
                    return (
                      <td
                        style={{
                          ...tdStyle,
                          background: isPlazoDisponible(plazo)
                            ? "rgb(255, 255, 255)"
                            : "rgb(35, 35, 66)",
                          color: isPlazoDisponible(plazo)
                            ? "rgb(35, 35, 66)"
                            : "#a0a0a0",
                        }}
                        key={plazo}
                      >
                        {isPlazoDisponible(plazo)
                          ? datos.capitalBruto
                            ? `$${Number(datos.capitalBruto).toLocaleString(
                                "es-AR",
                                { minimumFractionDigits: 2 }
                              )}`
                            : "-"
                          : "-"}
                      </td>
                    );
                  })}
                </tr>
                {/* 6. PLAZO */}
                <tr>
                  <th style={thStyle}>PLAZO</th>
                  {[12, 18, 24, 36, 48].map((plazo) => (
                    <td
                      style={{
                        ...tdStyle,
                        background: isPlazoDisponible(plazo)
                          ? "rgb(208, 227, 255)" // color solicitado
                          : "#e0e0e0",
                        fontWeight: "bold",
                        color: isPlazoDisponible(plazo)
                          ? tdStyle.color
                          : "#a0a0a0",
                      }}
                      key={plazo}
                    >
                      {isPlazoDisponible(plazo) ? plazo : "-"}
                    </td>
                  ))}
                </tr>
                {/* 7. TNA */}
                <tr>
                  <th style={thStyle}>TNA</th>
                  {[12, 18, 24, 36, 48].map((plazo) => {
                    const found = configBancosPlazos.find(
                      (c) =>
                        String(c.producto_banco_id) ===
                          String(productoSeleccionado) &&
                        Number(c.plazo) === plazo
                    );
                    return (
                      <td
                        style={{
                          ...tdStyle,
                          background: isPlazoDisponible(plazo)
                            ? "rgb(208, 227, 255)" // color solicitado
                            : "#e0e0e0",
                          color: isPlazoDisponible(plazo)
                            ? tdStyle.color
                            : "#a0a0a0",
                        }}
                        key={plazo}
                      >
                        {isPlazoDisponible(plazo) &&
                        found &&
                        found.tna !== undefined &&
                        found.tna !== null
                          ? `${Number(found.tna).toLocaleString("es-AR", {
                              minimumFractionDigits: 2,
                            })}%`
                          : "-"}
                      </td>
                    );
                  })}
                </tr>
                {/* 8. CUOTA INICIAL APROXIMADA (IVA INC) S/ SEGURO */}
                <tr>
                  <th
                    style={{
                      ...thStyle,
                      background: "rgb(35, 35, 66)",
                      color: "rgb(255, 255, 255)",
                    }}
                  >
                    CUOTA INICIAL APROXIMADA (IVA INC) S/ SEGURO
                  </th>
                  {[12, 18, 24, 36, 48].map((plazo) => {
                    const found = configBancosPlazos.find(
                      (c) =>
                        String(c.producto_banco_id) ===
                          String(productoSeleccionado) &&
                        Number(c.plazo) === plazo
                    );
                    const tna = found ? Number(found.tna) / 100 : 0;
                    const comision = found ? Number(found.comision) / 100 : 0;
                    const datos = calcularCreditoPrendario({
                      capitalNeto: Number(capitalPorPlazo[plazo]),
                      comision: comision,
                      tna: tna,
                      plazoMeses: plazo,
                      tipoPersona:
                        tipoPersona === "juridica" ? "JURIDICA" : "HUMANA",
                      abonaSellado: cobroSellado === "abona",
                      exento: cobroSellado === "exento",
                    });
                    return (
                      <td
                        style={{
                          ...tdStyle,
                          background: isPlazoDisponible(plazo)
                            ? "#ffe5d0"
                            : "#e0e0e0",
                          color: isPlazoDisponible(plazo)
                            ? "#232342"
                            : "#a0a0a0",
                        }}
                        key={plazo}
                      >
                        {isPlazoDisponible(plazo)
                          ? datos.cuotaConIVA
                            ? `$${Number(datos.cuotaConIVA).toLocaleString(
                                "es-AR",
                                { minimumFractionDigits: 2 }
                              )}`
                            : "-"
                          : "-"}
                      </td>
                    );
                  })}
                </tr>
                {/* 10. CUOTA PROMEDIO (IVA INCLUIDO) SIN SEGURO */}
                <tr>
                  <th
                    style={{
                      ...thStyle,
                      background: "rgb(35, 35, 66)",
                      color: "rgb(255, 255, 255)",
                    }}
                  >
                    CUOTA PROMEDIO (IVA INCLUIDO) SIN SEGURO
                  </th>
                  {[12, 18, 24, 36, 48].map((plazo) => {
                    const found = configBancosPlazos.find(
                      (c) =>
                        String(c.producto_banco_id) ===
                          String(productoSeleccionado) &&
                        Number(c.plazo) === plazo
                    );
                    const tna = found ? Number(found.tna) / 100 : 0;
                    const comision = found ? Number(found.comision) / 100 : 0;
                    const datos = calcularCreditoPrendario({
                      capitalNeto: Number(capitalPorPlazo[plazo]),
                      comision: comision,
                      tna: tna,
                      plazoMeses: plazo,
                      tipoPersona:
                        tipoPersona === "juridica" ? "JURIDICA" : "HUMANA",
                      abonaSellado: cobroSellado === "abona",
                      exento: cobroSellado === "exento",
                    });

                    // Nuevo cálculo de promedio
                    const promedioCuotaConIVA = isPlazoDisponible(plazo)
                      ? calcularPromedioCuotaConIVA({
                          capitalBruto: Number(datos.capitalBruto),
                          plazoMeses: plazo,
                          tna: tna,
                          tipoPersona: tipoPersona,
                        })
                      : null;

                    return (
                      <td
                        style={{
                          ...tdStyle,
                          background: isPlazoDisponible(plazo)
                            ? "#ffe5d0"
                            : "#e0e0e0",
                          color: isPlazoDisponible(plazo)
                            ? "#232342"
                            : "#a0a0a0",
                        }}
                        key={plazo}
                      >
                        {isPlazoDisponible(plazo)
                          ? promedioCuotaConIVA
                            ? `$${Number(promedioCuotaConIVA).toLocaleString(
                                "es-AR",
                                { minimumFractionDigits: 2 }
                              )}`
                            : "-"
                          : "-"}
                      </td>
                    );
                  })}
                </tr>
                {/* 11. MONTO DE LA PRENDA */}
                <tr>
                  <th style={thStyle}>MONTO DE LA PRENDA</th>
                  {[12, 18, 24, 36, 48].map((plazo) => {
                    const found = configBancosPlazos.find(
                      (c) =>
                        String(c.producto_banco_id) ===
                          String(productoSeleccionado) &&
                        Number(c.plazo) === plazo
                    );
                    const tna = found ? Number(found.tna) / 100 : 0;
                    const comision = found ? Number(found.comision) / 100 : 0;
                    const datos = calcularCreditoPrendario({
                      capitalNeto: Number(capitalPorPlazo[plazo]),
                      comision: comision,
                      tna: tna,
                      plazoMeses: plazo,
                      tipoPersona:
                        tipoPersona === "juridica" ? "JURIDICA" : "HUMANA",
                      abonaSellado: cobroSellado === "abona",
                      exento: cobroSellado === "exento",
                    });
                    return (
                      <td
                        style={{
                          ...tdStyle,
                          background: isPlazoDisponible(plazo)
                            ? tdStyle.background
                            : "#e0e0e0",
                          color: isPlazoDisponible(plazo)
                            ? tdStyle.color
                            : "#a0a0a0",
                        }}
                        key={plazo}
                      >
                        {isPlazoDisponible(plazo)
                          ? datos.montoPrenda
                            ? `$${Number(datos.montoPrenda).toLocaleString(
                                "es-AR",
                                { minimumFractionDigits: 2 }
                              )}`
                            : "-"
                          : "-"}
                      </td>
                    );
                  })}
                </tr>
                {mostrarFilasAvanzadas && (
                  <tr>
                    <th style={thStyle}>SELLADO</th>
                    {[12, 18, 24, 36, 48].map((plazo) => {
                      const found = configBancosPlazos.find(
                        (c) =>
                          String(c.producto_banco_id) ===
                            String(productoSeleccionado) &&
                          Number(c.plazo) === plazo
                      );
                      const tna = found ? Number(found.tna) / 100 : 0;
                      const comision = found ? Number(found.comision) / 100 : 0;
                      const datos = calcularCreditoPrendario({
                        capitalNeto: Number(capitalPorPlazo[plazo]),
                        comision: comision,
                        tna: tna,
                        plazoMeses: plazo,
                        tipoPersona:
                          tipoPersona === "juridica" ? "JURIDICA" : "HUMANA",
                        abonaSellado: cobroSellado === "abona",
                        exento: cobroSellado === "exento",
                      });
                      return (
                        <td
                          style={{
                            ...tdStyle,
                            background: isPlazoDisponible(plazo)
                              ? tdStyle.background
                              : "#e0e0e0",
                            color: isPlazoDisponible(plazo)
                              ? tdStyle.color
                              : "#a0a0a0",
                          }}
                          key={plazo}
                        >
                          {isPlazoDisponible(plazo)
                            ? datos.sellado && !isNaN(datos.sellado)
                              ? `$${Number(datos.sellado).toLocaleString(
                                  "es-AR",
                                  {
                                    minimumFractionDigits: 2,
                                  }
                                )}`
                              : "-"
                            : "-"}
                        </td>
                      );
                    })}
                  </tr>
                )}
                {/* 14. % COMISIÓN OTORGAMIENTO */}
                <tr>
                  <th
                    style={{
                      ...thStyle,
                      background: "rgb(35, 35, 66)",
                      color: "#e0e0e0",
                    }}
                  >
                    % COMISIÓN OTORGAMIENTO
                  </th>
                  {[12, 18, 24, 36, 48].map((plazo) => {
                    const found = configBancosPlazos.find(
                      (c) =>
                        String(c.producto_banco_id) ===
                          String(productoSeleccionado) &&
                        Number(c.plazo) === plazo
                    );
                    return (
                      <td
                        style={{
                          ...tdStyle,
                          background: isPlazoDisponible(plazo)
                            ? "#d0e3ff"
                            : "#e0e0e0",
                          color: isPlazoDisponible(plazo)
                            ? "#232342"
                            : "#a0a0a0",
                        }}
                        key={plazo}
                      >
                        {isPlazoDisponible(plazo) &&
                        found &&
                        found.comision !== undefined &&
                        found.comision !== null
                          ? `${Number(found.comision).toLocaleString("es-AR", {
                              minimumFractionDigits: 2,
                            })}%`
                          : "-"}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>

            <div className="text-center my-4">
              <input
                type="text"
                className="form-control mb-2"
                style={{ maxWidth: 350, margin: "0 auto" }}
                placeholder="Nombre del archivo PDF"
                value={nombreArchivoPDF}
                onChange={(e) => setNombreArchivoPDF(e.target.value)}
              />
              <button
                className="btn btn-danger btn-lg"
                onClick={handleDescargarPDF}
              >
                Descargar PDF de la cotización
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cotizador;
