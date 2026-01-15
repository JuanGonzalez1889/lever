import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, Route, Routes } from "react-router-dom";
import {
  Navbar,
  Nav,
  Container,
  Table,
  Button,
  Modal,
  Form,
} from "react-bootstrap";
import { FaTimes, FaFileInvoiceDollar, FaWarehouse } from "react-icons/fa";
import { CiBank } from "react-icons/ci";
import { MdOutlineAttachMoney } from "react-icons/md";
import { HiUsers } from "react-icons/hi2";
import {
  House,
  Calculator,
  Briefcase,
  Book,
  BoxArrowRight,
} from "react-bootstrap-icons";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Dashboard.css"; // Importar el archivo CSS personalizado
import Cotizador from "./Cotizador"; // Importar el nuevo componente Cotizador
import UsuariosAgencias from "./UsuariosAgencias";
import ConfiguracionBancos from "./ConfiguracionBancos";
import Bancos from "./Bancos";
import Agencias from "./Agencias";
import Cotizaciones from "./Cotizaciones";
import Operaciones from "./Operaciones";
import Prenda from "./Prenda";
import { FaRegCircleUser } from "react-icons/fa6";
import Analytics from "./Analytics";

//const API_URL = "https://api.lever.com.ar" // para PRODUCCION

const API_URL = process.env.REACT_APP_API_URL; // para LOCAL

console.log("API_URL (Dashboard):", API_URL); // Verificar que se está utilizando el .env

function Tablero() {
  const [data, setData] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedBanco, setSelectedBanco] = useState("");
  const [selectedSegmento, setSelectedSegmento] = useState("");
  const [products, setProducts] = useState([]);
  const [minAFinanciar, setMinAFinanciar] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [ltv, setLtv] = useState({}); 
  const [showNewProductModal, setShowNewProductModal] = useState(false); // Nuevo estado para el modal
  const [newProduct, setNewProduct] = useState({
    nombre: "",
    minAFinanciar: "",
    ltv: {},
    plazos: {},
    segmento_id: "",
    banco: "",
    retorno: "CR,SR",
  });
  const [newProductName, setNewProductName] = useState(""); // Estado para el nuevo nombre del producto
  const [segmentos, setSegmentos] = useState([]);
  const [newProductCategorias, setNewProductCategorias] = useState([
    "A",
    "B",
    "C",
  ]);
  // Obtener bancos únicos
  const bancosUnicos = data
    ? [...new Set(Object.values(data.productos).map((p) => p.banco))].sort()
    : [];

  // Obtener segmentos únicos
  const segmentosUnicos = data
    ? [...new Set(Object.values(data.productos).map((p) => p.segmento_id))]
        .map((segId) => {
          const seg = segmentos.find((s) => s.id === Number(segId));
          return seg ? { id: seg.id, nombre: seg.nombre } : null;
        })
        .filter(Boolean)
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
    : [];
  // Filtrar bancos por segmento seleccionado
  const bancosPorSegmento = selectedSegmento
    ? [
        ...new Set(
          Object.values(data?.productos || {})
            .filter((p) => p.segmento_id == selectedSegmento)
            .map((p) => p.banco)
        ),
      ].sort()
    : [];     
  // Filtrar productos por banco seleccionado
  const productosFiltradesPorBanco = selectedBanco
    ? Object.entries(data?.productos || {})
        .filter(([_, prod]) => prod.banco === selectedBanco)
        .map(([key, prod]) => ({ key, nombre: prod.nombre, banco: prod.banco }))
    : [];

  const handleSelectProduct = (productKey) => {
    setSelectedProduct(productKey);
    const producto = data.productos[productKey];
    if (producto) {
      setMinAFinanciar(data.minAFinanciar?.toString() || "");
      setLtv(data.productos?.[productKey]?.ltv || {});
    }
  };

  const defaultNewProductYears = [2025, 2024, 2023];
  const [newProductYears, setNewProductYears] = useState(
    defaultNewProductYears
  );
  console.log("API_URL (Tablero):", API_URL); // Verificar la URL

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
        const firstProductKey = Object.keys(response.data.productos || {})[0];
        setLtv(
          firstProductKey
            ? response.data.productos[firstProductKey].ltv || {}
            : {}
        );
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/segmentos`, { withCredentials: true })
      .then((res) => setSegmentos(res.data))
      .catch((err) => console.error("Error fetching segmentos:", err));
  }, []);

  useEffect(() => {
    if (selectedProduct && data && data.productos[selectedProduct]) {
      setNewProductName(data.productos[selectedProduct].nombre); // Solo el nombre real
    }
  }, [selectedProduct, data]);

  const formatNumber = (number) => {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleSave = async () => {
    // Normalizar LTV
    const updatedLtv = {};
    Object.keys(ltv).forEach((year) => {
      if (typeof ltv[year] === "object") {
        updatedLtv[year] = {
          value: ltv[year].value ?? ltv[year],
          show: ltv[year].show ?? 1,
        };
      } else {
        updatedLtv[year] = { value: ltv[year], show: 1 };
      }
    });

    // Clave destino
    const productKeyToSend =
      newProductName && newProductName !== selectedProduct
        ? `${newProductName}__${data.productos[selectedProduct].segmento_id}__${data.productos[selectedProduct].banco}`
        : selectedProduct;

    // ✅ NORMALIZAR CATEGORÍAS
    let categoriasToSend = (data.productos[selectedProduct]?.categorias ?? "")
      .split(",")
      .map((c) => c.trim().replace(/Categoria\s*/gi, ""))
      .filter((c) => c === "A" || c === "B" || c === "C")
      .join(",");

    const updatedData = {
      minAFinanciar: parseInt((minAFinanciar || "0").replace(/\./g, "")),
      productos: {
        [productKeyToSend]: {
          ...data.productos[selectedProduct],
          nombre: newProductName,
          segmento_id: data.productos[selectedProduct].segmento_id,
          categorias: categoriasToSend,
          retorno: data.productos[selectedProduct]?.retorno || "CR,SR",
        },
      },
      ltv: {
        [productKeyToSend]: updatedLtv,
      },
      newProductName,
    };

    try {
      await axios.post(`${API_URL}/api/data`, updatedData, {
        withCredentials: true,
      });

      // Guardar categorías específicas en la tabla productos
      const producto_id = data.productos[selectedProduct].producto_ids[0];
      await axios.put(
        `${API_URL}/api/productos/${producto_id}/categorias`,
        { categorias: categoriasToSend }, // "" permitido
        { withCredentials: true }
      );

      // Actualizar estado local
      setData((prevData) => {
        const newProductos = { ...prevData.productos };
        const current = newProductos[selectedProduct];
        newProductos[productKeyToSend] = {
          ...current,
          nombre: newProductName || current.nombre,
          categorias: categoriasToSend,
        };
        if (productKeyToSend !== selectedProduct) {
          delete newProductos[selectedProduct];
        }
        setProducts(Object.keys(newProductos));
        return { ...prevData, productos: newProductos };
      });

      setSelectedProduct(productKeyToSend);
      setShowModal(true);
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Error guardando cambios");
    }
  };

  const handleProductChange = (e) => {
    setSelectedProduct(e.target.value);
    // Cargar los LTV del producto seleccionado
    if (
      data &&
      data.productos &&
      data.productos[e.target.value] &&
      data.productos[e.target.value].ltv
    ) {
      setLtv(data.productos[e.target.value].ltv);
    } else {
      setLtv({});
    }
  };

  const handleInputChange = (e, product, plazo, field) => {
    const value = e.target.value; // Mantener los puntos como separadores decimales
    setData((prevData) => ({
      ...prevData,
      productos: {
        ...prevData.productos,
        [product]: {
          ...prevData.productos[product],
          plazos: {
            ...prevData.productos[product].plazos,
            [plazo]: {
              ...prevData.productos[product].plazos[plazo],
              [field]: value,
            },
          },
        },
      },
    }));
  };

  const handleLtvChange = (e, year, field) => {
    const value = field === "show" ? e.target.checked : e.target.value; // Manejar checkbox para 'show'
    setLtv((prevLtv) => ({
      ...prevLtv,
      [year]: {
        ...prevLtv[year],
        [field]: value,
      },
    }));
  };

  const agregarPlazo = () => {
    const nuevoPlazo = prompt("Ingrese el nuevo plazo en meses:");
    if (nuevoPlazo) {
      setData((prevData) => ({
        ...prevData,
        productos: {
          ...prevData.productos,
          [selectedProduct]: {
            ...prevData.productos[selectedProduct],
            plazos: {
              ...prevData.productos[selectedProduct].plazos,
              [nuevoPlazo]: { interest: "", fee: "", minfee: "" }, // Inicializar valores vacíos
            },
          },
        },
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
            onChange={(e) => handleInputChange(e, producto, plazo, "interest")}
            required
          />
        </td>
        <td>
          <Form.Control
            type="text"
            placeholder="0.065"
            value={datos.fee}
            onChange={(e) => {
              // Validar que sea un número decimal válido
              const value = e.target.value.replace(",", ".");
              if (value === "" || !isNaN(value)) {
                handleInputChange(
                  { ...e, target: { ...e.target, value } },
                  producto,
                  plazo,
                  "fee"
                );
              }
            }}
            required
          />
        </td>
        <td>
          <Form.Control
            type="number"
            value={datos.minfee} // Mantener los puntos como separadores decimales
            onChange={(e) => handleInputChange(e, producto, plazo, "minfee")}
            required
          />
        </td>
        <td
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <FaTimes
            color="red"
            style={{ cursor: "pointer" }}
            onClick={() => confirmarEliminarPlazo(producto, plazo)}
          />
        </td>
      </tr>
    );
  };

  const confirmarEliminarPlazo = (producto, plazo) => {
    const confirmacion = window.confirm(
      "¿Está seguro que desea eliminar el plazo seleccionado?"
    );
    if (confirmacion) {
      eliminarPlazo(producto, plazo);
    }
  };

  const eliminarPlazo = async (productoKey, plazo) => {
    try {
      const producto_id = data.productos[productoKey].plazos[plazo].producto_id;
      await axios.delete(`${API_URL}/api/plazo`, {
        data: { productoId: producto_id, plazo },
        withCredentials: true,
      });

      // Actualizar el estado local después de eliminar
      setData((prevData) => {
        const newPlazos = { ...prevData.productos[productoKey].plazos };
        delete newPlazos[plazo];
        return {
          ...prevData,
          productos: {
            ...prevData.productos,
            [productoKey]: {
              ...prevData.productos[productoKey],
              plazos: newPlazos,
            },
          },
        };
      });
    } catch (error) {
      console.error("Error eliminando el plazo:", error);
    }
  };

  const handleNewProductChange = (e, field) => {
    setNewProduct((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleNewProductLtvChange = (e, year, field) => {
    const value = field === "show" ? e.target.checked : e.target.value;
    setNewProduct((prev) => ({
      ...prev,
      ltv: {
        ...prev.ltv,
        [year]: {
          ...prev.ltv[year],
          [field]: value,
        },
      },
    }));
  };

  const handleNewProductPlazoChange = (e, plazo, field) => {
    const value = e.target.value;
    setNewProduct((prev) => ({
      ...prev,
      plazos: {
        ...prev.plazos,
        [plazo]: {
          ...prev.plazos[plazo],
          [field]: value,
        },
      },
    }));
  };

  const agregarNuevoPlazo = () => {
    const nuevoPlazo = prompt("Ingrese el nuevo plazo en meses:");
    if (nuevoPlazo) {
      setNewProduct((prev) => ({
        ...prev,
        plazos: {
          ...prev.plazos,
          [nuevoPlazo]: { interest: "", fee: "", minfee: "" },
        },
      }));
    }
  };

  const handleSaveNewProduct = async () => {
    // Validar segmento
    if (
      !newProduct.segmento_id ||
      isNaN(Number(newProduct.segmento_id)) ||
      Number(newProduct.segmento_id) === 0
    ) {
      alert("Debes seleccionar un segmento válido.");
      return;
    }
    try {
      await axios.post(
        `${API_URL}/api/new-product`,
        {
          ...newProduct,
          segmento_id: Number(newProduct.segmento_id),
          categorias: newProductCategorias.length
            ? newProductCategorias.join(",")
            : "A,B,C",
        },
        { withCredentials: true }
      );
      setShowNewProductModal(false);
      setNewProduct({
        nombre: "",
        minAFinanciar: "",
        ltv: {},
        plazos: {},
        segmento_id: "",
        banco: "",
        retorno: "CR,SR",
      });
      setNewProductCategorias(["A", "B", "C"]);
      setNewProductYears(defaultNewProductYears); // reset años LTV
      // Recargar datos
      const response = await axios.get(`${API_URL}/api/data`, {
        withCredentials: true,
      });
      setData(response.data);
      setProducts(Object.keys(response.data.productos));
    } catch (error) {
      console.error("Error saving new product:", error);
    }
  };
  const agregarAnoLtvNuevoProducto = () => {
    const nuevoAno = prompt("Ingrese el nuevo año:");
    if (!nuevoAno) return;
    const yearNum = Number(nuevoAno);
    if (isNaN(yearNum)) {
      alert("El año debe ser numérico.");
      return;
    }
    setNewProductYears((prev) =>
      prev.includes(yearNum) ? prev : [...prev, yearNum].sort((a, b) => b - a)
    );
  };

  const eliminarProducto = async () => {
    const confirmacion = window.confirm(
      `¿Está seguro que desea eliminar el producto "${selectedProduct}" y todos sus datos asociados?`
    );
    if (!confirmacion) return;

    try {
      // Eliminar todos los plazos asociados a este producto
      const productoIds = data.productos[selectedProduct].producto_ids;
      for (const productoId of productoIds) {
        await axios.delete(`${API_URL}/api/producto`, {
          data: { productoId },
          withCredentials: true,
        });
      }

      // Actualizar el estado local después de eliminar
      setData((prevData) => {
        const newProductos = { ...prevData.productos };
        delete newProductos[selectedProduct];
        return {
          ...prevData,
          productos: newProductos,
        };
      });

      setProducts((prevProducts) =>
        prevProducts.filter((product) => product !== selectedProduct)
      );
      setSelectedProduct(""); // Limpiar el producto seleccionado
    } catch (error) {
      console.error("Error eliminando el producto:", error);
    }
  };

  const eliminarLtv = async (productoKey, year) => {
    try {
      // Tomar el primer producto_id asociado a ese productoKey
      const producto_id = data.productos[productoKey].producto_ids[0];
      await axios.delete(`${API_URL}/api/ltv`, {
        data: { productoId: producto_id, year },
        withCredentials: true,
      });

      // Actualizar el estado local después de eliminar
      setLtv((prevLtv) => {
        const newLtv = { ...prevLtv };
        delete newLtv[year];
        return newLtv;
      });
    } catch (error) {
      console.error("Error eliminando el LTV:", error);
    }
  };

  const agregarAnoLtv = () => {
    const nuevoAno = prompt("Ingrese el nuevo año:");
    if (nuevoAno && !ltv[nuevoAno]) {
      setLtv((prevLtv) => ({
        ...prevLtv,
        [nuevoAno]: { value: "" }, // Inicializar con un valor vacío
      }));
    } else if (ltv[nuevoAno]) {
      alert("El año ya existe en el LTV.");
    }
  };

  if (!data) return <div>Cargando...</div>;

  return (
    <div className="content">
      <h1>Tablero de Configuración</h1>
      <Button variant="primary" onClick={() => setShowNewProductModal(true)}>
        Nuevo Producto
      </Button>
      {selectedProduct && (
        <Button
          variant="danger"
          onClick={eliminarProducto}
          style={{ marginLeft: "10px" }}
        >
          Eliminar Producto
        </Button>
      )}

      <Form id="configForm">
        {/* SELECT SEGMENTO */}
        <Form.Group controlId="selectedSegmento" className="mt-3">
          <Form.Label>
            <strong>Seleccionar Segmento:</strong>
          </Form.Label>
          <Form.Control
            as="select"
            value={selectedSegmento}
            onChange={(e) => {
              setSelectedSegmento(e.target.value);
              setSelectedBanco("");
              setSelectedProduct("");
            }}
          >
            <option value="">-- Selecciona un segmento --</option>
            {segmentosUnicos.map((seg) => (
              <option key={seg.id} value={seg.id}>
                {seg.nombre}
              </option>
            ))}
          </Form.Control>
        </Form.Group>

        {/* SELECT BANCO (solo si hay segmento seleccionado) */}
        {selectedSegmento && (
          <Form.Group controlId="selectedBanco" className="mt-3">
            <Form.Label>
              <strong>Seleccionar Banco:</strong>
            </Form.Label>
            <Form.Control
              as="select"
              value={selectedBanco}
              onChange={(e) => {
                setSelectedBanco(e.target.value);
                setSelectedProduct("");
              }}
            >
              <option value="">-- Selecciona un banco --</option>
              {bancosPorSegmento.map((banco) => (
                <option key={banco} value={banco}>
                  {banco}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
        )}

        {/* SELECT PRODUCTO (solo si hay banco seleccionado) */}
        {selectedBanco && selectedSegmento && (
          <Form.Group controlId="selectedProduct">
            <Form.Label>
              <strong>Seleccionar Producto:</strong>
            </Form.Label>
            <Form.Control
              as="select"
              value={selectedProduct}
              onChange={(e) => handleSelectProduct(e.target.value)}
            >
              <option value="">-- Selecciona un producto --</option>
              {productosFiltradesPorBanco.map((prod) => (
                <option key={prod.key} value={prod.key}>
                  {prod.nombre}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
        )}

        {/* DETALLES DEL PRODUCTO (solo si hay producto seleccionado) */}
        {selectedProduct && (
          <>
            {/* Mínimo a Financiar - SOLO AQUÍ */}
            <Form.Group controlId="minAFinanciar" className="mt-3">
              <Form.Label>
                <strong>Mínimo a Financiar:</strong>
              </Form.Label>
              <Form.Control
                type="text"
                value={minAFinanciar}
                onChange={(e) =>
                  setMinAFinanciar(
                    formatNumber(e.target.value.replace(/\./g, ""))
                  )
                }
              />
            </Form.Group>

            <Form.Group controlId="newProductName" className="mt-3">
              <Form.Label>
                <strong>Modificar Nombre del Producto:</strong>
              </Form.Label>
              <Form.Control
                type="text"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group controlId="editProductSegmento">
              <Form.Label>
                <strong>Modificar Segmento:</strong>
              </Form.Label>
              <Form.Control
                as="select"
                value={
                  data.productos[selectedProduct]?.segmento_id?.toString() || ""
                }
                onChange={(e) => {
                  setData((prevData) => ({
                    ...prevData,
                    productos: {
                      ...prevData.productos,
                      [selectedProduct]: {
                        ...prevData.productos[selectedProduct],
                        segmento_id: e.target.value,
                      },
                    },
                  }));
                }}
                required
              >
                <option value="">Seleccionar segmento</option>
                {segmentos.map((seg) => (
                  <option key={seg.id} value={seg.id.toString()}>
                    {seg.nombre}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>

            <Form.Group controlId="editProductBanco">
              <Form.Label>
                <strong>Modificar Banco:</strong>
              </Form.Label>
              <Form.Control
                type="text"
                value={data.productos[selectedProduct]?.banco || ""}
                onChange={(e) => {
                  setData((prevData) => ({
                    ...prevData,
                    productos: {
                      ...prevData.productos,
                      [selectedProduct]: {
                        ...prevData.productos[selectedProduct],
                        banco: e.target.value,
                      },
                    },
                  }));
                }}
                required
              />
            </Form.Group>

            <Form.Group controlId="editProductRetorno" className="mt-3">
              <Form.Label>
                <strong>Modificar Retorno (C.R./S.R.):</strong>
              </Form.Label>
              <Form.Control
                as="select"
                value={data.productos[selectedProduct]?.retorno || "CR,SR"}
                onChange={(e) => {
                  setData((prevData) => ({
                    ...prevData,
                    productos: {
                      ...prevData.productos,
                      [selectedProduct]: {
                        ...prevData.productos[selectedProduct],
                        retorno: e.target.value,
                      },
                    },
                  }));
                }}
              >
                <option value="CR,SR">C.R. y S.R.</option>
                <option value="CR">Solo C.R.</option>
                <option value="SR">Solo S.R.</option>
              </Form.Control>
            </Form.Group>

            {/* CATEGORÍAS */}
            <Form.Group controlId="editProductCategorias" className="mt-3">
              <Form.Label>
                <strong>Categorías visibles para:</strong>
              </Form.Label>

              {(() => {
                const cats = (data.productos[selectedProduct]?.categorias || "")
                  .split(",")
                  .filter(Boolean);
                const noMostrar = cats.length === 0;

                return (
                  <>
                    <div
                      style={{
                        display: "flex",
                        gap: "20px",
                        alignItems: "center",
                        marginBottom: 8,
                      }}
                    >
                      <Form.Check
                        type="checkbox"
                        label="Categoría A"
                        disabled={noMostrar}
                        checked={
                          data.productos[selectedProduct]?.categorias?.includes(
                            "A"
                          ) || false
                        }
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setData((prevData) => {
                            const currentCategorias =
                              prevData.productos[selectedProduct]?.categorias ||
                              "";
                            let newCategorias = currentCategorias
                              .split(",")
                              .filter(Boolean);

                            if (checked && !newCategorias.includes("A")) {
                              newCategorias.push("A");
                            } else if (!checked) {
                              newCategorias = newCategorias.filter(
                                (c) => c !== "A"
                              );
                            }

                            return {
                              ...prevData,
                              productos: {
                                ...prevData.productos,
                                [selectedProduct]: {
                                  ...prevData.productos[selectedProduct],
                                  categorias: newCategorias.join(","),
                                },
                              },
                            };
                          });
                        }}
                      />

                      <Form.Check
                        type="checkbox"
                        label="Categoría B"
                        disabled={noMostrar}
                        checked={
                          data.productos[selectedProduct]?.categorias?.includes(
                            "B"
                          ) || false
                        }
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setData((prevData) => {
                            const currentCategorias =
                              prevData.productos[selectedProduct]?.categorias ||
                              "";
                            let newCategorias = currentCategorias
                              .split(",")
                              .filter(Boolean);

                            if (checked && !newCategorias.includes("B")) {
                              newCategorias.push("B");
                            } else if (!checked) {
                              newCategorias = newCategorias.filter(
                                (c) => c !== "B"
                              );
                            }

                            return {
                              ...prevData,
                              productos: {
                                ...prevData.productos,
                                [selectedProduct]: {
                                  ...prevData.productos[selectedProduct],
                                  categorias: newCategorias.join(","),
                                },
                              },
                            };
                          });
                        }}
                      />

                      <Form.Check
                        type="checkbox"
                        label="Categoría C"
                        disabled={noMostrar}
                        checked={
                          data.productos[selectedProduct]?.categorias?.includes(
                            "C"
                          ) || false
                        }
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setData((prevData) => {
                            const currentCategorias =
                              prevData.productos[selectedProduct]?.categorias ||
                              "";
                            let newCategorias = currentCategorias
                              .split(",")
                              .filter(Boolean);

                            if (checked && !newCategorias.includes("C")) {
                              newCategorias.push("C");
                            } else if (!checked) {
                              newCategorias = newCategorias.filter(
                                (c) => c !== "C"
                              );
                            }

                            return {
                              ...prevData,
                              productos: {
                                ...prevData.productos,
                                [selectedProduct]: {
                                  ...prevData.productos[selectedProduct],
                                  categorias: newCategorias.join(","),
                                },
                              },
                            };
                          });
                        }}
                      />
                    </div>

                    <Form.Check
                      type="checkbox"
                      label="No mostrar este producto"
                      checked={noMostrar}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setData((prevData) => ({
                          ...prevData,
                          productos: {
                            ...prevData.productos,
                            [selectedProduct]: {
                              ...prevData.productos[selectedProduct],
                              categorias: checked ? "" : "A,B,C",
                            },
                          },
                        }));
                      }}
                    />
                  </>
                );
              })()}
            </Form.Group>

            {/* PLAZOS */}
            <div id="productoForm" className="mt-4">
              <h2>
                Producto{" "}
                {data.productos[selectedProduct]?.nombre?.toUpperCase()}
              </h2>
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
                    Object.keys(
                      data.productos[selectedProduct]?.plazos || {}
                    ).map((plazo) =>
                      generarPlazoHtml(
                        selectedProduct,
                        plazo,
                        data.productos[selectedProduct].plazos[plazo]
                      )
                    )}
                </tbody>
              </Table>
              <Button variant="primary" onClick={agregarPlazo}>
                Agregar Plazo
              </Button>
            </div>

            {/* LTV */}
            <div id="ltvForm" className="mt-4">
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
                  {Object.keys(ltv).map((year) => (
                    <tr key={`${selectedProduct}${year}Ltv`}>
                      <td>{year}</td>
                      <td>
                        <Form.Control
                          type="number"
                          value={ltv[year]?.value || ""}
                          onChange={(e) => handleLtvChange(e, year, "value")}
                          required
                        />
                      </td>
                      <td
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <FaTimes
                          color="red"
                          style={{ cursor: "pointer" }}
                          onClick={() => eliminarLtv(selectedProduct, year)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <Button variant="secondary" onClick={agregarAnoLtv}>
                Agregar Año
              </Button>
            </div>
          </>
        )}

        <Button variant="success" onClick={handleSave} className="mt-4">
          Guardar
        </Button>
      </Form>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>¡Cambios guardados exitosamente!</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Los cambios han sido guardados correctamente.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para nuevo producto */}
      <Modal
        show={showNewProductModal}
        onHide={() => setShowNewProductModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Nuevo Producto</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="newProductName">
              <Form.Label>Nombre del Producto:</Form.Label>
              <Form.Control
                type="text"
                value={newProduct.nombre || ""}
                onChange={(e) => handleNewProductChange(e, "nombre")}
                required
              />
            </Form.Group>

            <Form.Group controlId="newProductMinAFinanciar">
              <Form.Label>Mínimo a Financiar:</Form.Label>
              <Form.Control
                type="text"
                value={newProduct.minAFinanciar || ""}
                onChange={(e) => handleNewProductChange(e, "minAFinanciar")}
                required
              />
            </Form.Group>

            <h5>LTV</h5>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Año</th>
                  <th>LTV</th>
                  <th>Mostrar</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(
                  new Set([
                    ...newProductYears,
                    ...Object.keys(newProduct.ltv || {}).map((y) => Number(y)),
                  ])
                )
                  .sort((a, b) => b - a)
                  .map((year) => (
                    <tr key={year}>
                      <td>{year}</td>
                      <td>
                        <Form.Control
                          type="number"
                          size="sm"
                          value={newProduct.ltv[year]?.value || ""}
                          onChange={(e) =>
                            handleNewProductLtvChange(e, year, "value")
                          }
                        />
                      </td>
                      <td>
                        <Form.Check
                          type="checkbox"
                          checked={newProduct.ltv[year]?.show || false}
                          onChange={(e) =>
                            handleNewProductLtvChange(e, year, "show")
                          }
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </Table>
            <Button
              variant="secondary"
              size="sm"
              onClick={agregarAnoLtvNuevoProducto}
              className="mb-3"
            >
              Agregar Año LTV
            </Button>

            <Form.Group controlId="newProductSegmento">
              <Form.Label>Segmento:</Form.Label>
              <Form.Control
                as="select"
                value={newProduct.segmento_id || ""}
                onChange={(e) =>
                  setNewProduct((prev) => ({
                    ...prev,
                    segmento_id: e.target.value,
                  }))
                }
                required
              >
                <option value="">Seleccionar segmento</option>
                {segmentos.map((seg) => (
                  <option key={seg.id} value={seg.id}>
                    {seg.nombre}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>

            <Form.Group controlId="newProductBanco">
              <Form.Label>Banco:</Form.Label>
              <Form.Control
                type="text"
                value={newProduct.banco || ""}
                onChange={(e) => handleNewProductChange(e, "banco")}
                required
              />
            </Form.Group>

            <Form.Group controlId="newProductRetorno">
              <Form.Label>Retorno (C.R./S.R.):</Form.Label>
              <Form.Control
                as="select"
                value={newProduct.retorno || "CR,SR"}
                onChange={(e) => {
                  setNewProduct((prev) => ({
                    ...prev,
                    retorno: e.target.value,
                  }));
                }}
              >
                <option value="CR,SR">C.R. y S.R.</option>
                <option value="CR">Solo C.R.</option>
                <option value="SR">Solo S.R.</option>
              </Form.Control>
            </Form.Group>

            <h5>Plazos</h5>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Plazo</th>
                  <th>Interés</th>
                  <th>Fee</th>
                  <th>Min Fee</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(newProduct.plazos).map((plazo) => (
                  <tr key={plazo}>
                    <td>{plazo} meses</td>
                    <td>
                      <Form.Control
                        type="number"
                        size="sm"
                        value={newProduct.plazos[plazo]?.interest || ""}
                        onChange={(e) =>
                          handleNewProductPlazoChange(e, plazo, "interest")
                        }
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        size="sm"
                        value={newProduct.plazos[plazo]?.fee || ""}
                        onChange={(e) =>
                          handleNewProductPlazoChange(e, plazo, "fee")
                        }
                      />
                    </td>
                    <td>
                      <Form.Control
                        type="number"
                        size="sm"
                        value={newProduct.plazos[plazo]?.minfee || ""}
                        onChange={(e) =>
                          handleNewProductPlazoChange(e, plazo, "minfee")
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Button
              variant="secondary"
              size="sm"
              onClick={agregarNuevoPlazo}
              className="mb-3"
            >
              Agregar Plazo
            </Button>

            <Form.Group
              controlId="newProductCategorias"
              className="mt-3 p-3"
              style={{ backgroundColor: "#f8f9fa", borderRadius: "5px" }}
            >
              <Form.Label>
                <strong>Categorías visibles para:</strong>
              </Form.Label>
              <div style={{ display: "flex", gap: "20px", marginBottom: 10 }}>
                <Form.Check
                  type="checkbox"
                  label="Categoría A"
                  checked={newProductCategorias.includes("A")}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setNewProductCategorias((prev) => {
                      if (checked && !prev.includes("A")) {
                        return [...prev, "A"];
                      } else if (!checked) {
                        return prev.filter((c) => c !== "A");
                      }
                      return prev;
                    });
                  }}
                />
                <Form.Check
                  type="checkbox"
                  label="Categoría B"
                  checked={newProductCategorias.includes("B")}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setNewProductCategorias((prev) => {
                      if (checked && !prev.includes("B")) {
                        return [...prev, "B"];
                      } else if (!checked) {
                        return prev.filter((c) => c !== "B");
                      }
                      return prev;
                    });
                  }}
                />
                <Form.Check
                  type="checkbox"
                  label="Categoría C"
                  checked={newProductCategorias.includes("C")}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setNewProductCategorias((prev) => {
                      if (checked && !prev.includes("C")) {
                        return [...prev, "C"];
                      } else if (!checked) {
                        return prev.filter((c) => c !== "C");
                      }
                      return prev;
                    });
                  }}
                />
              </div>
              <Form.Check
                type="checkbox"
                label="No mostrar este producto"
                checked={newProductCategorias.length === 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    setNewProductCategorias([]);
                  } else {
                    setNewProductCategorias(["A", "B", "C"]);
                  }
                }}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowNewProductModal(false)}
          >
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSaveNewProduct}>
            Guardar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

function Cotizar() {
  return <Cotizador />;
}

function Instructivos() {
  return (
    <div className="content">
      <h1>Instructivos</h1>
      <p>Página en construcción...</p>
    </div>
  );
}

function Dashboard() {
  const [usuario, setUsuario] = useState(
    sessionStorage.getItem("usuario") || "Usuario"
  );
  const [rol, setRol] = useState(sessionStorage.getItem("rol") || "empleado");
  useEffect(() => {
    axios
      .get(`${API_URL}/api/check-session-admin`, { withCredentials: true })
      .then((response) => {
        if (response.data.success && response.data.user) {
          setUsuario(response.data.user.username);
          setRol(response.data.user.rol);
          sessionStorage.setItem("usuario", response.data.user.username);
          sessionStorage.setItem("rol", response.data.user.rol);
        } else {
          setUsuario("Usuario");
          setRol("empleado");
        }
      })
      .catch(() => {
        setUsuario("Usuario");
        setRol("empleado");
      });
  }, []);
  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/api/logout`, {}, { withCredentials: true });
      sessionStorage.removeItem("usuario");
      // Redirige a /admin después de cerrar sesión
      window.location.href = "/admin";
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  useEffect(() => {
    const actualizarUsuario = () => {
      setUsuario(sessionStorage.getItem("usuario") || "Usuario");
    };

    window.addEventListener("storage", actualizarUsuario);
    // También actualiza al montar
    actualizarUsuario();

    return () => {
      window.removeEventListener("storage", actualizarUsuario);
    };
  }, []);

  const [expanded, setExpanded] = useState(false);
  const handleNavClick = () => {
    if (window.innerWidth <= 768) setExpanded(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Navbar
        bg="dark"
        variant="dark"
        expand="md"
        expanded={expanded}
        onToggle={setExpanded}
        className="flex-column sidebar"
      >
        <Container className="d-flex flex-column h-100">
          <Navbar.Brand
            href="/dashboard"
            style={{
              width: 120,
              height: "auto",
              display: "block",
              margin: "0 auto",
            }}
          >
            LEVER
          </Navbar.Brand>

          <div
            className="sidebar-user"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingBottom: "67px",
            }}
          >
            <FaRegCircleUser
              size={38}
              color="#fff"
              style={{ marginBottom: 8 }}
            />
            <span
              style={{
                color: "#fff",
                fontSize: "1.1rem",
                textAlign: "center",
              }}
            >
              {usuario}
            </span>
          </div>
          <hr
            style={{
              width: "100%",
              border: "none",
              borderTop: "2px solid #ffffffff",
              margin: "0px 0px 5px",
            }}
          />
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav" className="flex-grow-1">
            <Nav
              className="flex-column flex-grow-1"
              style={{ marginBottom: "10rem" }}
            >
              {/* Ítems para ambos roles */}
              <Nav.Link
                as={Link}
                to="/dashboard/tablero"
                onClick={handleNavClick}
              >
                <House className="me-2" />
                Tablero
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/dashboard/cotizar"
                onClick={handleNavClick}
              >
                <Calculator className="me-2" />
                Cotizar
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/dashboard/operaciones"
                onClick={handleNavClick}
              >
                <Briefcase className="me-2" />
                Operaciones
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/dashboard/cotizaciones"
                onClick={handleNavClick}
              >
                <FaFileInvoiceDollar className="me-2" />
                Cotizaciones
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/dashboard/usuarios-agencias"
                onClick={handleNavClick}
              >
                <HiUsers className="me-2" />
                Usuarios Agencias
              </Nav.Link>
              {/* Ítems solo para admin */}
              {rol === "admin" && (
                <>
                  <Nav.Link
                    as={Link}
                    to="/dashboard/config-bancos"
                    onClick={handleNavClick}
                  >
                    <MdOutlineAttachMoney className="me-2" />
                    Configuración Productos
                  </Nav.Link>
                  <Nav.Link
                    as={Link}
                    to="/dashboard/bancos-tipo-credito"
                    onClick={handleNavClick}
                  >
                    <CiBank className="me-2" />
                    Configuración Bancos
                  </Nav.Link>
                  <Nav.Link
                    as={Link}
                    to="/dashboard/agencias"
                    onClick={handleNavClick}
                  >
                    <FaWarehouse className="me-2" />
                    Agencias
                  </Nav.Link>
                  <Nav.Link
                    as={Link}
                    to="/dashboard/analytics"
                    onClick={handleNavClick}
                  >
                    <FaWarehouse className="me-2" />
                    Metricas
                  </Nav.Link>
                </>
              )}
              {/* Botón cerrar sesión dentro del menú */}
              <Nav.Link
                className="logout-btn"
                onClick={handleLogout}
                style={{
                  textAlign: "left",
                  width: "100%",
                  paddingLeft: 13,
                  marginLeft: 0,
                  marginTop: "3rem",
                }}
              >
                <BoxArrowRight className="me-2" />
                Cerrar Sesión
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <div className="main-content">
        <Routes>
          <Route path="tablero" element={<Tablero />} />
          <Route path="cotizador" element={<Cotizador />} />{" "}
          <Route path="cotizar" element={<Cotizador />} />
          <Route path="operaciones" element={<Operaciones />} />
          <Route path="operaciones/prenda" element={<Prenda />} />
          <Route path="cotizaciones" element={<Cotizaciones />} />
          <Route path="instructivos" element={<Instructivos />} />
          <Route path="usuarios-agencias" element={<UsuariosAgencias />} />
          <Route path="config-bancos" element={<ConfiguracionBancos />} />
          <Route path="bancos-tipo-credito" element={<Bancos />} />
          <Route path="agencias" element={<Agencias />} />
          <Route path="analytics" element={<Analytics />} />
        </Routes>
      </div>
    </div>
  );
}

export default Dashboard;
