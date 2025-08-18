// --- Declarar accessToken global al inicio ---
let accessToken = null;
window.productosData = [];
window.segmentosData = [];

const API_BASE =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://api.lever.com.ar/api";

fetch(`${API_BASE}/productos-con-segmento`)
  .then((res) => res.json())
  .then((data) => {
    if (Array.isArray(data)) {
      window.productosData = data;
      data.map((producto) => {
        /* ... */
      });
    } else {
      window.productosData = [];
      console.error("Error: productos-con-segmento no devolvió un array", data);
      // Opcional: muestra un mensaje de error en la UI
    }
  })
  .catch((err) => {
    window.productosData = [];
    console.error("Error al obtener productos-con-segmento", err);
  });

fetch(`${API_BASE}/data`)
  .then((res) => res.json())
  .then((data) => {
    if (Array.isArray(data)) {
      // tu lógica normal
    } else {
      console.error("Error: /api/data no devolvió un array", data);
    }
  })
  .catch((err) => {
    console.error("Error al obtener /api/data", err);
  });

// --- FUNCIÓN GLOBAL PARA LIMPIAR FORMULARIO DE PANTALLA 1 ---
// IMPORTANTE: Definir como función global en el ámbito window
window.limpiarFormularioPantalla1 = function () {
  // Limpiar campo DNI/CUIT
  const dniInput = document.querySelector(".dni-input");
  if (dniInput) {
    dniInput.value = "";
  }

  // Restaurar switch a PERSONA (posición izquierda/default)
  const switchInput = document.querySelector(".toggle-switch input");
  if (switchInput && switchInput.checked) {
    switchInput.checked = false;
    // Llamar a la función existente que actualiza los labels y el placeholder
    if (typeof updateSwitchLabels === "function") {
      updateSwitchLabels();
    }
  }

  // Limpiar nombre del perfil
  const profileName = document.querySelector(".profile-name");
  if (profileName) {
    profileName.textContent = "";
  }

  // Ocultar el dropdown si está visible
  const dropdownContent = document.querySelector(".dropdown-content");
  if (dropdownContent && !dropdownContent.classList.contains("hidden")) {
    hideDropdown();
  }

  // Restaurar el indicador crediticio a su estado predeterminado (verde/viable)
  const indicator = document.querySelector(".credit-indicator");
  if (indicator) {
    indicator.style.transition =
      "left 0.25s cubic-bezier(0.4,0,0.2,1), border-color 0.25s, background 0.25s";
    indicator.style.left = "0";
    indicator.style.background = "#26BD10";
    indicator.style.border = "1px solid #ECECEC";
    indicator.style.width = "6px";
    indicator.style.height = "19px";
    indicator.style.borderRadius = "8px";
    indicator.style.position = "absolute";
    indicator.style.top = "-6px";
  }

  // Mostrar título "VIABLE" y ocultar "VIABLE CON OBSERVACIONES"
  const tituloVerde = document.querySelector(".credit-status-title-verde");
  const tituloAmarillo = document.querySelector(
    ".credit-status-title-amarillo"
  );
  if (tituloVerde) tituloVerde.style.display = "";
  if (tituloAmarillo) tituloAmarillo.style.display = "none";

  // Deshabilitar el botón de búsqueda (lupa)
  const searchIcon = document.querySelector(".search-icon-container");
  if (searchIcon) {
    searchIcon.classList.add("disabled");
    searchIcon.style.pointerEvents = "none";
    searchIcon.style.opacity = "0.5";
  }

  // Limpiar datos almacenados en sessionStorage
  sessionStorage.removeItem("solicitante_dni");
  sessionStorage.removeItem("solicitante_nombre");

  console.log("Formulario de pantalla 1 limpiado correctamente");
};

function toggleMenu() {
  const menu = document.getElementById("menu");
  menu.classList.toggle("hidden");
}
function toggleSwitch(isChecked) {
  const checkbox = document.querySelector(".toggle-switch input");
  if (checkbox.checked !== isChecked) {
    checkbox.checked = isChecked;
    updateSwitchLabels();
  }
}

function updateSwitchLabels() {
  const leftLabel = document.querySelector(".switch-label-left");
  const rightLabel = document.querySelector(".switch-label-right");
  const checkbox = document.querySelector(".toggle-switch input");
  const dniInput = document.querySelector(".dni-input");
  if (checkbox.checked) {
    leftLabel.style.color = "#303047";
    rightLabel.style.color = "#FFFFFF";
    dniInput.placeholder = "CUIT del solicitante";
  } else {
    leftLabel.style.color = "#FFFFFF";
    rightLabel.style.color = "#303047";
    dniInput.placeholder = "DNI del solicitante";
  }
  // Limpiar el campo al cambiar el switch
  dniInput.value = "";
  // Bloquear el botón de buscar al limpiar el campo
  const searchIcon = document.querySelector(".search-icon-container");
  if (searchIcon) {
    searchIcon.classList.add("disabled");
    searchIcon.style.pointerEvents = "none";
    searchIcon.style.opacity = "0.5";
  }
}
document
  .querySelector(".toggle-switch input")
  .addEventListener("change", updateSwitchLabels);
updateSwitchLabels();

function showDropdown() {
  const dniContainer = document.querySelector(".dni-container");
  const dropdownContent = document.querySelector(".dropdown-content");
  const searchIcon = document.querySelector(".search-icon-container");

  dniContainer.classList.add("expanded");
  dropdownContent.classList.remove("hidden");
  searchIcon.style.display = "none";
}

function hideDropdown() {
  const dniContainer = document.querySelector(".dni-container");
  const dropdownContent = document.querySelector(".dropdown-content");
  const searchIcon = document.querySelector(".search-icon-container");

  dniContainer.classList.remove("expanded");
  dropdownContent.classList.add("hidden");
  searchIcon.style.display = "flex";
}

function finalizeCotizacion() {
  const solicitante = sessionStorage.getItem("solicitante_nombre") || "";
  const solicitanteDoc = sessionStorage.getItem("solicitante_dni") || "";
  const producto = document
    .getElementById("selected-product-step4")
    ?.textContent?.trim();
  const monto = document
    .getElementById("custom-summary-amount-step4")
    ?.textContent?.trim();
  const cuotaSeleccionada = document.querySelector(
    "#step-4 .scrollable-item.selected"
  );
  const cuotas = cuotaSeleccionada
    ?.querySelector(".scrollable-text")
    ?.textContent?.trim();
  const valorCuota = cuotaSeleccionada
    ?.querySelector(".scrollable-value")
    ?.textContent?.trim();
  const marca = document
    .getElementById("vehicle-brand-step4")
    ?.textContent?.trim();
  const modelo = document
    .getElementById("vehicle-model-step4")
    ?.textContent?.trim();
  const anio = document
    .getElementById("vehicle-year-step4")
    ?.textContent?.trim();

  // NUEVO: Obtener la categoría seleccionada
  const categoriaPlaceholder = document.querySelector(
    "[onclick=\"toggleCustomOptions('categoria-options')\"]"
  );
  let categoria = "";
  if (categoriaPlaceholder) {
    categoria =
      categoriaPlaceholder.dataset.label ||
      categoriaPlaceholder.textContent.trim();
    // Limpiar saltos de línea y espacios extra
    categoria = categoria.replace(/\s+/g, " ").trim();
  }

  // Validar datos requeridos
  if (
    !producto ||
    producto === "Seleccionar Producto" ||
    !monto ||
    monto === "0" ||
    !cuotas ||
    !valorCuota
  ) {
    alert("Por favor, completa todos los datos antes de cotizar.");
    return;
  }

  // Obtener el estado de viabilidad global (de tu lógica)

  let mensaje = `¡Hola! Quiero avanzar con la cotización:\n\n`;
  if (solicitante) mensaje += `Solicitante: ${solicitante}\n`;
  if (solicitanteDoc) mensaje += `DNI/CUIT: ${solicitanteDoc}\n`;
  if (categoria) mensaje += `Categoría: ${categoria}\n`; // <-- AQUÍ
  if (marca) mensaje += `Marca: ${marca}\n`;
  if (modelo) mensaje += `Modelo: ${modelo}\n`;
  if (anio) mensaje += `Año: ${anio}\n`;
  if (producto) mensaje += `Producto: ${producto}\n`;
  if (monto) mensaje += `Monto a financiar: $${monto}\n`;
  if (cuotas && valorCuota) mensaje += `Cuotas: ${cuotas} de ${valorCuota}\n`;

  const numero = "+5493413088717";
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;

  try {
    const newTab = document.createElement("a");
    newTab.href = url;
    newTab.target = "_blank";
    newTab.rel = "noopener noreferrer";
    document.body.appendChild(newTab);
    newTab.click();
    document.body.removeChild(newTab);
  } catch (error) {
    try {
      const newWindow = window.open();
      if (newWindow) {
        newWindow.opener = null;
        newWindow.location = url;
      } else {
        alert(
          "Tu navegador bloqueó la apertura de una nueva pestaña. Se abrirá WhatsApp en esta ventana."
        );
        window.location.href = url;
      }
    } catch (error2) {
      window.location.href = url;
    }
  }
}

function selectCuota(element) {
  // Remover la clase 'selected' de todos los elementos
  document.querySelectorAll(".scrollable-item").forEach((item) => {
    item.classList.remove("selected");
  });

  // Agregar la clase 'selected' al elemento clickeado
  element.classList.add("selected");

  // Ocultar el mensaje de selección
  const message = document.getElementById("select-cuota-message");
  if (message) {
    message.classList.add("hidden");
    console.log("Ocultando mensaje: agregada clase 'hidden' desde selectCuota");
    // Log posición del botón
    const btn = document.querySelector(".cuota-info-btn");
    if (btn) {
      const rect = btn.getBoundingClientRect();
      console.log(
        "Botón posición tras seleccionar cuota:",
        "top:",
        rect.top,
        "left:",
        rect.left
      );
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Asegurar que el mensaje sea visible al cargar la pantalla 4
  const message = document.getElementById("select-cuota-message");
  if (message) {
    message.classList.remove("hidden"); // Mostrar el mensaje al inicio
    message.style.display = "block"; // Asegurar que sea visible
  } else {
    console.error(
      "No se encontró el elemento con ID 'select-cuota-message' al cargar la página."
    );
  }

  // Asignar el evento 'click' a cada elemento de cuota
  const cuotaItems = document.querySelectorAll(".scrollable-item");
  if (cuotaItems.length > 0) {
    cuotaItems.forEach((item) => {
      item.addEventListener("click", function () {
        selectCuota(this); // Llamar a selectCuota con el elemento clickeado
      });
    });
  } else {
    console.error(
      "No se encontraron elementos con la clase 'scrollable-item'."
    );
  }
});

// Asegurar que el mensaje no se muestre al avanzar al paso 4 si ya se seleccionó una cuota
function goToStep(step) {
  ocultarContacto();

  // Actualizar el título de pasos arriba del cotizador
  const tituloPaso = document.querySelector(".tituloysubtitulo h1");
  if (tituloPaso) {
    if (step === 1) {
      tituloPaso.innerHTML = "PASO <strong>1 DE 3</strong>";
    } else if (step === 2) {
      tituloPaso.innerHTML = "PASO <strong>2 DE 3</strong>";
    } else if (step === 3) {
      tituloPaso.innerHTML = "PASO <strong>3 DE 3</strong>";
    } else if (step === 4) {
      tituloPaso.innerHTML = "<strong>COTIZACIÓN</strong> ESTIMADA";
    }
  }

  console.log("goToStep llamada con step:", step);

  const steps = document.querySelectorAll(".step");
  steps.forEach((stepElement, index) => {
    if (index + 1 === step) {
      stepElement.classList.remove("hidden");
      stepElement.classList.add("active");

      // Mostrar el mensaje en la pantalla 4 si corresponde
      if (step === 4) {
        const message = document.getElementById("select-cuota-message");
        const selectedCuota = document.querySelector(
          ".scrollable-item.selected"
        );
        if (message) {
          if (!selectedCuota) {
            message.classList.remove("hidden"); // Mostrar el mensaje si no hay cuota seleccionada
            message.style.display = "block";
          } else {
            message.classList.add("hidden"); // Ocultar el mensaje si ya hay una cuota seleccionada
            message.style.display = "none";
            console.log(
              "Mensaje ocultado porque ya hay una cuota seleccionada."
            );
          }
        } else {
          console.error(
            "No se encontró el elemento con ID 'select-cuota-message' en la pantalla 4."
          );
        }
      }
    } else {
      stepElement.classList.add("hidden");
      stepElement.classList.remove("active");
    }
  });

  if (step === 3) {
    // Deshabilitar el botón "Siguiente" al ingresar a la pantalla 3
    const nextButtonStep3 = document.querySelector(
      '.next-button[onclick="goToStep(4)"]'
    );
    if (nextButtonStep3) {
      nextButtonStep3.disabled = true;
      nextButtonStep3.style.opacity = "0.5";
      nextButtonStep3.style.pointerEvents = "none";
    }
  }
  function validarBotonSiguientePaso3() {
    const monto = document.querySelector(".net-finance-input");
    if (!monto) return;

    const montoOk =
      monto.value && parseInt(monto.value.replace(/\D/g, "")) >= 1000000;

    if (montoOk) {
      nextButtonStep3.disabled = false;
      nextButtonStep3.style.opacity = "1";
      nextButtonStep3.style.pointerEvents = "auto";
      nextButtonStep3.style.cursor = "pointer";
    } else {
      nextButtonStep3.disabled = true;
      nextButtonStep3.style.opacity = "0.5";
      nextButtonStep3.style.pointerEvents = "none";
      nextButtonStep3.style.cursor = "not-allowed";
    }
  }
  document.addEventListener("DOMContentLoaded", () => {
    const modificarBtn = document.querySelector(".modificar-button");
    if (modificarBtn) {
      modificarBtn.addEventListener("click", function () {
        goToStep(3);
        mostrarLeyendaUsoParticular();
        limpiarLeyendaUsoParticularStep4();
        // Limpiar el input de monto neto a financiar
        const financeInput = document.querySelector(".net-finance-input");
        if (financeInput) {
          financeInput.value = "";
          financeInput.style.color = "";
        }
        // Opcional: deshabilitar el botón "Siguiente" hasta que se ingrese un nuevo monto
        const nextButtonStep3 = document.querySelector(
          '.next-button[onclick="goToStep(4)"]'
        );
        if (nextButtonStep3) {
          nextButtonStep3.disabled = true;
          nextButtonStep3.style.opacity = "0.5";
          nextButtonStep3.style.pointerEvents = "none";
          nextButtonStep3.style.cursor = "not-allowed";
        }
      });
    }
  });
  // Llama a esta función:
  // - Al ingresar a la pantalla 3 (después de tu código actual)
  // - Cuando cambia el select de producto
  // - Cuando cambia el input de monto

  // Ejemplo de listeners:
  document.addEventListener("DOMContentLoaded", function () {
    const monto = document.querySelector(".net-finance-input");
    if (monto) {
      monto.addEventListener("input", validarBotonSiguientePaso3);
    }
  });
}

function validarBotonSiguientePantalla3() {
  const productoPlaceholder = document.querySelector(
    `[onclick="toggleCustomOptions('product-options')"]`
  );
  const financeInput = document.querySelector(".net-finance-input");
  const nextButtonStep3 = document.querySelector(
    '.next-button[onclick="goToStep(4)"]'
  );

  // Verifica si hay producto seleccionado
  const productoSeleccionado =
    productoPlaceholder &&
    productoPlaceholder.dataset.value &&
    productoPlaceholder.dataset.value !== "" &&
    productoPlaceholder.textContent.trim() !== "Seleccionar Producto";

  // Verifica si el input tiene valor válido
  const montoValido =
    financeInput &&
    financeInput.value &&
    !isNaN(financeInput.value.replace(/\./g, "")) &&
    parseInt(financeInput.value.replace(/\./g, ""), 10) >= 1000000;

  if (productoSeleccionado && montoValido) {
    nextButtonStep3.disabled = false;
    nextButtonStep3.style.opacity = "1";
    nextButtonStep3.style.pointerEvents = "auto";
    nextButtonStep3.style.cursor = "pointer";
  } else {
    nextButtonStep3.disabled = true;
    nextButtonStep3.style.opacity = "0.5";
    nextButtonStep3.style.pointerEvents = "none";
    nextButtonStep3.style.cursor = "not-allowed";
  }
}
function normalizarCategoria(categoria) {
  return categoria
    .toLowerCase()
    .replace(/\s+/g, " ") // reemplaza múltiples espacios por uno
    .trim();
}
// Ejecutar la validación al cambiar producto o input
document.addEventListener("DOMContentLoaded", () => {
  const productOptions = document.getElementById("product-options");
  const financeInput = document.querySelector(".net-finance-input");

  if (productOptions) {
    productOptions.addEventListener("click", function (e) {
      if (e.target.classList.contains("custom-option")) {
        setTimeout(validarBotonSiguientePantalla3, 10);
      }
    });
  }
  if (financeInput) {
    financeInput.addEventListener("input", validarBotonSiguientePantalla3);
  }

  // Validar al cargar la pantalla 3
  validarBotonSiguientePantalla3();
});

document.addEventListener("DOMContentLoaded", () => {
  let dataWithLogo = []; // Array para almacenar marcas y sus logos

  // --- NUEVO: Obtener features por categoría ---
  async function getFeaturesByCategoria(categoria) {
    // Normalizar la categoría para evitar problemas de espacios/capitalización
    const cat = categoria.trim().toLowerCase();

    if (cat === "autos y pickups" || cat === "autos y pickup") {
      return ["CAB", "CUP", "JEE", "MIV", "PB4", "RUR", "SED", "WAG", "WA4"];
    }
    if (cat === "utilitarios") {
      return ["PKB", "SPE", "VAN", "FUA", "FUB", "MBU", "PKA"];
    }
    if (cat === "camiones") {
      return ["LIV", "PES", "COL"];
    }

    // Para el resto, consultá al backend como siempre
    const res = await fetch(`${API_BASE}/featuresCategoria`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoria }),
    });
    const text = await res.text();
    console.log("Respuesta cruda de featuresCategoria:", text);
    try {
      return JSON.parse(text).features || [];
    } catch (e) {
      console.error("Error parseando JSON:", e, text);
      return [];
    }
  }
  const fetchMarcasFromInfoauto = async (year) => {
    try {
      const categoria = getSelectedCategoria();
      const features = await getFeaturesByCategoria(categoria);

      const requestBody = {
        year: year.trim(),
        accessToken: accessToken,
        action: "getBrandsByYear",
        categoria,
        features,
      };

      const response = await fetch("php/curl.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(
          `Error al obtener marcas: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      dataWithLogo = data.brands || [];
      console.log("Marcas cargadas en dataWithLogo:", dataWithLogo);
      console.log("Respuesta de Infoauto (marcas):", data);
      accessToken = data.accessToken || accessToken;

      // --- LLENAR EL SELECT DE MARCAS ---
      const marcasSelect = document.getElementById("marca-options");
      if (!marcasSelect) return;

      // Guardar el buscador existente antes de limpiar el contenedor
      let searchContainer = marcasSelect.querySelector(
        ".custom-search-container"
      );
      if (!searchContainer) {
        searchContainer = document.createElement("div");
        searchContainer.className = "custom-search-container active";
        searchContainer.innerHTML = `
    <img src="./images/icons/lupita.svg" alt="Buscar" />
    <input type="text" placeholder="Buscar marca..." />
  `;
        marcasSelect.prepend(searchContainer);
      }
      const searchInput = searchContainer.querySelector("input");
      if (searchInput) {
        searchInput.oninput = function () {
          filterOptions("marca-options", this.value);
        };
      }

      // Agregar las marcas obtenidas
      if (Array.isArray(data.brands) && data.brands.length > 0) {
        data.brands.forEach((brand) => {
          const option = document.createElement("div");
          option.className = "custom-option";
          option.textContent = brand.name;
          option.dataset.value = brand.id;
          option.onclick = () =>
            selectCustomOption(brand.name, "marca-options", brand.id);
          marcasSelect.appendChild(option);
        });
      } else {
        // Si no hay marcas, mostrar mensaje
        const option = document.createElement("div");
        option.className = "custom-option disabled";
        option.textContent = "Sin marcas disponibles";
        marcasSelect.appendChild(option);
      }
    } catch (error) {
      console.error("Error al obtener marcas desde Infoauto:", error);
    }
  };

  const getLogo = (id) => {
    const element = dataWithLogo.find((element) => element.id == id);
    let logoUrl = element?.logo;

    // Si hay logo de la API, usarlo y salir
    if (logoUrl && logoUrl !== "null") {
      const img = document.getElementById("vehicle-logo");
      img.src = logoUrl;
      img.alt = `Logo de ${element?.name || "genérico"}`;
      return;
    }

    // Si no hay logo, buscar localmente según categoría
    const categoria = getSelectedCategoria();
    let nombreMarca = (element?.name || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    // Si el nombre está vacío, usar logo genérico y salir
    const img = document.getElementById("vehicle-logo");
    if (!nombreMarca) {
      img.src = "./images/logos/generic-logo.png";
      img.alt = "Logo genérico";
      return;
    }

    // Ruta base según categoría
    let basePath = "./images/logos/autos/";
    if (categoria && categoria.toLowerCase().includes("moto")) {
      basePath = "./images/logos/motos/";
    }
    // Probar con .png y .jpg
    const tryPng = `${basePath}${nombreMarca}.png`;
    const tryJpg = `${basePath}${nombreMarca}.jpg`;

    img.onerror = function () {
      if (img.src.endsWith(".png")) {
        img.src = tryJpg;
        img.onerror = function () {
          img.src = "./images/logos/generic-logo.png";
        };
      } else {
        img.src = "./images/logos/generic-logo.png";
      }
    };
    img.src = tryPng;
    img.alt = `Logo de ${element?.name || "genérico"}`;
  };

  // Llamar a fetchMarcasFromInfoauto al seleccionar un año
  document.getElementById("anio-options").addEventListener("click", (event) => {
    if (event.target.classList.contains("custom-option")) {
      const year = event.target.textContent;
      fetchMarcasFromInfoauto(year);
    }
  });

  // Actualizar el logo al seleccionar una marca
  document
    .getElementById("marca-options")
    .addEventListener("click", (event) => {
      if (event.target.classList.contains("custom-option")) {
        const marcaId = event.target.dataset.value;
        getLogo(marcaId);
      }
    });
});
async function getFeaturesByCodia(codia, categoria, accessToken) {
  const requestBody = {
    action: "getFeaturesByCodia",
    codia,
    accessToken,
    categoria,
  };
  const res = await fetch("php/curl.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });
  const text = await res.text();
  try {
    return JSON.parse(text); // Infoauto devuelve un objeto con los features
  } catch (e) {
    console.error("Error parseando features por codia:", e, text);
    return null;
  }
}
// Definir la función toggleCustomOptions en el ámbito global
function toggleCustomOptions(id) {
  const options = document.getElementById(id);
  const placeholder = document.querySelector(
    `[onclick="toggleCustomOptions('${id}')"]`
  );

  if (!options || !placeholder) return;

  // Cerrar todos los selects y extras antes de abrir el actual
  document.querySelectorAll(".custom-options").forEach((opt) => {
    if (opt !== options) {
      opt.classList.add("hidden");
      setTimeout(() => opt.classList.add("display-none"), 300);
    }
  });
  document.querySelectorAll(".custom-options-placeholder").forEach((ph) => {
    if (ph !== placeholder) {
      ph.classList.remove("active");
    }
  });
  document.querySelectorAll(".custom-options-extra").forEach((extra) => {
    extra.classList.remove("active");
  });

  // Alternar el estado del select actual
  const isHidden = options.classList.contains("hidden");
  if (isHidden) {
    options.classList.remove("display-none");
    setTimeout(() => {
      options.classList.remove("hidden");
      placeholder.classList.add("active");
      const extra = placeholder.parentElement.querySelector(
        ".custom-options-extra"
      );
      if (extra) extra.classList.add("active");
    }, 10);
  } else {
    options.classList.add("hidden");
    placeholder.classList.remove("active");
    const extra = placeholder.parentElement.querySelector(
      ".custom-options-extra"
    );
    if (extra) extra.classList.remove("active");
    setTimeout(() => options.classList.add("display-none"), 300);
  }
}
window.toggleCustomOptions = toggleCustomOptions;
// Cerrar las opciones si se hace clic fuera del contenedor
document.addEventListener("click", (event) => {
  document
    .querySelectorAll(".custom-options-container")
    .forEach((container) => {
      if (!container.contains(event.target)) {
        const options = container.querySelector(".custom-options");
        const placeholder = container.querySelector(
          ".custom-options-placeholder"
        );
        options.classList.add("hidden");
        placeholder.classList.remove("active"); // Quitar rotación de flecha
      }
    });
});

function selectCustomOption(value, id, extraData = null) {
  const options = document.getElementById(id);
  const placeholder = document.querySelector(
    `[onclick="toggleCustomOptions('${id}')"]`
  );

  if (!options || !placeholder) {
    console.error(
      `Error: No se encontró el elemento con ID "${id}" o su placeholder.`
    );
    return;
  }

  placeholder.textContent = value;
  placeholder.dataset.label = value; // Guardar el nombre visible
  placeholder.dataset.value = extraData || value; // Guardar el valor seleccionado

  placeholder.classList.add("selected-bold");

  // Cerrar el menú desplegable
  options.classList.add("hidden");
  placeholder.classList.remove("active"); // Quitar rotación de flecha

  console.log(`Opción seleccionada: ${value}`);

  // Si se selecciona un producto, actualizar el producto seleccionado en pantalla 4
  if (id === "product-options") {
    const selectedProductStep4 = document.getElementById(
      "selected-product-step4"
    );
    if (selectedProductStep4) {
      selectedProductStep4.textContent = value;
    }
    // Si el precio no está listo, intentar obtenerlo antes de calcular el máximo
    if (!window.precioVehiculo || window.precioVehiculo === 0) {
      // Intentar obtener el codia y año seleccionados
      const codia = getSelectedCodia && getSelectedCodia();
      const year = getSelectedYear && getSelectedYear();
      if (codia && year) {
        fetchPriceFromInfoauto(codia, year).then(() => {
          updateMaximoAFinanciar();
        });
      } else {
        updateMaximoAFinanciar();
      }
    } else {
      updateMaximoAFinanciar();
    }
  }

  // Si se selecciona una marca, cargar los modelos
  if (id === "marca-options") {
    // Limpiar el modelo seleccionado
    const modeloPlaceholder = document.querySelector(
      "[onclick=\"toggleCustomOptions('modelo-options')\"]"
    );
    if (modeloPlaceholder) {
      modeloPlaceholder.textContent = "Modelo";
      modeloPlaceholder.dataset.value = "";
      modeloPlaceholder.dataset.label = "";
    }

    const yearPlaceholder = document.querySelector(
      "[onclick=\"toggleCustomOptions('anio-options')\"]"
    );
    const year =
      yearPlaceholder?.dataset.value?.trim() ||
      yearPlaceholder?.textContent?.trim() ||
      "";
    fetchModelosFromInfoauto(extraData, year);
  }
}

window.selectCustomOption = selectCustomOption;

document.addEventListener("DOMContentLoaded", () => {
  document
    .querySelectorAll(".custom-options-container")
    .forEach((container, index, containers) => {
      const placeholder = container.querySelector(
        ".custom-options-placeholder"
      );
      const options = container.querySelector(".custom-options");
      const searchContainer = options.querySelector(".custom-search-container");
      const searchInput = searchContainer
        ? searchContainer.querySelector("input")
        : null;

      // Función para reiniciar y mostrar el buscador
      const resetSearch = () => {
        if (searchContainer) {
          console.log(`Reiniciando buscador en contenedor ${index}`);
          searchContainer.classList.add("active");
          searchInput.value = ""; // Limpiar el texto del buscador
          const allOptions = options.querySelectorAll(".custom-option");
          allOptions.forEach((option) => {
            option.style.display = "flex"; // Mostrar todas las opciones
          });
        }
      };

      // Abrir o cerrar las opciones al hacer clic en el placeholder
      placeholder.addEventListener("click", (event) => {
        event.stopPropagation();

        // Cerrar todos los selects y extras antes de abrir el actual
        document.querySelectorAll(".custom-options").forEach((opt) => {
          opt.classList.add("hidden");
        });
        document
          .querySelectorAll(".custom-options-placeholder")
          .forEach((ph) => {
            ph.classList.remove("active");
          });
        document.querySelectorAll(".custom-options-extra").forEach((extra) => {
          extra.classList.remove("active");
        });

        // Abrir solo el actual
        options.classList.remove("hidden");
        placeholder.classList.add("active");
        const extra = container.querySelector(".custom-options-extra");
        if (extra) extra.classList.add("active");
        resetSearch(); // Reiniciar y mostrar el buscador
      });
      // Seleccionar una opción
      options.addEventListener("click", (event) => {
        if (
          event.target.classList.contains("custom-option") &&
          !event.target.classList.contains("disabled")
        ) {
          // --- CORRECCIÓN SOLO PARA MODELO ---
          if (options.id === "modelo-options") {
            placeholder.textContent = event.target.textContent;
            placeholder.dataset.value = event.target.dataset.value; // codia numérico
            placeholder.dataset.label = event.target.textContent; // nombre modelo
          } else if (options.id === "marca-options") {
            placeholder.textContent = event.target.textContent;
            placeholder.dataset.value = event.target.dataset.value; // id de marca
            placeholder.dataset.label = event.target.textContent; // nombre marca
          } else if (options.id === "anio-options") {
            placeholder.textContent = event.target.textContent;
            placeholder.dataset.value = event.target.textContent; // año
            placeholder.dataset.label = event.target.textContent; // año
          } else if (options.id === "product-options") {
            // --- CORRECCIÓN: usar el value interno (clave compuesta) ---
            placeholder.textContent = event.target.textContent;
            placeholder.dataset.value = event.target.dataset.value;
            placeholder.dataset.label = event.target.textContent;
          } else {
            placeholder.textContent = event.target.textContent;
            placeholder.dataset.value = event.target.textContent;
            placeholder.dataset.label = event.target.textContent;
          }
          closeSelect(container);
          open = false;
        }
      });

      // Cerrar las opciones si se hace clic fuera del contenedor
      document.addEventListener("click", (event) => {
        document
          .querySelectorAll(".custom-options-container")
          .forEach((container, containerIndex) => {
            const options = container.querySelector(".custom-options");
            const placeholder = container.querySelector(
              ".custom-options-placeholder"
            );
            const searchContainer = options.querySelector(
              ".custom-search-container"
            );
            if (!container.contains(event.target)) {
              options.classList.add("hidden");
              placeholder.classList.remove("active");
              if (searchContainer) {
                searchContainer.classList.remove("active");
              }
            }
          });
      });
    });
});

document.addEventListener("DOMContentLoaded", () => {
  const updateVehicleSummary = () => {
    console.log("Actualizando resumen del vehículo...");

    const yearPlaceholder = document.querySelector(
      `[onclick="toggleCustomOptions('anio-options')"]`
    );
    const brandPlaceholder = document.querySelector(
      `[onclick="toggleCustomOptions('marca-options')"]`
    );
    const modelPlaceholder = document.querySelector(
      `[onclick="toggleCustomOptions('modelo-options')"]`
    );

    if (!yearPlaceholder || !brandPlaceholder || !modelPlaceholder) {
      console.error("No se encontraron los placeholders de los selects.");
      return;
    }

    // Mostrar el nombre (label) si existe, si no, fallback al value/text
    const year =
      yearPlaceholder.dataset.label?.trim() ||
      yearPlaceholder.dataset.value?.trim() ||
      yearPlaceholder.textContent.trim();
    const brand =
      brandPlaceholder.dataset.label?.trim() ||
      brandPlaceholder.dataset.value?.trim() ||
      brandPlaceholder.textContent.trim();
    const model =
      modelPlaceholder.dataset.label?.trim() ||
      modelPlaceholder.dataset.value?.trim() ||
      modelPlaceholder.textContent.trim();

    console.log("Datos seleccionados:", { year, brand, model });

    // Actualizar los elementos del paso 3
    document.getElementById("vehicle-brand").textContent = brand || "Marca";
    document.getElementById("vehicle-model").textContent = model || "Modelo";
    document.getElementById("vehicle-year").textContent = year || "Año";
  };

  // Actualizar los datos al avanzar al paso 3
  document
    .querySelector('.next-button[onclick="goToStep(3)"]')
    .addEventListener("click", () => {
      updateVehicleSummary();
    });
});

// Copiar los datos del vehículo de la pantalla 3 a la pantalla 4
document.addEventListener("DOMContentLoaded", () => {
  const updateVehicleSummaryStep4 = () => {
    const logo = document.getElementById("vehicle-logo").src;
    const brand = document.getElementById("vehicle-brand").textContent;
    const model = document.getElementById("vehicle-model").textContent;
    const year = document.getElementById("vehicle-year").textContent;

    document.getElementById("vehicle-logo-step4").src = logo;
    document.getElementById("vehicle-brand-step4").textContent = brand;
    document.getElementById("vehicle-model-step4").textContent = model;
    document.getElementById("vehicle-year-step4").textContent = year;
  };

  // Actualizar los datos al cambiar a la pantalla 4
  document
    .querySelector(".next-button[onclick='goToStep(4)']")
    .addEventListener("click", updateVehicleSummaryStep4);
});

document.addEventListener("DOMContentLoaded", () => {
  const updateCustomSummaryStep4 = () => {
    const inputElement = document.querySelector(".net-finance-input");
    if (!inputElement) {
      console.error("No se encontró el elemento .net-finance-input");
      return;
    }

    let inputAmount = inputElement.value || "0";
    console.log(
      "Valor del input en pantalla 3 (net-finance-input):",
      inputAmount
    );

    // Validar y limpiar el valor ingresado
    inputAmount = inputAmount.replace(/[^0-9]/g, ""); // Eliminar caracteres no numéricos
    if (inputAmount.length > 12) {
      inputAmount = inputAmount.slice(0, 12); // Limitar a 12 dígitos
      console.warn(
        "El valor ingresado excede el límite permitido. Se truncó a 12 dígitos."
      );
    }

    const formattedAmount = inputAmount.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    document.getElementById("custom-summary-amount-step4").textContent =
      formattedAmount || "0";

    console.log("Valor formateado para pantalla 4:", formattedAmount);
  };

  const nextButtonStep4 = document.querySelector(
    ".next-button[onclick='goToStep(4)']"
  );
  if (!nextButtonStep4) {
    console.error("No se encontró el botón para avanzar a la pantalla 4");
    return;
  }

  nextButtonStep4.addEventListener("click", () => {
    updateCustomSummaryStep4();
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const financeInput = document.querySelector(".net-finance-input");
  const maxAmountElement = document.querySelector(".custom-summary-amount");
  const minAmountText = document.querySelector(".min-amount-text");
  const nextButtonStep3 = document.querySelector(
    ".next-button[onclick='goToStep(4)']"
  );
  const productOptions = document.getElementById("product-options");

  if (
    !financeInput ||
    !maxAmountElement ||
    !minAmountText ||
    !nextButtonStep3 ||
    !productOptions
  ) {
    console.error(
      "No se encontraron los elementos necesarios para la validación."
    );
    return;
  }

  let isValidAmount = true;

  const validateAmount = () => {
    const maxAmount =
      parseInt(maxAmountElement.textContent.replace(/\./g, ""), 10) || 0;
    let value = financeInput.value.replace(/[^0-9]/g, ""); // Permitir solo números
    const numericValue = parseInt(value, 10) || 0;

    if (value.length > 12) {
      value = value.slice(0, 12); // Limitar a 12 dígitos
    }

    const formattedValue = value.replace(/\B(?=(\d{3})+(?!\d))/g, "."); // Formatear with puntos
    financeInput.value = formattedValue;

    // NUEVA VALIDACIÓN: Verificar si el monto es menor al mínimo requerido
    if (numericValue < 1000000 && numericValue !== 0) {
      // Si es 0, no mostrar mensaje todavía
      financeInput.style.color = "#FF594B";
      minAmountText.textContent = "El monto mínimo es de $1.000.000";
      minAmountText.style.color = "#FF594B";
      minAmountText.style.display = "block"; // Aseguramos que sea visible
      isValidAmount = false;
      nextButtonStep3.disabled = true;
      nextButtonStep3.style.opacity = "0.5";
      nextButtonStep3.style.pointerEvents = "none";
    }
    // Validar si el monto supera el máximo permitido
    else if (numericValue > maxAmount && maxAmount > 0) {
      financeInput.style.color = "#FF594B";
      minAmountText.textContent = "No puede superar el máximo a financiar.";
      minAmountText.style.color = "#FF594B";
      minAmountText.style.display = "block"; // Aseguramos que sea visible
      isValidAmount = false;
      nextButtonStep3.disabled = true;
      nextButtonStep3.style.opacity = "0.5";
      nextButtonStep3.style.pointerEvents = "none";
    } else {
      financeInput.style.color = "";

      // MODIFICACIÓN: Ocultar texto cuando el monto es mayor a $1.000.000
      if (numericValue > 1000000) {
        minAmountText.style.display = "none"; // Ocultar el texto si el monto es mayor a 1.000.000
      } else {
        minAmountText.style.display = "block"; // Mantener visible si no hay monto o es igual a 1.000.000
        minAmountText.textContent = "";
        minAmountText.style.color = "";
      }

      isValidAmount = true;
      nextButtonStep3.disabled = false;
      nextButtonStep3.style.opacity = "1";
      nextButtonStep3.style.pointerEvents = "auto";
    }
  };

  financeInput.addEventListener("input", validateAmount);

  financeInput.addEventListener("blur", (event) => {
    if (event.target.value.endsWith(".")) {
      event.target.value = event.target.value.slice(0, -1); // Eliminar punto final si existe
    }

    // Validación adicional al perder el foco: verificar si está vacío o es menor al mínimo
    const value = event.target.value.replace(/[^0-9]/g, "");
    const numericValue = parseInt(value, 10) || 0;

    if (numericValue < 1000000) {
      isValidAmount = false;
      nextButtonStep3.disabled = true;
      nextButtonStep3.style.opacity = "0.5";
      nextButtonStep3.style.pointerEvents = "none";

      if (numericValue > 0) {
        // Solo mostrar el mensaje de error si hay algún valor
        minAmountText.textContent = "El monto mínimo es de $1.000.000";
        minAmountText.style.color = "#FF594B";
        minAmountText.style.display = "block"; // Asegurar que sea visible
        financeInput.style.color = "#FF594B";
      }
    } else {
      // Ocultar el texto cuando el monto es válido (mayor a $1.000.000)
      minAmountText.style.display = "none";
    }
  });

  nextButtonStep3.addEventListener("click", (event) => {
    // Validación al hacer clic en el botón "Siguiente"
    const value = financeInput.value.replace(/[^0-9]/g, "");
    const numericValue = parseInt(value, 10) || 0;

    if (numericValue < 1000000) {
      event.preventDefault();
      isValidAmount = false;
      minAmountText.textContent = "El monto mínimo es de $1.000.000";
      minAmountText.style.color = "#FF594B";
      minAmountText.style.display = "block"; // Asegurar que sea visible
      financeInput.style.color = "#FF594B";
      nextButtonStep3.disabled = true;
      nextButtonStep3.style.opacity = "0.5";
      nextButtonStep3.style.pointerEvents = "none";
      alert("El monto debe ser como mínimo $1.000.000 para continuar.");
      return;
    }

    if (!isValidAmount) {
      event.preventDefault();
      if (numericValue > maxAmount) {
        alert(
          "El monto ingresado supera el máximo a financiar permitido. Corrige el monto para continuar."
        );
      } else {
        alert("Por favor, ingresa un monto válido para continuar.");
      }
    }
  });

  // Limpiar el input al cambiar el producto seleccionado
  productOptions.addEventListener("click", (event) => {
    if (event.target.classList.contains("custom-option")) {
      financeInput.value = ""; // Limpiar el input
      validateAmount(); // Revalidar el estado del botón
    }
  });

  // Validar al cargar la página
  validateAmount();
});

document.addEventListener("DOMContentLoaded", () => {
  const nextBtnStep1 = document.querySelector("#step-1 .next-button");
  if (nextBtnStep1) {
    nextBtnStep1.addEventListener("click", () => {
      const dniValue =
        document.querySelector(".dni-input")?.value?.trim() || "";
      const nombreCompleto =
        document.querySelector(".profile-name")?.textContent?.trim() || "";
      if (dniValue && nombreCompleto) {
        // Guardar en sessionStorage
        sessionStorage.setItem("solicitante_dni", dniValue);
        sessionStorage.setItem("solicitante_nombre", nombreCompleto);
        // Mostrar por consola
        console.log("Solicitante guardado:", {
          dni: dniValue,
          nombreCompleto,
        });
      } else {
        // Limpiar si no hay datos nuevos
        sessionStorage.removeItem("solicitante_dni");
        sessionStorage.removeItem("solicitante_nombre");
        console.log("Solicitante limpiado por avance sin datos");
      }
    });
  }
});

async function fetchModelosFromInfoauto(marcaId, year) {
  // Obtener la categoría seleccionada
  function getSelectedCategoria() {
    const catPlaceholder = document.querySelector(
      "[onclick=\"toggleCustomOptions('categoria-options')\"]"
    );
    if (!catPlaceholder) return "Autos y Pickup";
    const val = (
      catPlaceholder.dataset.value ||
      catPlaceholder.textContent ||
      ""
    ).toLowerCase();

    if (val.includes("moto")) return "motos";
    if (val.includes("camion")) return "camiones";
    if (val.includes("utilitario")) return "utilitarios";
    if (val.includes("pickup")) return "Autos y Pickup";
    return "autos";
  }
  const categoria = getSelectedCategoria();

  // --- NUEVO: obtener los features de la categoría seleccionada ---
  async function getFeaturesByCategoria(categoria) {
    // Normalizar la categoría para evitar problemas de espacios/capitalización
    const cat = categoria.trim().toLowerCase();

    if (cat === "autos y pickups" || cat === "autos y pickup") {
      return [
        "CAB",
        "CUP",
        "JEE",
        "MIV",
        "VAN",
        "PB4",
        "RUR",
        "SED",
        "WAG",
        "WA4",
      ];
    }
    if (cat === "utilitarios") {
      return ["PKB", "SPE", "FUA", "FUB", "MBU", "PKA"];
    }
    if (cat === "camiones") {
      return ["LIV", "PES", "COL"];
    }

    // Para el resto, consultá al backend como siempre
    const res = await fetch(`${API_BASE}/featuresCategoria`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoria }),
    });
    const text = await res.text();
    console.log("Respuesta cruda de featuresCategoria:", text);
    try {
      return JSON.parse(text).features || [];
    } catch (e) {
      console.error("Error parseando JSON:", e, text);
      return [];
    }
  }

  try {
    const features = await getFeaturesByCategoria(categoria);

    const requestBody = {
      idMarca: marcaId,
      year: year.trim(),
      accessToken: accessToken,
      action: "getModelsByBrand",
      categoria,
      features, // <-- enviar los features al backend
    };

    const response = await fetch("php/curl.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(
        `Error al obtener modelos: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    accessToken = data.accessToken || accessToken;
    // --- FILTRAR MODELOS PKB SI LA CATEGORÍA ES AUTOS Y PICKUP ---
    if (categoria === "autos y pickup" || categoria === "autos y pickups") {
      data.models = data.models.filter((model) => model.tipoVehiculo !== "PKB");
    }
    const modelosSelect = document.getElementById("modelo-options");

    // Guardar el buscador existente antes de limpiar el contenedor
    let searchContainer = modelosSelect.querySelector(
      ".custom-search-container"
    );
    if (!searchContainer) {
      searchContainer = document.createElement("div");
      searchContainer.className = "custom-search-container active";
      searchContainer.innerHTML = `
    <img src="./images/icons/lupita.svg" alt="Buscar" />
    <input type="text" placeholder="Buscar modelo..." />
  `;
      modelosSelect.prepend(searchContainer);
    }
    // Agregar el listener de filtrado SIEMPRE que insertás el buscador
    const searchInput = searchContainer.querySelector("input");
    if (searchInput) {
      searchInput.oninput = function () {
        filterOptions("modelo-options", this.value);
      };
    }

    modelosSelect.innerHTML = ""; // Limpiar opciones existentes
    // Reinsertar el buscador existente
    if (searchContainer) {
      modelosSelect.appendChild(searchContainer);
      searchContainer.classList.remove("hidden");
    }

    // Agregar los modelos obtenidos
    if (!data.models || data.models.length === 0) {
      const option = document.createElement("div");
      option.className = "custom-option disabled";
      option.textContent = "No hay modelos disponibles";
      modelosSelect.appendChild(option);
      return; // Salir de la función, no hay modelos para mostrar
    }

    data.models.forEach((model) => {
      const option = document.createElement("div");
      option.className = "custom-option";
      option.textContent = model.modelo;
      option.dataset.value = model.codia;
      option.onclick = () =>
        selectCustomOption(model.modelo, "modelo-options", model.codia);
      modelosSelect.appendChild(option);
    });

    console.log("Modelos obtenidos:", data.models);
  } catch (error) {
    console.error("Error al obtener modelos desde Infoauto:", error);
  }
}

// --- FUNCIÓN GLOBAL PARA CERRAR UN SELECT ---
function closeSelect(container) {
  if (!container) return; // <-- Previene errores si container es undefined o null
  const options = container.querySelector(".custom-options");
  const placeholder = container.querySelector(".custom-options-placeholder");
  const extra = container.querySelector(".custom-options-extra");
  if (options) options.classList.add("hidden");
  if (placeholder) placeholder.classList.remove("active");
  if (extra) extra.classList.remove("active");
  // Si hay un select siguiente, restaurar margen
  const containers = document.querySelectorAll(".custom-options-container");
  const idx = Array.from(containers).indexOf(container);
  if (idx !== -1 && containers[idx + 1])
    containers[idx + 1].style.marginTop = "15px";
}

document.addEventListener("DOMContentLoaded", () => {
  const containers = document.querySelectorAll(".custom-options-container");
  containers.forEach((container, idx, arr) => {
    const placeholder = container.querySelector(".custom-options-placeholder");
    const options = container.querySelector(".custom-options");
    const extra = container.querySelector(".custom-options-extra");
    let open = false;

    placeholder.addEventListener("click", (e) => {
      e.stopPropagation();
      if (open) {
        closeSelect(container);
        open = false;
        return;
      }
      arr.forEach((c, i) => {
        if (i !== idx) {
          closeSelect(c);
        }
      });
      options.classList.remove("hidden");
      placeholder.classList.add("active");
      if (extra) extra.classList.add("active");
      if (arr[idx + 1]) arr[idx + 1].style.marginTop = "168px";
      open = true;
    });

    options.addEventListener("click", (e) => {
      if (e.target.classList.contains("custom-option")) {
        // --- CORRECCIÓN SOLO PARA MODELO ---
        if (options.id === "modelo-options") {
          placeholder.textContent = e.target.textContent;
          placeholder.dataset.value = e.target.dataset.value; // codia numérico
          placeholder.dataset.label = e.target.textContent; // nombre modelo
        } else if (options.id === "marca-options") {
          placeholder.textContent = e.target.textContent;
          placeholder.dataset.value = e.target.dataset.value; // id de marca
          placeholder.dataset.label = e.target.textContent; // nombre marca
        } else if (options.id === "anio-options") {
          placeholder.textContent = e.target.textContent;
          placeholder.dataset.value = e.target.textContent; // año
          placeholder.dataset.label = e.target.textContent; // año
        } else if (options.id === "product-options") {
          // CORRECCIÓN: usar el value interno (clave compuesta)
          placeholder.textContent = e.target.textContent;
          placeholder.dataset.value = e.target.dataset.value;
          placeholder.dataset.label = e.target.textContent;
        } else {
          placeholder.textContent = e.target.textContent;
          placeholder.dataset.value = e.target.textContent;
          placeholder.dataset.label = e.target.textContent;
        }
        closeSelect(container);
        open = false;
      }
    });

    document.addEventListener("click", (e) => {
      if (!container.contains(e.target)) {
        closeSelect(container);
        open = false;
      }
    });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const updateSelectedProductStep4 = () => {
    const productoPlaceholder = document.querySelector(
      `[onclick="toggleCustomOptions('product-options')"]`
    );
    const value =
      productoPlaceholder?.dataset.value ||
      productoPlaceholder?.textContent?.trim();
    const selectedProductStep4 = document.getElementById(
      "selected-product-step4"
    );
    if (selectedProductStep4) {
      selectedProductStep4.textContent = label; // Mostrar el producto seleccionado
    }
  };

  const nextBtnStep4 = document.querySelector(
    ".next-button[onclick='goToStep(4)']"
  );
  if (nextBtnStep4) {
    nextBtnStep4.addEventListener("click", () => {
      updateSelectedProductStep4(); // Actualizar el producto seleccionado
      mostrarLeyendaUsoParticularStep4();
      setTimeout(actualizarCuotasPantalla4, 100); // Asegurar que las cuotas se actualicen correctamente
    });
  }
});
function limpiarDatosSolicitante() {
  const campos = [
    "#nombre-solicitante",
    "#dni-solicitante",
    "#cuit-solicitante",
    // Agregá aquí los IDs o clases de todos los campos del solicitante
  ];
  campos.forEach((selector) => {
    const campo = document.querySelector(selector);
    if (campo) campo.value = "";
  });
  // Si guardás datos en variables globales:
  window.datosSolicitante = {};
  // Si usás localStorage/sessionStorage:
  localStorage.removeItem("datosSolicitante");
  sessionStorage.removeItem("datosSolicitante");
}
document.addEventListener("DOMContentLoaded", () => {
  const shareBtn = document.querySelector(".share-button");
  if (!shareBtn) return;

  shareBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const updateCustomSummaryStep4 = () => {
      const inputElement = document.querySelector(".net-finance-input");
      if (!inputElement) return;
      let inputAmount = inputElement.value || "0";
      inputAmount = inputAmount.replace(/[^0-9]/g, "");
      const formattedAmount = inputAmount.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      document.getElementById("custom-summary-amount-step4").textContent =
        formattedAmount || "0";
    };
    updateCustomSummaryStep4();
    // Seleccionar los elementos a compartir
    const vehicleSummary = document.querySelector("#step-4 .vehicle-summary");
    const customSummary = document.querySelector(
      "#step-4 .custom-summary-step4"
    );
    const cuotasContainer = document.querySelector(
      "#step-4 .scrollable-container"
    );
    const cuotaItems = cuotasContainer
      ? cuotasContainer.querySelectorAll(".scrollable-item")
      : [];
    const cuotaSeleccionada = cuotasContainer
      ? cuotasContainer.querySelector(".scrollable-item.selected")
      : null;

    // Crear un contenedor temporal para la imagen
    const tempDiv = document.createElement("div");
    const fechaDiv = document.createElement("div");
    const fecha = new Date();
    const opciones = { day: "2-digit", month: "2-digit", year: "numeric" };
    fechaDiv.textContent = fecha.toLocaleDateString("es-AR", opciones);
    fechaDiv.style.position = "absolute";
    fechaDiv.style.top = "18px";
    fechaDiv.style.right = "32px";
    fechaDiv.style.fontSize = "13px";
    fechaDiv.style.color = "#888";
    fechaDiv.style.fontWeight = "bold";
    fechaDiv.style.background = "rgba(255,255,255,0.85)";
    fechaDiv.style.padding = "2px 10px";
    fechaDiv.style.borderRadius = "8px";
    fechaDiv.style.zIndex = "10";
    tempDiv.appendChild(fechaDiv);
    tempDiv.style.background = "#fff";
    tempDiv.style.padding = "32px 0 24px 0";
    tempDiv.style.borderRadius = "24px";
    tempDiv.style.display = "flex";
    tempDiv.style.flexDirection = "column";
    tempDiv.style.alignItems = "center";
    tempDiv.style.fontFamily = "Montserrat, sans-serif";
    tempDiv.style.color = "#222";
    tempDiv.style.width = "420px"; // ancho fijo para máxima compatibilidad
    tempDiv.style.minWidth = "420px";
    tempDiv.style.maxWidth = "420px";
    tempDiv.style.boxSizing = "border-box";
    tempDiv.style.textAlign = "center";
    tempDiv.style.position = "relative";
    tempDiv.style.fontSize = "15px";
    tempDiv.style.gap = "0";

    // Logo Lever arriba, centrado (base64)
    const logoText = document.createElement("div");
    logoText.textContent = "LEVER";
    logoText.style.fontFamily = "Montserrat, sans-serif";
    logoText.style.fontWeight = "bold";
    logoText.style.fontSize = "32px";
    logoText.style.color = "#2ADC9F";
    logoText.style.letterSpacing = "2px";
    logoText.style.margin = "0 auto 18px auto";
    logoText.style.textAlign = "center";
    logoText.style.width = "fit-content";
    logoText.style.display = "block";
    tempDiv.appendChild(logoText);

    // Título "COTIZACIÓN ESTIMADA"
    const tituloDiv = document.createElement("div");
    tituloDiv.style.display = "flex";
    tituloDiv.style.flexDirection = "row";
    tituloDiv.style.justifyContent = "center";
    tituloDiv.style.alignItems = "center";
    tituloDiv.style.margin = "0 0 18px 0";
    tituloDiv.style.gap = "6px";
    const span1 = document.createElement("span");
    span1.textContent = "COTIZACIÓN";
    span1.style.fontSize = "24px";
    span1.style.fontFamily = "Montserrat";
    span1.style.fontWeight = "bold";
    span1.style.color = "#222";
    const span2 = document.createElement("span");
    span2.textContent = "ESTIMADA";
    span2.style.fontSize = "24px";
    span2.style.fontFamily = "Montserrat";
    span2.style.fontWeight = "300";
    span2.style.color = "#222";
    span2.style.letterSpacing = "-3px";
    tituloDiv.appendChild(span1);
    tituloDiv.appendChild(span2);
    tempDiv.appendChild(tituloDiv);

    // Datos del solicitante
    const solicitanteDni = sessionStorage.getItem("solicitante_dni");
    const solicitanteNombre = sessionStorage.getItem("solicitante_nombre");
    if (solicitanteDni && solicitanteNombre) {
      const solicitanteDiv = document.createElement("div");
      solicitanteDiv.style.background = "#e8fff6";
      solicitanteDiv.style.borderRadius = "18px";
      solicitanteDiv.style.padding = "10px 24px";
      solicitanteDiv.style.margin = "0 0 18px 0";
      solicitanteDiv.style.fontWeight = "bold";
      solicitanteDiv.style.fontSize = "15px";
      solicitanteDiv.style.color = "#222";
      solicitanteDiv.style.display = "flex";
      solicitanteDiv.style.flexDirection = "column";
      solicitanteDiv.style.alignItems = "flex-start";
      solicitanteDiv.style.width = "320px";
      solicitanteDiv.style.maxWidth = "320px";
      solicitanteDiv.style.boxSizing = "border-box";
      solicitanteDiv.style.alignSelf = "center";
      solicitanteDiv.innerHTML = `
        <span style="font-size:13px;color:#28D89E;">Solicitante</span>
        <span>${solicitanteNombre}</span>
        <span style="font-weight:400;font-size:13px;">DNI/CUIT: ${solicitanteDni}</span>
      `;
      tempDiv.appendChild(solicitanteDiv);
    }

    // Helper para clonar y mantener estilos visuales y alineación
    function cloneStyled(node, extraStyles = {}) {
      const clone = node.cloneNode(true);
      clone.className = "";
      clone.style.background = "#e8fff6"; // Igual que solicitante
      clone.style.borderRadius = "18px";
      clone.style.padding = "14px 24px";
      clone.style.margin = "0 0 18px 0";
      clone.style.fontWeight = "bold";
      clone.style.fontSize = "15px";
      clone.style.color = "#222";
      clone.style.display = "flex";
      clone.style.flexDirection = "column";
      clone.style.alignItems = "flex-start";
      clone.style.width = "320px";
      clone.style.maxWidth = "320px";
      clone.style.boxSizing = "border-box";
      clone.style.alignSelf = "center";
      Object.assign(clone.style, extraStyles);

      // Clonar y limpiar los textos
      const details = clone.querySelector(".vehicle-details");
      let detailsClone = null;
      if (details) {
        detailsClone = details.cloneNode(true);
        detailsClone.style.display = "flex";
        detailsClone.style.flexDirection = "column";
        detailsClone.style.width = "100%";
        detailsClone.style.boxSizing = "border-box";
        detailsClone.style.alignItems = "flex-start";
        detailsClone.style.justifyContent = "center";
        detailsClone.style.gap = "0";
        detailsClone.querySelectorAll("h3, p").forEach((el) => {
          el.style.margin = "0";
          el.style.padding = "0";
          el.style.textAlign = "left";
          el.style.color = "#222";
          el.style.wordBreak = "break-word"; // <-- Agrega esto
          el.style.whiteSpace = "normal"; // <-- Y esto
          el.style.overflowWrap = "break-word"; // <-- Y esto
        });
        const h3 = detailsClone.querySelector("h3");
        if (h3) {
          h3.style.fontSize = "11px";
          h3.style.fontWeight = "bold";
          h3.style.letterSpacing = "0.5px";
        }
        const ps = detailsClone.querySelectorAll("p");
        if (ps[0]) {
          ps[0].style.fontSize = "11px";
          ps[0].style.fontWeight = "bold";
        }
        if (ps[1]) {
          ps[1].style.fontSize = "11px";
          ps[1].style.fontWeight = "400";
        }
      }

      // Limpiar el contenido y agregar detalles alineados
      clone.innerHTML = "";
      if (detailsClone) clone.appendChild(detailsClone);

      return clone;
    }

    function cloneSummaryStyled(node) {
      const clone = node.cloneNode(true);
      clone.className = "";
      clone.style.background = "#fff";
      clone.style.border = "none";
      clone.style.margin = "0 0 18px 0";
      clone.style.padding = "0";
      clone.style.width = "320px";
      clone.style.boxSizing = "border-box";
      clone.style.display = "flex";
      clone.style.flexDirection = "column";
      clone.style.alignItems = "center";
      clone.style.justifyContent = "center";
      clone.style.borderRadius = "28px";
      clone.style.minHeight = "90px";
      clone.style.position = "relative";
      clone.style.boxShadow = "0 2px 12px 0 rgba(40,216,158,0.07)";

      // Título
      const title = clone.querySelector(".custom-summary-title");
      if (title) {
        title.style.fontSize = "16px";
        title.style.fontWeight = "bold";
        title.style.color = "#222";
        title.style.margin = "14px 0 0 24px";
        title.style.textAlign = "center";
        title.style.alignSelf = "center";
        title.style.padding = "0px 0px";
      }

      // --- BLOQUE DESTACADO: Monto neto a financiar ---
      // Tomar el valor del DOM original, no del clon
      const amountValue =
        document.getElementById("custom-summary-amount-step4")?.textContent ||
        "";
      const currencyValue =
        document.querySelector("#step-4 .custom-summary-currency")
          ?.textContent || "$";

      if (
        amountValue &&
        amountValue !== "0" &&
        amountValue !== "Vehículo no financiable"
      ) {
        const amountBlock = document.createElement("div");
        amountBlock.style.display = "flex";
        amountBlock.style.alignItems = "center";
        amountBlock.style.justifyContent = "center";
        amountBlock.style.background = "#e8fff6";
        amountBlock.style.border = "1.5px solid #28D89E";
        amountBlock.style.borderRadius = "12px";
        amountBlock.style.fontWeight = "bold";
        amountBlock.style.fontSize = "22px";
        amountBlock.style.color = "#28D89E";
        amountBlock.style.margin = "14px 0 0 24px";
        amountBlock.style.padding = "8px 24px";
        amountBlock.style.width = "fit-content";
        amountBlock.style.alignSelf = "center";
        amountBlock.style.gap = "6px";

        // Crear los spans manualmente
        const currencySpan = document.createElement("span");
        currencySpan.textContent = currencyValue;
        currencySpan.style.fontSize = "22px";
        currencySpan.style.fontWeight = "bold";
        currencySpan.style.color = "#28D89E";
        currencySpan.style.margin = "0";
        currencySpan.style.display = "inline-block";

        const amountSpan = document.createElement("span");
        amountSpan.textContent = amountValue;
        amountSpan.style.fontSize = "22px";
        amountSpan.style.fontWeight = "bold";
        amountSpan.style.color = "#28D89E";
        amountSpan.style.margin = "0 0 0 6px";
        amountSpan.style.textAlign = "center";
        amountSpan.style.display = "inline-block";

        amountBlock.appendChild(currencySpan);
        amountBlock.appendChild(amountSpan);

        // Insertar el bloque después del título
        clone.appendChild(amountBlock);
      }

      // Eliminar cualquier otro monto/currency del clon
      clone
        .querySelectorAll(".custom-summary-amount, .custom-summary-currency")
        .forEach((el) => el.remove());
      const prodTitle = document.createElement("div");
      prodTitle.textContent = "Producto seleccionado";
      prodTitle.style.width = "320px";
      prodTitle.style.maxWidth = "320px";
      prodTitle.style.margin = "14px 0 0 24px";
      prodTitle.style.fontWeight = "bold";
      prodTitle.style.fontSize = "16px";
      prodTitle.style.textAlign = "center";
      prodTitle.style.alignSelf = "center";
      prodTitle.style.padding = "0px 0px";
      clone.appendChild(prodTitle);
      // Producto
      const prod = clone.querySelector(".selected-product");
      if (prod) {
        // Eliminar el producto del clon para evitar duplicados
        prod.remove();
        // Crear un bloque para el producto alineado al centro
        const prodBlock = document.createElement("div");
        prodBlock.style.display = "flex";
        prodBlock.style.alignItems = "center";
        prodBlock.style.justifyContent = "center";
        prodBlock.style.background = "#e8fff6";
        prodBlock.style.color = "#28D89E";
        prodBlock.style.border = "1.5px solid #28D89E";
        prodBlock.style.borderRadius = "12px";
        prodBlock.style.fontWeight = "bold";
        prodBlock.style.fontSize = "15px";
        prodBlock.style.padding = "8px 24px";
        prodBlock.style.margin = "14px 0 0 24px";
        prodBlock.style.width = "fit-content";
        prodBlock.style.alignSelf = "center";
        prodBlock.style.textAlign = "center";
        prodBlock.textContent = prod.textContent;
        clone.appendChild(prodBlock);
      }
      return clone;
    }
    // Clonar los elementos con estilos fieles al diseño original y alineados
    if (vehicleSummary) tempDiv.appendChild(cloneStyled(vehicleSummary));
    if (customSummary) tempDiv.appendChild(cloneSummaryStyled(customSummary));

    // --- Mostrar todas las cuotas ---
    if (cuotaItems.length > 0) {
      const cuotasDiv = document.createElement("div");
      cuotasDiv.style.display = "flex";
      cuotasDiv.style.flexDirection = "column";
      cuotasDiv.style.width = "320px";
      cuotasDiv.style.maxWidth = "320px";
      cuotasDiv.style.margin = "12px 0 0 0"; // <-- Solo margen superior, sin auto
      cuotasDiv.style.alignItems = "flex-start"; // <-- Alinea los hijos a la izquierda

      cuotaItems.forEach((item) => {
        const clone = item.cloneNode(true);
        // Copiar la clase 'selected' si corresponde
        if (item.classList.contains("selected")) {
          clone.classList.add("selected");
        }
        clone.style.margin = "12px 0 0 0";
        clone.style.background = "#e8fff6";
        clone.style.border = "2px solid #28D89E";
        clone.style.borderRadius = "16px";
        clone.style.width = "90%";
        clone.style.display = "flex";
        clone.style.justifyContent = "space-between";
        clone.style.alignItems = "center";
        clone.style.padding = "3px 18px";
        clone.style.fontWeight = "bold";
        clone.style.fontSize = "18px";
        // Si es la seleccionada, remarcar
        if (item === cuotaSeleccionada) {
          clone.style.background = "#28D89E";
          clone.style.color = "#fff";
          clone.style.border = "3px solid #222";
          clone.style.boxShadow = "0 0 8px #28D89E";
          const valueClone = clone.querySelector(".scrollable-value");
          if (valueClone) {
            valueClone.style.color = "#fff";
            valueClone.style.fontWeight = "bold";
          }
        }
        // Copiar el valor de la cuota (por si no se actualizó)
        const valueOriginal = item.querySelector(".scrollable-value");
        const valueClone = clone.querySelector(".scrollable-value");
        if (valueOriginal && valueClone) {
          valueClone.innerHTML = valueOriginal.innerHTML;
        }
        cuotasDiv.appendChild(clone);
      });
      tempDiv.appendChild(cuotasDiv);
    }

    // Insertar el contenedor temporal en el body (fuera de pantalla)
    tempDiv.style.position = "fixed";
    tempDiv.style.left = "-9999px";
    document.body.appendChild(tempDiv);

    // --- Agregar leyenda de uso particular si corresponde ---
    const leyendaStep4Desktop = document.getElementById(
      "leyenda-uso-particular-step4"
    );
    const leyendaStep4Mobile = document.getElementById(
      "leyenda-uso-particular-mobile-step4"
    );
    let leyendaVisible = null;
    if (leyendaStep4Desktop && leyendaStep4Desktop.style.display !== "none") {
      leyendaVisible = leyendaStep4Desktop;
    } else if (
      leyendaStep4Mobile &&
      leyendaStep4Mobile.style.display !== "none"
    ) {
      leyendaVisible = leyendaStep4Mobile;
    }
    if (leyendaVisible) {
      const leyendaClone = leyendaVisible.cloneNode(true);
      leyendaClone.style.display = "block";
      leyendaClone.style.margin = "18px auto 0 auto";
      leyendaClone.style.fontSize = "18px";
      leyendaClone.style.fontWeight = "bold";
      leyendaClone.style.color = "#d00";
      leyendaClone.style.background = "#fff";
      leyendaClone.style.borderRadius = "8px";
      leyendaClone.style.padding = "6px 0";
      leyendaClone.style.width = "320px";
      leyendaClone.style.textAlign = "center";
      tempDiv.appendChild(leyendaClone);
    }
    // Esperar a que las imágenes base64 estén cargadas antes de capturar
    await Promise.all(
      Array.from(tempDiv.querySelectorAll("img")).map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) resolve();
            else img.onload = resolve;
          })
      )
    );

    try {
      // Renderizar a imagen con html2canvas
      const canvas = await html2canvas(tempDiv, {
        backgroundColor: "#fff",
        scale: 2,
      });
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );

      // Web Share API con imagen
      if (
        navigator.canShare &&
        navigator.canShare({
          files: [new File([blob], "cotizacion.png", { type: "image/png" })],
        })
      ) {
        const file = new File([blob], "cotizacion.png", {
          type: "image/png",
        });
        await navigator.share({
          title: "Cotización Lever",
          text: "Te comparto mi cotización de Lever.",
          files: [file],
        });
      } else {
        // Fallback: descargar la imagen
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "cotizacion-lever.png";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        alert(
          "Tu navegador no soporta compartir imágenes. Se descargó la imagen."
        );
      }
    } catch (err) {
      alert("No se pudo compartir la imagen.");
      console.error(err);
    } finally {
      // Limpiar el DOM
      tempDiv.remove();
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  // Loader helpers
  function showLoaderSmiley() {
    const loader = document.getElementById("loader-smiley");
    if (loader) loader.style.display = "flex";
  }
  function hideLoaderSmiley() {
    const loader = document.getElementById("loader-smiley");
    if (loader) loader.style.display = "none";
  }

  // --- NUEVO: Vincular InfoExperto en pantalla 1 ---
  const switchInput = document.querySelector(".toggle-switch input");
  const dniInput = document.querySelector(".dni-input");
  const profileName = document.querySelector(".profile-name");
  const dropdownContent = document.querySelector(".dropdown-content");
  const searchIcon = document.querySelector(".search-icon-container");

  // Helper para saber si está en modo CUIT o DNI
  function isCuitMode() {
    return switchInput.checked;
  }

  // Lógica para consultar InfoExperto al hacer click en la lupa o presionar Enter
  async function consultarInfoExperto() {
    const valor = dniInput.value.trim();
    if (!valor) return;

    profileName.textContent = "Buscando...";

    const loader = document.getElementById("loader-smiley");
    if (loader) loader.style.display = "flex";

    let body = { infoexperto: true };
    if (isCuitMode()) {
      body.cuit = valor;
      body.tipo = "normal";
    } else {
      body.dni = valor;
      body.tipo = "normal";
    }

    try {
      console.log("Enviando consulta a InfoExperto con body:", body);
      const res = await fetch("php/curl.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      // El nombre completo puede estar en:
      // data.data.informe.identidad.nombre_completo
      // o en data.data.informe.identidad.nombreCompleto
      // o en data.data.informe.identidad.nombre
      // o en data.data.informe.identidad.razonSocial (si es empresa)
      // o en data.data.informe.identidad.razon_social

      let nombre = null;
      if (
        data &&
        data.data &&
        data.data.informe &&
        data.data.informe.identidad
      ) {
        const identidad = data.data.informe.identidad;
        nombre =
          identidad.nombre_completo ||
          identidad.nombreCompleto ||
          identidad.nombre ||
          identidad.razonSocial ||
          identidad.razon_social ||
          null;
      }

      // Si no hay nombre, buscar en data.data.informe.razon_social (algunos casos)
      if (!nombre && data.data && data.data.informe) {
        nombre =
          data.data.informe.razon_social ||
          data.data.informe.razonSocial ||
          null;
      }

      // Si sigue sin haber nombre, buscar en data.data.razon_social
      if (!nombre && data.data) {
        nombre = data.data.razon_social || data.data.razonSocial || null;
      }

      // Si sigue sin haber nombre, buscar en data.message (algunos errores)
      if (!nombre && data.message) {
        nombre = data.message;
      }

      if (nombre && typeof nombre === "string" && nombre.trim() !== "") {
        // Detectar el mensaje de menor de edad y reemplazarlo
        if (
          nombre.includes(
            "No es posible solicitar este informe debido a que la persona en cuestión es menor de edad"
          )
        ) {
          profileName.textContent = "El DNI ingresado es Menor de edad.";
        } else {
          profileName.textContent = nombre;
        }
      } else {
        profileName.textContent = "No encontrado";
      }

      if (loader) loader.style.display = "none";

      // --- NUEVO: Obtener datos de BCRA ---
      let bcraDatos = [];
      if (
        data &&
        data.data &&
        data.data.informe &&
        data.data.informe.bcra &&
        Array.isArray(data.data.informe.bcra.datos)
      ) {
        bcraDatos = data.data.informe.bcra.datos;
      }
      // Mostrar por consola el array de datos BCRA (esto SIEMPRE se ejecuta)
      console.log("Datos BCRA:", bcraDatos);

      // --- REGLA PARA credit-indicator ---
      const indicator = document.querySelector(".credit-indicator");
      const tituloVerde = document.querySelector(".credit-status-title-verde");
      const tituloAmarillo = document.querySelector(
        ".credit-status-title-amarillo"
      );
      if (indicator) {
        // 1. Buscar el periodo más reciente informado en todas las deudas de todas las entidades
        let maxPeriodo = null;
        bcraDatos.forEach((banco) => {
          if (Array.isArray(banco.deudas)) {
            banco.deudas.forEach((deuda) => {
              const [mes, anio] = (deuda.periodo || "").split("/");
              if (mes && anio) {
                const periodoNum = parseInt(anio + mes.padStart(2, "0"));
                if (!maxPeriodo || periodoNum > maxPeriodo) {
                  maxPeriodo = periodoNum;
                }
              }
            });
          }
        });

        // 2. Para ese periodo, obtener todas las situaciones informadas por todas las entidades
        let situacionesUltimoPeriodo = [];
        bcraDatos.forEach((banco) => {
          if (Array.isArray(banco.deudas)) {
            banco.deudas.forEach((deuda) => {
              const [mes, anio] = (deuda.periodo || "").split("/");
              if (mes && anio) {
                const periodoNum = parseInt(anio + mes.padStart(2, "0"));
                if (
                  periodoNum === maxPeriodo &&
                  typeof deuda.situacion !== "undefined"
                ) {
                  situacionesUltimoPeriodo.push(deuda.situacion);
                }
              }
            });
          }
        });

        // --- REGLA CORREGIDA ---
        // Si NO hay movimientos en el último mes (array vacío), es viable.
        // Si hay movimientos, todas las situaciones deben ser "0", "1" o "-" para ser viable.
        // Si alguna es distinta, es viable con observaciones.
        let periodos = [];
        bcraDatos.forEach((banco) => {
          if (Array.isArray(banco.deudas)) {
            banco.deudas.forEach((deuda) => {
              const [mes, anio] = (deuda.periodo || "").split("/");
              if (mes && anio) {
                const periodoNum = parseInt(anio + mes.padStart(2, "0"));
                periodos.push(periodoNum);
              }
            });
          }
        });
        // Ordenar y tomar los 6 más recientes
        const periodosUnicos = Array.from(new Set(periodos))
          .sort((a, b) => b - a)
          .slice(0, 6);

        // Reunir todas las situaciones de esos 6 meses
        let situacionesUltimos6 = [];
        bcraDatos.forEach((banco) => {
          if (Array.isArray(banco.deudas)) {
            banco.deudas.forEach((deuda) => {
              const [mes, anio] = (deuda.periodo || "").split("/");
              if (mes && anio) {
                const periodoNum = parseInt(anio + mes.padStart(2, "0"));
                if (
                  periodosUnicos.includes(periodoNum) &&
                  typeof deuda.situacion !== "undefined"
                ) {
                  situacionesUltimos6.push(deuda.situacion);
                }
              }
            });
          }
        });

        // Nueva regla de viabilidad
        let esViable = false;
        if (situacionesUltimos6.length === 0) {
          esViable = true;
        } else {
          esViable = situacionesUltimos6.every((s) => s === "0" || s === "1");
        }

        if (esViable) {
          // Situación viable: verde, a la izquierda (default)
          indicator.style.transition =
            "left 0.25s cubic-bezier(0.4,0,0.2,1), border-color 0.25s, background 0.25s";
          indicator.style.left = "0";
          indicator.style.background = "#26BD10";
          indicator.style.border = "1px solid #ECECEC";
          if (tituloVerde) tituloVerde.style.display = "";
          if (tituloAmarillo) tituloAmarillo.style.display = "none";
        } else {
          // Viable con observaciones: amarillo, centrado
          indicator.style.transition =
            "left 0.25s cubic-bezier(0.4,0,0.2,1), border-color 0.25s, background 0.25s";
          indicator.style.left = "50%";
          indicator.style.background = "#FFDF00";
          indicator.style.border = "1px solid #FFDF00";
          if (tituloVerde) tituloVerde.style.display = "none";
          if (tituloAmarillo) tituloAmarillo.style.display = "";
        }
        // ...resto de estilos fijos...
        indicator.style.width = "6px";
        indicator.style.height = "19px";
        indicator.style.borderRadius = "8px";
        indicator.style.position = "absolute";
        indicator.style.top = "-6px";
      }

      // --- TU REGLA PERSONALIZADA AQUÍ ---
      // Por ejemplo:
      // if (bcraDatos.some(banco => banco.deudas.some(deuda => deuda.situacion !== "1"))) {
      //   // ...tu lógica...
      // }
    } catch (err) {
      profileName.textContent = "Error";
      if (loader) loader.style.display = "none";
      console.error("Error consultando InfoExperto:", err);
    } finally {
      if (loader) loader.style.display = "none";
    }
  }

  // Al hacer click en la lupa, mostrar popup y consultar InfoExperto
  if (searchIcon) {
    searchIcon.addEventListener("click", () => {
      showDropdown();
      consultarInfoExperto();
    });
  }

  // Al presionar Enter en el input, consultar InfoExperto y mostrar popup
  if (dniInput) {
    dniInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        showDropdown();
        consultarInfoExperto();
      }
    });
  }

  // Si cambia el switch, limpiar el campo y el nombre
  switchInput.addEventListener("change", () => {
    dniInput.value = "";
    profileName.textContent = "";
  });
});

document.addEventListener("DOMContentLoaded", () => {
  // Menú hamburguesa robusto para cualquier página
  const hamburguer = document.getElementById("hamburguer-menu");
  const menu = document.getElementById("menu");
  const overlay = document.getElementById("menu-overlay");
  const closeBtn = document.getElementById("close-menu");

  if (!hamburguer || !menu || !overlay) return;

  function openMenu() {
    menu.classList.remove("hidden");
    menu.classList.add("mobile-active");
    overlay.classList.add("active");
    document.body.classList.add("menu-open");
  }
  function closeMenu() {
    menu.classList.add("hidden");
    menu.classList.remove("mobile-active");
    overlay.classList.remove("active");
    document.body.classList.remove("menu-open");
  }

  hamburguer.addEventListener("click", function (e) {
    e.preventDefault();
    if (menu.classList.contains("mobile-active")) closeMenu();
    else openMenu();
  });

  overlay.addEventListener("click", closeMenu);

  // Cerrar menú al hacer click en cualquier link del menú
  menu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeMenu);
  });

  // Cerrar menú con la cruz
  if (closeBtn) {
    closeBtn.addEventListener("click", function (e) {
      e.preventDefault();
      closeMenu();
    });
  }

  // Cerrar menú con ESC
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMenu();
  });
});

//seccion nosotros-cotizar videos

document.addEventListener("DOMContentLoaded", function () {
  // ODOMETER para #nosotros-cotizar
  setTimeout(function () {
    document
      .querySelectorAll("#nosotros-cotizar .odometer")
      .forEach(function (el) {
        // El valor inicial debe ser distinto al final para que anime
        el.innerHTML = "0";
        setTimeout(function () {
          el.innerHTML = el.getAttribute("data-value");
        }, 300);
      });
  }, 200);

  // VIDEO MODAL para #nosotros-cotizar
  const videos = [
    "https://www.youtube.com/embed/VIDEO_ID_1",
    "https://www.youtube.com/embed/VIDEO_ID_2",
    "https://www.youtube.com/embed/VIDEO_ID_3",
  ];
  // Reemplaza VIDEO_ID_X por los IDs reales si los tienes

  let currentVideo = 0;
  const videoThumbs = document.querySelectorAll(
    "#nosotros-cotizar .video_thumb"
  );
  const videoWrap = document.getElementById("videowrap-cotizar");
  const videoIframe = document.getElementById("video-cotizar");
  const prevBtn = document.getElementById("prev-video-cotizar");
  const nextBtn = document.getElementById("next-video-cotizar");
  function showVideo(idx) {
    videoIframe.src = videos[idx] + "?autoplay=1";
    videoWrap.classList.add("playing");
    currentVideo = idx;
  }
  videoThumbs.forEach(function (thumb, idx) {
    thumb.addEventListener("click", function (e) {
      e.preventDefault();
      showVideo(idx);
    });
  });
  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      if (currentVideo > 0) showVideo(currentVideo - 1);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      if (currentVideo < videos.length - 1) showVideo(currentVideo + 1);
    });
  }
  if (videoWrap && videoIframe) {
    const closeBox = videoWrap.querySelector(".closebox");
    if (closeBox) {
      closeBox.addEventListener("click", function () {
        videoWrap.classList.remove("playing");
        videoIframe.src = "";
      });
    }
  }
});

document.addEventListener("DOMContentLoaded", function () {
  // Mostrar la sección nosotros-cotizar al clickear en el menú
  document.querySelectorAll('a[data-url="#nosotros"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      // Oculta todas las secciones principales
      document.querySelectorAll("main > section").forEach(function (sec) {
        sec.classList.add("hidden");
      });
      // Muestra la sección nosotros-cotizar
      document.getElementById("nosotros-cotizar").classList.remove("hidden");
      document.body.classList.add("nosotros-cotizar-activo");
      window.scrollTo(0, 0);
    });
  });

  document
    .querySelectorAll('a[data-url="#inicio"], a[data-url="#contacto"]')
    .forEach(function (link) {
      link.addEventListener("click", function () {
        document.body.classList.remove("nosotros-cotizar-activo");
      });
    });
});

document.addEventListener("DOMContentLoaded", () => {
  const dniInput = document.querySelector(".dni-input");
  const searchIcon = document.querySelector(".search-icon-container");

  // --- Validación para habilitar/deshabilitar el botón de buscar
  function updateSearchIconState() {
    const dni = dniInput || document.querySelector(".dni-input");
    const search =
      searchIcon || document.querySelector(".search-icon-container");
    if (!dni || !search) return;
    if (dni.value.trim() === "") {
      search.classList.add("disabled");
      search.style.pointerEvents = "none";
      search.style.opacity = "0.5";
    } else {
      search.classList.remove("disabled");
      search.style.pointerEvents = "auto";
      search.style.opacity = "1";
    }
  }

  // Inicializa correctamente el estado al cargar
  updateSearchIconState();

  // Habilita/deshabilita en cada cambio de input
  if (dniInput) {
    dniInput.addEventListener("input", updateSearchIconState);
  }

  // Si el campo se limpia por cambio de switch, también deshabilita el botón
  const switchInput = document.querySelector(".toggle-switch input");
  if (switchInput) {
    switchInput.addEventListener("change", () => {
      if (dniInput) dniInput.value = "";
      updateSearchIconState();
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  // Función para mostrar/ocultar el switch-container en desktop

  // --- FUNCIÓN GLOBAL PARA LIMPIAR FORMULARIO DE PANTALLA 1 ---
  function limpiarFormularioPantalla1() {
    // Limpiar campo DNI/CUIT
    const dniInput = document.querySelector(".dni-input");
    if (dniInput) {
      dniInput.value = "";
    }

    // Restaurar switch a PERSONA (posición izquierda/default)
    const switchInput = document.querySelector(".toggle-switch input");
    if (switchInput && switchInput.checked) {
      switchInput.checked = false;
      // Llamar a la función existente que actualiza los labels y el placeholder
      if (typeof updateSwitchLabels === "function") {
        updateSwitchLabels();
      }
    }

    // Limpiar nombre del perfil
    const profileName = document.querySelector(".profile-name");
    if (profileName) {
      profileName.textContent = "";
    }

    // Ocultar el dropdown si está visible
    const dropdownContent = document.querySelector(".dropdown-content");
    if (dropdownContent && !dropdownContent.classList.contains("hidden")) {
      hideDropdown();
    }

    // Restaurar el indicador crediticio a su estado predeterminado (verde/viable)
    const indicator = document.querySelector(".credit-indicator");
    if (indicator) {
      indicator.style.transition =
        "left 0.25s cubic-bezier(0.4,0,0.2,1), border-color 0.25s, background 0.25s";
      indicator.style.left = "0";
      indicator.style.background = "#26BD10";
      indicator.style.border = "1px solid #ECECEC";
      indicator.style.width = "6px";
      indicator.style.height = "19px";
      indicator.style.borderRadius = "8px";
      indicator.style.position = "absolute";
      indicator.style.top = "-6px";
    }

    // Mostrar título "VIABLE" y ocultar "VIABLE CON OBSERVACIONES"
    const tituloVerde = document.querySelector(".credit-status-title-verde");
    const tituloAmarillo = document.querySelector(
      ".credit-status-title-amarillo"
    );
    if (tituloVerde) tituloVerde.style.display = "";
    if (tituloAmarillo) tituloAmarillo.style.display = "none";

    // Deshabilitar el botón de búsqueda (lupa)
    const searchIcon = document.querySelector(".search-icon-container");
    if (searchIcon) {
      searchIcon.classList.add("disabled");
      searchIcon.style.pointerEvents = "none";
      searchIcon.style.opacity = "0.5";
    }

    // Limpiar datos almacenados en sessionStorage
    sessionStorage.removeItem("solicitante_dni");
    sessionStorage.removeItem("solicitante_nombre");

    console.log("Formulario de pantalla 1 limpiado correctamente");
  }

  function updateSwitchVisibility() {
    const dniContainer = document.querySelector("#step-1 .dni-container");
    const switchContainer = document.querySelector("#step-1 .switch-container");
    if (!dniContainer || !switchContainer) return;

    if (dniContainer.classList.contains("expanded")) {
      // Ocultar el switch-container si el dni-container está expandido

      switchContainer.style.display = "none";
    } else {
      // Mostrar el switch-container en todos los casos, excepto cuando está expandido
      switchContainer.style.display = "flex";
    }
  }

  // Llama a la función al cargar la página
  updateSwitchVisibility();

  // Llama a la función al cambiar el tamaño de la ventana
  window.addEventListener("resize", updateSwitchVisibility);

  // Engancha la lógica en showDropdown y hideDropdown
  const originalShowDropdown = window.showDropdown;
  window.showDropdown = function () {
    if (typeof originalShowDropdown === "function") originalShowDropdown();
    updateSwitchVisibility();
  };

  const originalHideDropdown = window.hideDropdown;
  window.hideDropdown = function () {
    if (typeof originalHideDropdown === "function") originalHideDropdown();
    updateSwitchVisibility();
  };
});

// Función global para mostrar la sección nosotros-cotizar desde el botón
function mostrarNosotrosCotizar() {
  // Oculta todas las secciones principales
  document.querySelectorAll("main > section").forEach(function (sec) {
    sec.classList.add("hidden");
  });
  // Oculta todos los pasos (por si están visibles)
  document.querySelectorAll(".step").forEach(function (step) {
    step.classList.add("hidden");
  });
  // Muestra la sección nosotros-cotizar SOLO si existe
  var nosotrosSection = document.getElementById("nosotros-cotizar");
  if (nosotrosSection) {
    nosotrosSection.classList.remove("hidden");
    document.body.classList.add("nosotros-cotizar-activo");
    window.scrollTo(0, 0);
  } else {
    // Opcional: redirigir a nosotros.html si no existe la sección
    window.location.href = "nosotrosNew.html";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Referencias necesarias
  const dniInput = document.querySelector(".dni-input");
  const indicator = document.querySelector(".credit-indicator");
  const changeApplicantBtn = document.querySelector(".change-applicant-button");
  if (changeApplicantBtn) {
    changeApplicantBtn.addEventListener("click", () => {
      limpiarDatosSolicitante(); // <--- AGREGAR AQUÍ
      // ...resto de tu lógica...
    });
  }
  const switchInput = document.querySelector(".toggle-switch input");
  const profileName = document.querySelector(".profile-name");
  const searchIcon = document.querySelector(".search-icon-container");

  if (changeApplicantBtn) {
    changeApplicantBtn.addEventListener("click", () => {
      // Limpiar el campo de DNI/CUIT
      if (dniInput) dniInput.value = "";

      // Restaurar el switch a PERSONA (izquierda)
      if (switchInput) {
        switchInput.checked = false;
        updateSwitchLabels();
      }

      // Restaurar el placeholder del campo
      if (dniInput) dniInput.placeholder = "DNI del solicitante";

      // Limpiar el nombre del perfil
      if (profileName) profileName.textContent = "";

      // Bloquear la lupa de buscar si el campo está vacío
      if (searchIcon) {
        searchIcon.classList.add("disabled");
        searchIcon.style.pointerEvents = "none";
        searchIcon.style.opacity = "0.5";
      }

      // Restaurar el indicador a su posición y color por defecto
      if (indicator) {
        indicator.style.left = "0";
        indicator.style.background = "#26BD10";
        indicator.style.border = "1px solid #ECECEC";
        indicator.style.width = "6px";
        indicator.style.height = "19px";
        indicator.style.borderRadius = "8px";
        indicator.style.position = "absolute";
        indicator.style.top = "-6px";
      }
    });
  }
});

// MODAL SELECCIÓN DE PERSONA POR DNI
function mostrarModalPersonasDNI(personas, onSelect) {
  console.log("mostrarModalPersonasDNI llamado con:", personas);
  const modal = document.getElementById("modal-personas-dni");
  const list = document.getElementById("modal-personas-list");
  if (!modal || !list) {
    console.error("No se encontró el modal o la lista para personas por DNI");
    return;
  }
  list.innerHTML = "";
  personas.forEach((persona, idx) => {
    const btn = document.createElement("button");
    btn.className = "client-select-btn";
    btn.textContent =
      persona.nombreCompleto ||
      persona.nombre ||
      persona.razonSocial ||
      persona.razon_social ||
      "Sin nombre";
    btn.onclick = async function () {
      console.log("Persona seleccionada en modal:", persona);
      modal.classList.add("hidden");
      modal.style.display = "none";
      document.body.classList.remove("modal-open"); // <--- Restaurar scroll al cerrar modal
      // --- Nueva lógica: consulta directa a InfoExperto para ese perfil ---
      const dniInput = document.querySelector(".dni-input");
      const switchInput = document.querySelector(".toggle-switch input");
      let valor = "";
      let esCuit = false;
      if (persona.cuit) {
        valor = persona.cuit;
        esCuit = true;
      } else if (persona.dni || persona.numero_documento) {
        valor = persona.dni || persona.numero_documento;
        esCuit = false;
      }
      if (dniInput && switchInput) {
        if (esCuit && !switchInput.checked) {
          switchInput.checked = true;
          updateSwitchLabels();
        }
        if (!esCuit && switchInput.checked) {
          switchInput.checked = false;
          updateSwitchLabels();
        }
        dniInput.value = valor;
      }
      // Mostrar loader
      const loader = document.getElementById("loader-smiley");
      if (loader) loader.style.display = "flex";
      // Llamar a InfoExperto SOLO para esa persona (por cuit o dni)
      let body = { infoexperto: true };
      if (esCuit) {
        body.cuit = valor;
        body.tipo = "normal";
      } else {
        body.dni = valor;
        body.tipo = "normal";
      }
      try {
        const profileName = document.querySelector(".profile-name");
        if (profileName) profileName.textContent = "Buscando...";
        const res = await fetch("php/curl.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        // --- Lógica igual a cuando hay una sola persona ---
        let nombre = null;
        if (
          data &&
          data.data &&
          data.data.informe &&
          data.data.informe.identidad
        ) {
          const identidad = data.data.informe.identidad;
          nombre =
            identidad.nombre_completo ||
            identidad.nombreCompleto ||
            identidad.nombre ||
            identidad.razonSocial ||
            identidad.razon_social ||
            null;
        }
        if (!nombre && data.data && data.data.informe) {
          nombre =
            data.data.informe.razon_social ||
            data.data.informe.razonSocial ||
            null;
        }
        if (!nombre && data.data) {
          nombre = data.data.razon_social || data.data.razonSocial || null;
        }
        if (!nombre && data.message) {
          nombre = data.message;
        }
        if (profileName) {
          profileName.textContent =
            nombre && typeof nombre === "string" && nombre.trim() !== ""
              ? nombre
              : "No encontrado";
        }
        if (nombre) sessionStorage.setItem("solicitante_nombre", nombre);
        if (valor) sessionStorage.setItem("solicitante_dni", valor);

        // --- Obtener datos de BCRA y actualizar barra ---
        let bcraDatos = [];
        // --- CORRECCIÓN: buscar SIEMPRE en ambos lugares y loguear el objeto completo ---
        if (
          data &&
          data.data &&
          data.data.informe &&
          data.data.informe.bcra &&
          Array.isArray(data.data.informe.bcra.datos)
        ) {
          bcraDatos = data.data.informe.bcra.datos;
        }
        if (
          (!bcraDatos || bcraDatos.length === 0) &&
          data &&
          data.data &&
          data.data.bcra &&
          Array.isArray(data.data.bcra.datos)
        ) {
          bcraDatos = data.data.bcra.datos;
        }
        // LOG: mostrar el objeto completo de BCRA para debug
        if (data && data.data && data.data.informe && data.data.informe.bcra) {
          console.log(
            "DEBUG BCRA (data.data.informe.bcra):",
            data.data.informe.bcra
          );
        }
        if (data && data.data && data.data.bcra) {
          console.log("DEBUG BCRA (data.data.bcra):", data.data.bcra);
        }
        // Mostrar entidades y situaciones (periodo/situacion/monto)
        console.log("Datos BCRA:", bcraDatos);

        // Si tienes una función para mostrar los movimientos en pantalla, llamala aquí:
        if (typeof actualizarBarraCrediticia === "function") {
          actualizarBarraCrediticia(bcraDatos);
        }
        if (typeof mostrarMovimientosBCRA === "function") {
          mostrarMovimientosBCRA(bcraDatos);
        }

        showDropdown();
      } catch (err) {
        const profileName = document.querySelector(".profile-name");
        if (profileName) profileName.textContent = "Error";
        console.error(
          "Error consultando InfoExperto para persona seleccionada:",
          err
        );
      } finally {
        const loader = document.getElementById("loader-smiley");
        if (loader) loader.style.display = "none";
      }
    };
    list.appendChild(btn);
  });
  modal.classList.remove("hidden");
  modal.style.display = "flex";
  document.body.classList.add("modal-open"); // <--- Bloquear scroll al abrir modal
}

document.addEventListener("DOMContentLoaded", function () {
  const btnCloseModalPersonas = document.getElementById("modal-personas-close");
  if (btnCloseModalPersonas) {
    btnCloseModalPersonas.onclick = function () {
      console.log("Modal de selección de persona cerrado por cancelar");
      const modal = document.getElementById("modal-personas-dni");
      modal.classList.add("hidden");
      modal.style.display = "none"; // Ocultar modal al cerrar
      // --- Restaurar el indicador y el credit-status-title a su estado original automáticamente ---
      const indicator = document.querySelector(".credit-indicator");
      if (indicator) {
        indicator.style.left = "0";
        indicator.style.background = "#26BD10";
        indicator.style.border = "1px solid #ECECEC";
        indicator.style.width = "6px";
        indicator.style.height = "19px";
        indicator.style.borderRadius = "8px";
        indicator.style.position = "absolute";
        indicator.style.top = "-6px";
      }
      // Restaurar los títulos de estado de crédito
      const tituloVerde = document.querySelector(".credit-status-title-verde");
      const tituloAmarillo = document.querySelector(
        ".credit-status-title-amarillo"
      );
      if (tituloVerde) tituloVerde.style.display = "";
      if (tituloAmarillo) tituloAmarillo.style.display = "none";
    };
  }
});

// --- INTEGRAR LA LÓGICA DEL MODAL EN consultarInfoExperto ---
document.addEventListener("DOMContentLoaded", () => {
  // ...existing code...
  const switchInput = document.querySelector(".toggle-switch input");
  const dniInput = document.querySelector(".dni-input");
  const profileName = document.querySelector(".profile-name");
  const dropdownContent = document.querySelector(".dropdown-content");
  const searchIcon = document.querySelector(".search-icon-container");

  // Helper para saber si está en modo CUIT o DNI
  function isCuitMode() {
    return switchInput.checked;
  }

  // Lógica para consultar InfoExperto al hacer click en la lupa o presionar Enter
  async function consultarInfoExperto() {
    const valor = dniInput.value.trim();
    if (!valor) return;

    profileName.textContent = "Buscando...";

    const loader = document.getElementById("loader-smiley");
    if (loader) loader.style.display = "flex";

    let body = { infoexperto: true };
    if (isCuitMode()) {
      body.cuit = valor;
      body.tipo = "normal";
    } else {
      body.dni = valor;
      body.tipo = "normal";
    }

    try {
      console.log("Enviando consulta a InfoExperto con body:", body);
      const res = await fetch("php/curl.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      console.log("Respuesta de InfoExperto:", data);

      // --- DETECTAR VARIAS PERSONAS Y MOSTRAR MODAL ---
      let personas = [];
      // 1. Chequear si data.data.informe.personas existe y tiene más de 1
      if (
        data &&
        data.data &&
        data.data.informe &&
        Array.isArray(data.data.informe.personas) &&
        data.data.informe.personas.length > 1
      ) {
        personas = data.data.informe.personas;
      }
      // 2. Chequear si data.data.datos existe y tiene más de 1 (caso alternativo)
      else if (
        data &&
        data.data &&
        Array.isArray(data.data.datos) &&
        data.data.datos.length > 1
      ) {
        personas = data.data.datos.map((p) => ({
          nombreCompleto:
            p.nombre_completo ||
            p.nombreCompleto ||
            p.nombre ||
            p.razonSocial ||
            p.razon_social ||
            "",
          dni: p.numero_documento || p.dni || "",
          cuit: p.cuit || "",
          ...p,
        }));
      }

      if (personas.length > 1) {
        console.log(
          "Se detectaron varias personas para el mismo DNI (modal):",
          personas
        );
        if (loader) loader.style.display = "none";
        mostrarModalPersonasDNI(personas, function (persona, nombreMostrado) {
          if (profileName) profileName.textContent = nombreMostrado;
          if (persona.dni || persona.numero_documento)
            sessionStorage.setItem(
              "solicitante_dni",
              persona.dni || persona.numero_documento
            );
          if (nombreMostrado)
            sessionStorage.setItem("solicitante_nombre", nombreMostrado);
          showDropdown();
          if (loader) loader.style.display = "none";
        });
        return;
      }

      // Si hay solo una persona, flujo normal
      if (
        data &&
        data.data &&
        data.data.informe &&
        Array.isArray(data.data.informe.personas) &&
        data.data.informe.personas.length === 1
      ) {
        const persona = data.data.informe.personas[0];
        profileName.textContent =
          persona.nombreCompleto ||
          persona.nombre ||
          persona.razonSocial ||
          persona.razon_social ||
          "Sin nombre";
        if (persona.dni) sessionStorage.setItem("solicitante_dni", persona.dni);
        if (profileName.textContent)
          sessionStorage.setItem("solicitante_nombre", profileName.textContent);
        if (loader) loader.style.display = "none";
        // --- SOLO mostrar informe.bcra ---
        if (data && data.data && data.data.informe && data.data.informe.bcra) {
          console.log("informe.bcra:", data.data.informe.bcra);
        }

        if (loader) loader.style.display = "none";

        // Mostrar entidades y situaciones (periodo/situacion/monto)
        let bcraDatos = [];
        if (
          data &&
          data.data &&
          data.data.informe &&
          data.data.informe.bcra &&
          Array.isArray(data.data.informe.bcra.datos)
        ) {
          bcraDatos = data.data.informe.bcra.datos;
        }
        if (Array.isArray(bcraDatos)) {
          bcraDatos.forEach((entidad) => {
            const nombreEntidad =
              entidad.nombre || entidad.entidad || "Entidad desconocida";
            if (Array.isArray(entidad.deudas)) {
              entidad.deudas.forEach((deuda) => {
                if (deuda.periodo && deuda.situacion) {
                  console.log(
                    `[BCRA] Entidad: ${nombreEntidad} | Periodo: ${
                      deuda.periodo
                    } | Situación: ${deuda.situacion} | Monto: ${
                      deuda.monto || "-"
                    }`
                  );
                }
              });
            }
          });
        }
        showDropdown();
        return;
      }
      // Alternativa: si data.data.datos tiene solo una persona
      if (
        data &&
        data.data &&
        Array.isArray(data.data.datos) &&
        data.data.datos.length === 1
      ) {
        const persona = data.data.datos[0];
        const nombreMostrado =
          persona.nombre_completo ||
          persona.nombreCompleto ||
          persona.nombre ||
          persona.razonSocial ||
          persona.razon_social ||
          "Sin nombre";
        profileName.textContent = nombreMostrado;
        if (persona.dni || persona.numero_documento)
          sessionStorage.setItem(
            "solicitante_dni",
            persona.dni || persona.numero_documento
          );
        if (nombreMostrado)
          sessionStorage.setItem("solicitante_nombre", nombreMostrado);
        if (loader) loader.style.display = "none";
        // --- SOLO mostrar informe.bcra si existe ---
        if (data && data.data && data.data.informe && data.data.informe.bcra) {
          console.log("informe.bcra:", data.data.informe.bcra);
        }
        let bcraDatos = [];
        if (
          data &&
          data.data &&
          data.data.informe &&
          data.data.informe.bcra &&
          Array.isArray(data.data.informe.bcra.datos)
        ) {
          bcraDatos = data.data.informe.bcra.datos;
        }
        if (Array.isArray(bcraDatos)) {
          bcraDatos.forEach((entidad) => {
            const nombreEntidad =
              entidad.nombre || entidad.entidad || "Entidad desconocida";
            if (Array.isArray(entidad.deudas)) {
              entidad.deudas.forEach((deuda) => {
                if (deuda.periodo && deuda.situacion) {
                  console.log(
                    `[BCRA] Entidad: ${nombreEntidad} | Periodo: ${
                      deuda.periodo
                    } | Situación: ${deuda.situacion} | Monto: ${
                      deuda.monto || "-"
                    }`
                  );
                }
              });
            }
          });
        }
        showDropdown();
        return;
      }

      // ...existing lógica para mostrar nombre, BCRA, etc...
      // ...NO mostrar el informe completo aquí...
      // ...existing code...
    } catch (err) {
      profileName.textContent = "Error";
      if (loader) loader.style.display = "none";
      console.error("Error consultando InfoExperto:", err);
    } finally {
      if (loader) loader.style.display = "none";
    }
  }

  // Al hacer click en la lupa, mostrar popup y consultar InfoExperto
  if (searchIcon) {
    searchIcon.addEventListener("click", () => {
      showDropdown();
      consultarInfoExperto();
    });
  }

  // Al presionar Enter en el input, consultar InfoExperto y mostrar popup
  if (dniInput) {
    dniInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        showDropdown();
        consultarInfoExperto();
      }
    });
  }

  // Si cambia el switch, limpiar el campo y el nombre
  switchInput.addEventListener("change", () => {
    dniInput.value = "";
    profileName.textContent = "";
  });
});

// --- NUEVO: Resetear pantalla 2 al volver desde el botón BACK de pantalla 3 ---
document.addEventListener("DOMContentLoaded", () => {
  const backBtnStep3 = document.querySelector("#step-3 .back-button");
  if (backBtnStep3) {
    backBtnStep3.addEventListener("click", () => {
      limpiarLeyendaUsoParticular();
      resetearFormulariosPantalla2();
    });
  }
});

// --- NUEVA FUNCIÓN: Validar pantalla 2 y habilitar/deshabilitar botón según corresponda ---
function validarFormularioPantalla2() {
  const nextButton = document.querySelector("#step-2 .next-button");
  if (!nextButton) return;

  // Obtener los valores de los selectores
  const categoriaPlaceholder = document.querySelector(
    "[onclick=\"toggleCustomOptions('categoria-options')\"]"
  );
  const anioPlaceholder = document.querySelector(
    "[onclick=\"toggleCustomOptions('anio-options')\"]"
  );
  const marcaPlaceholder = document.querySelector(
    "[onclick=\"toggleCustomOptions('marca-options')\"]"
  );
  const modeloPlaceholder = document.querySelector(
    "[onclick=\"toggleCustomOptions('modelo-options')\"]"
  );

  // Verificar si todos tienen valores seleccionados (no son el texto por defecto)
  const categoriaSelected =
    categoriaPlaceholder &&
    (categoriaPlaceholder.dataset.value ||
      categoriaPlaceholder.textContent.trim() !== "Categoría");
  const anioSelected =
    anioPlaceholder &&
    (anioPlaceholder.dataset.value ||
      anioPlaceholder.textContent.trim() !== "Año");
  const marcaSelected =
    marcaPlaceholder &&
    (marcaPlaceholder.dataset.value ||
      marcaPlaceholder.textContent.trim() !== "Marca");
  const modeloSelected =
    modeloPlaceholder &&
    modeloPlaceholder.dataset.value &&
    modeloPlaceholder.textContent.trim() !== "Modelo" &&
    modeloPlaceholder.textContent.trim() !== "No hay modelos disponibles";

  const formCompleto =
    categoriaSelected && anioSelected && marcaSelected && modeloSelected;

  // Habilitar o deshabilitar botón según corresponda
  if (formCompleto) {
    nextButton.disabled = false;
    nextButton.style.opacity = "1";
    nextButton.style.pointerEvents = "auto";
    nextButton.style.cursor = "pointer";
  } else {
    nextButton.disabled = true;
    nextButton.style.opacity = "0.5";
    nextButton.style.pointerEvents = "none";
    nextButton.style.cursor = "not-allowed";
  }

  return formCompleto;
}

// Inicializar la validación en cada paso relevante
document.addEventListener("DOMContentLoaded", () => {
  // 1. Deshabilitar botón al entrar a paso 2
  const step1Button = document.querySelector("#step-1 .next-button");
  if (step1Button) {
    const originalOnClick = step1Button.onclick;
    step1Button.onclick = function (e) {
      if (typeof originalOnClick === "function") {
        originalOnClick.call(this, e);
      }
      // Después de ir al paso 2, ejecutar la validación
      setTimeout(validarFormularioPantalla2, 50);
    };
  }

  // 2. Actualizar estado del botón cuando se selecciona una opción
  const optionContainers = [
    "categoria-options",
    "anio-options",
    "marca-options",
    "modelo-options",
  ];

  optionContainers.forEach((containerId) => {
    const container = document.getElementById(containerId);
    if (container) {
      container.addEventListener("click", function (e) {
        if (e.target.classList.contains("custom-option")) {
          // Usar setTimeout para dar tiempo a que se actualicen los datos
          setTimeout(validarFormularioPantalla2, 50);
        }
      });
    }
  });

  // 3. Agregar validación al resetear formularios de pantalla 2
  const originalResetearFormularios = window.resetearFormulariosPantalla2;
  if (typeof originalResetearFormularios === "function") {
    window.resetearFormulariosPantalla2 = function () {
      originalResetearFormularios.apply(this, arguments);
      setTimeout(validarFormularioPantalla2, 50);
    };
  }

  // 4. Integrar con la función goToStep existente
  const originalGoToStep = window.goToStep;
  if (typeof originalGoToStep === "function") {
    window.goToStep = function (step) {
      originalGoToStep.apply(this, arguments);
      if (step === 2) {
        setTimeout(validarFormularioPantalla2, 50);
      }
    };
  }
});

// Ampliar la función selectCustomOption para validar después de seleccionar
const originalSelectCustomOption = window.selectCustomOption;
if (typeof originalSelectCustomOption === "function") {
  window.selectCustomOption = function () {
    originalSelectCustomOption.apply(this, arguments);
    // Si estamos en el paso 2, validar el formulario
    if (document.getElementById("step-2").classList.contains("active")) {
      setTimeout(validarFormularioPantalla2, 50);
    }
  };
}

// --- NUEVO: Resetear selects dependientes al cambiar la categoría ---
document.addEventListener("DOMContentLoaded", () => {
  const categoriaOptions = document.getElementById("categoria-options");
  const anioOptions = document.getElementById("anio-options");

  if (categoriaOptions && anioOptions) {
    categoriaOptions.addEventListener("click", (event) => {
      if (event.target.classList.contains("custom-option")) {
        // --- NUEVO: Limpiar accessToken al cambiar de categoría ---
        accessToken = null;

        // Resetear placeholders y valores de selects dependientes
        const anioPlaceholder = document.querySelector(
          "[onclick=\"toggleCustomOptions('anio-options')\"]"
        );
        const marcaPlaceholder = document.querySelector(
          "[onclick=\"toggleCustomOptions('marca-options')\"]"
        );
        const modeloPlaceholder = document.querySelector(
          "[onclick=\"toggleCustomOptions('modelo-options')\"]"
        );
        if (anioPlaceholder) {
          anioPlaceholder.textContent = "Año";
          anioPlaceholder.dataset.value = "";
          anioPlaceholder.classList.remove("selected-bold");
        }
        if (marcaPlaceholder) {
          marcaPlaceholder.textContent = "Marca";
          marcaPlaceholder.dataset.value = "";
          marcaPlaceholder.classList.remove("selected-bold");
        }
        if (modeloPlaceholder) {
          modeloPlaceholder.textContent = "Modelo";
          modeloPlaceholder.dataset.value = "";
          modeloPlaceholder.classList.remove("selected-bold");
        }

        // Limpiar opciones de selects dependientes (dejar solo el buscador si existe)
        const marcaOptions = document.getElementById("marca-options");
        if (marcaOptions) {
          const search = marcaOptions.querySelector(".custom-search-container");
          marcaOptions.innerHTML = "";
          if (search) marcaOptions.appendChild(search);
        }
        const modeloOptions = document.getElementById("modelo-options");
        if (modeloOptions) {
          const search = modeloOptions.querySelector(
            ".custom-search-container"
          );
          modeloOptions.innerHTML = "";
          if (search) modeloOptions.appendChild(search);
        }

        // Limpiar logo del vehículo si existe
        const logo = document.getElementById("vehicle-logo");
        if (logo) {
          logo.src = "";
          logo.alt = "Logo de la marca";
        }

        // Mostrar solo los últimos 6 años si la categoría es "Motos"
        // === REGLAS DE AÑOS SEGÚN CATEGORÍA ===
        const categoriaTexto = event.target.textContent.trim().toLowerCase();
        const anioOptions = document.getElementById("anio-options");
        if (anioOptions) {
          anioOptions.innerHTML = "";
          let desde, hasta;
          const currentYear = new Date().getFullYear();

          if (categoriaTexto === "motos") {
            desde = 2020;
            hasta = currentYear;
          } else if (categoriaTexto.includes("utilitario")) {
            desde = 2012;
            hasta = currentYear;
          } else if (
            categoriaTexto === "autos y pickups" ||
            categoriaTexto === "autos" ||
            categoriaTexto === "pickups"
          ) {
            desde = 2010;
            hasta = currentYear;
          } else if (categoriaTexto === "camiones") {
            desde = 2010;
            hasta = currentYear;
          } else {
            // Por defecto, mostrar todos los años
            desde = 2010;
            hasta = currentYear;
          }

          for (let year = hasta; year >= desde; year--) {
            const option = document.createElement("div");
            option.className = "custom-option";
            option.textContent = year;
            option.onclick = function () {
              selectCustomOption(year, "anio-options", year);
            };
            anioOptions.appendChild(option);
          }
        }

        // Actualizar productos y habilitar select productos
        const categoria =
          event.target.dataset.value ||
          event.target.textContent.trim().toLowerCase();
        actualizarProductosPorCategoria(categoria);
        habilitarSelectProductos();
      }
    });
  }
});
function mostrarLeyendaUsoParticular() {
  const categoria = getSelectedCategoria();
  const year = getSelectedYear(); // Implementá esta función si no la tenés
  const leyenda = document.getElementById("leyenda-uso-particular");

  if (categoria === "utilitarios" && year >= 2012 && year <= 2018) {
    leyenda.style.display = "block";
  } else {
    leyenda.style.display = "none";
  }
}

function limpiarLeyendaUsoParticular() {
  const leyenda = document.getElementById("leyenda-uso-particular");
  if (leyenda) leyenda.style.display = "none";
}

function mostrarLeyendaUsoParticularStep4() {
  const categoria = getSelectedCategoria();
  const year = getSelectedYear();
  const leyendaStep4Desktop = document.getElementById(
    "leyenda-uso-particular-step4"
  );
  const leyendaStep4Mobile = document.getElementById(
    "leyenda-uso-particular-mobile-step4"
  );

  // Detectar si es mobile
  const isMobile = window.matchMedia("(max-width: 700px)").matches;

  if (categoria === "utilitarios" && year >= 2012 && year <= 2018) {
    if (isMobile) {
      if (leyendaStep4Desktop) leyendaStep4Desktop.style.display = "none";
      if (leyendaStep4Mobile) leyendaStep4Mobile.style.display = "block";
    } else {
      if (leyendaStep4Desktop) leyendaStep4Desktop.style.display = "block";
      if (leyendaStep4Mobile) leyendaStep4Mobile.style.display = "none";
    }
  } else {
    if (leyendaStep4Desktop) leyendaStep4Desktop.style.display = "none";
    if (leyendaStep4Mobile) leyendaStep4Mobile.style.display = "none";
  }
}

function limpiarLeyendaUsoParticularStep4() {
  const leyendaStep4Desktop = document.getElementById(
    "leyenda-uso-particular-step4"
  );
  const leyendaStep4Mobile = document.getElementById(
    "leyenda-uso-particular-mobile-step4"
  );
  if (leyendaStep4Desktop) leyendaStep4Desktop.style.display = "none";
  if (leyendaStep4Mobile) leyendaStep4Mobile.style.display = "none";
}

// --- NUEVO: Resetear selects de pantalla 2 al volver desde el botón BACK de pantalla 3 ---
document.addEventListener("DOMContentLoaded", () => {
  // Botón "Back" de step 2
  const backBtnStep2 = document.querySelector("#step-2 .back-button");
  if (backBtnStep2) {
    backBtnStep2.addEventListener("click", () => {
      limpiarDatosSolicitante();
      // Resetear placeholders y valores de selects dependientes
      const categoriaPlaceholder = document.querySelector(
        "[onclick=\"toggleCustomOptions('categoria-options')\"]"
      );
      const anioPlaceholder = document.querySelector(
        "[onclick=\"toggleCustomOptions('anio-options')\"]"
      );
      const marcaPlaceholder = document.querySelector(
        "[onclick=\"toggleCustomOptions('marca-options')\"]"
      );
      const modeloPlaceholder = document.querySelector(
        "[onclick=\"toggleCustomOptions('modelo-options')\"]"
      );
      if (categoriaPlaceholder) {
        categoriaPlaceholder.textContent = "Categoría";
        categoriaPlaceholder.dataset.value = "";
        categoriaPlaceholder.classList.remove("selected-bold");
      }
      if (anioPlaceholder) {
        anioPlaceholder.textContent = "Año";
        anioPlaceholder.dataset.value = "";
        anioPlaceholder.classList.remove("selected-bold");
      }
      if (marcaPlaceholder) {
        marcaPlaceholder.textContent = "Marca";
        marcaPlaceholder.dataset.value = "";
        marcaPlaceholder.classList.remove("selected-bold");
      }
      if (modeloPlaceholder) {
        modeloPlaceholder.textContent = "Modelo";
        modeloPlaceholder.dataset.value = "";
        modeloPlaceholder.classList.remove("selected-bold");
      }

      // Limpiar opciones de selects dependientes (dejar solo el buscador si existe)
      const marcaOptions = document.getElementById("marca-options");
      if (marcaOptions) {
        const search = marcaOptions.querySelector(".custom-search-container");
        marcaOptions.innerHTML = "";
        if (search) marcaOptions.appendChild(search);
      }
      const modeloOptions = document.getElementById("modelo-options");
      if (modeloOptions) {
        const search = modeloOptions.querySelector(".custom-search-container");
        modeloOptions.innerHTML = "";
        if (search) modeloOptions.appendChild(search);
      }

      // Limpiar logo del vehículo si existe (pantalla 3)
      const logo = document.getElementById("vehicle-logo");
      if (logo) {
        logo.src = "";
        logo.alt = "Logo de la marca";
      }
    });
  }
});

// Función para obtener el codia/modelo seleccionado
function getSelectedCodia() {
  const modeloPlaceholder = document.querySelector(
    `[onclick="toggleCustomOptions('modelo-options')"]`
  );
  // El codia está en dataset.value si se usó selectCustomOption correctamente
  return modeloPlaceholder?.dataset.value || null;
}

// Función para obtener el año seleccionado
function getSelectedYear() {
  const yearPlaceholder = document.querySelector(
    `[onclick="toggleCustomOptions('anio-options')"]`
  );
  return (
    yearPlaceholder?.dataset.value ||
    yearPlaceholder?.textContent?.trim() ||
    null
  );
}

// --- MODIFICAR evento del botón "Siguiente" de paso 2 ---
document.addEventListener("DOMContentLoaded", () => {
  const nextBtnStep2 = document.querySelector(
    '.next-button[onclick="goToStep(3)"]'
  );
  if (nextBtnStep2) {
    nextBtnStep2.addEventListener("click", async (event) => {
      event.preventDefault();

      // Obtener el precio del vehículo y la categoría seleccionada
      const codia = getSelectedCodia();
      const year = getSelectedYear();
      const categoria = getSelectedCategoria();

      if (!codia || !year) {
        alert("Seleccioná año y modelo antes de avanzar.");
        return;
      }
      try {
        const tipoFeature = await getFeaturesByCodia(
          codia,
          categoria,
          accessToken
        );

        // Ahora tipoFeature es un objeto (o null), no un array
        let tipoVehiculo = null;
        if (tipoFeature && typeof tipoFeature === "object") {
          tipoVehiculo = tipoFeature.value || null;
        }
        window.tipoVehiculoSeleccionado = tipoVehiculo;
        console.log("Tipo de vehículo:", tipoVehiculo);

        const body = {
          codia,
          year,
          accessToken: accessToken,
          action: "getPriceByCodia",
          categoria,
        };
        const res = await fetch("php/curl.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await res.json();
        accessToken = data.accessToken || accessToken;
        window.precioVehiculo = data.price;

        // Validación específica para motos
        if (
          categoria.toLowerCase() === "motos" &&
          window.precioVehiculo < 6000000
        ) {
          console.log("[VALIDACIÓN MOTOS] Vehículo no financiable.");

          // Mostrar mensaje "Vehículo no financiable"
          const el3 = document.querySelector(".custom-summary-amount");
          if (el3) el3.textContent = "Vehículo no financiable";

          const el4 = document.getElementById("custom-summary-amount-step4");
          if (el4) el4.textContent = "Vehículo no financiable";

          // Bloquear el botón "Siguiente"
          const nextButton = document.querySelector(
            '.next-button[onclick="goToStep(4)"]'
          );
          if (nextButton) {
            nextButton.disabled = true;
            nextButton.style.opacity = "0.5";
            nextButton.style.pointerEvents = "none";
          }

          // Bloquear la selección de productos
          const productOptions = document.getElementById("product-options");
          if (productOptions) {
            productOptions.innerHTML =
              '<div class="custom-option disabled">Vehículo no financiable</div>';
          }

          // Bloquear el select de producto (agregar clase y quitar eventos)
          const productSelectContainer = document.querySelector(
            ".custom-options-container.product-select"
          );
          if (productSelectContainer) {
            productSelectContainer.classList.add("disabled");
            // Opcional: quitar el click del placeholder
            const placeholder = productSelectContainer.querySelector(
              ".custom-options-placeholder"
            );
            if (placeholder) {
              placeholder.style.pointerEvents = "none";
              placeholder.style.opacity = "0.5";
            }
          }

          const financeInput = document.querySelector(".net-finance-input");
          if (financeInput) {
            financeInput.disabled = true;
            financeInput.value = "";
            financeInput.placeholder = "Vehículo no financiable";
            financeInput.style.opacity = "0.5";
            financeInput.style.color = "#FF594B";
          }

          // Detener el avance al paso 3
          return;
        }
        // Avanzar al paso 3 si no aplica la regla
        goToStep(3);
        mostrarLeyendaUsoParticular();
        limpiarLeyendaUsoParticularStep4();
      } catch (err) {
        console.error("Error al obtener el precio del vehículo:", err);
        alert("No se pudo obtener el precio del vehículo.");
      }
    });
  }
});

// --- FUNCIÓN PARA CALCULAR Y MOSTRAR EL MÁXIMO A FINANCIAR ---
function updateMaximoAFinanciar() {
  // 1. Obtener el precio del vehículo
  const precio = window.precioVehiculo;
  console.log("[MAXAFIN] Precio del vehículo:", precio);

  if (!precio) {
    console.log("[MAXAFIN] No hay precio disponible.");
    document.querySelector(".custom-summary-amount").textContent = "0";
    return;
  }

  // 2. Obtener el producto seleccionado y el año
  const productoPlaceholder = document.querySelector(
    `[onclick="toggleCustomOptions('product-options')"]`
  );
  const producto = productoPlaceholder?.dataset.value || "a";
  console.log("[MAXAFIN] Producto seleccionado (dataset.value):", producto);

  // Validar si el producto existe en ltvData
  if (!window.ltvData || !(producto in window.ltvData)) {
    console.warn("[MAXAFIN] Producto no encontrado en ltvData.");

    return;
  }

  const yearPlaceholder = document.querySelector(
    `[onclick="toggleCustomOptions('anio-options')"]`
  );
  const year =
    yearPlaceholder?.dataset.value?.trim() ||
    yearPlaceholder?.textContent?.trim() ||
    null;
  console.log("[MAXAFIN] Año seleccionado:", year);
  const currency = document.querySelector("#step-3 .custom-summary-currency");
  if (currency) {
    if (!producto || producto === "Seleccionar Producto") {
      currency.textContent = ""; // Oculta el símbolo
    } else {
      currency.textContent = "$"; // Muestra el símbolo
    }
  }
  // 3. Obtener el LTV correspondiente

  let ltv = null;
  if (
    window.ltvData &&
    producto &&
    window.ltvData[producto] &&
    window.ltvData[producto].ltv &&
    window.ltvData[producto].ltv[year]
  ) {
    ltv = window.ltvData[producto].ltv[year];
  }
  console.log("[MAXAFIN] LTV encontrado:", ltv);

  // 4. Calcular el máximo a financiar
  let maxAFinanciar = 0;
  if (ltv && !isNaN(Number(ltv.value))) {
    // Buscar el fee del plazo más corto disponible
    const productoData = window.ltvData[producto];
    let fee = 0;
    if (productoData && productoData.plazos) {
      // Elegir el plazo más corto (menor cantidad de meses)
      const plazos = Object.keys(productoData.plazos).map(Number);
      const plazoMin = Math.min(...plazos);
      fee = Number(productoData.plazos[plazoMin]?.fee) || 0;
    }
    // Aplica el gasto (fee) multiplicado por 1.21
    maxAFinanciar = Math.round(precio * Number(ltv.value) * (1 - fee * 1.21));
  }
  console.log("[MAXAFIN] Máximo a financiar calculado:", maxAFinanciar);

  // 5. Imprimir en pantalla (pantalla 3 y 4)
  const formatted = maxAFinanciar ? maxAFinanciar.toLocaleString("es-AR") : "0";
  const el3 = document.querySelector(".custom-summary-amount");
  if (el3) el3.textContent = formatted;
  const el4 = document.getElementById("custom-summary-amount-step4");
  if (el4) el4.textContent = formatted;

  // Actualizar el producto seleccionado en pantalla 4
  const selectedProductStep4 = document.getElementById(
    "selected-product-step4"
  );
  if (selectedProductStep4) {
    selectedProductStep4.textContent =
      productoPlaceholder?.dataset.label ||
      productoPlaceholder?.textContent ||
      "";
  }
}

// --- ACTUALIZAR MÁXIMO A FINANCIAR AL AVANZAR A PASO 3 ---
document.addEventListener("DOMContentLoaded", () => {
  // Elimina la llamada a updateMaximoAFinanciar aquí para evitar duplicados
  // const nextBtnStep2 = document.querySelector(
  //   '.next-button[onclick="goToStep(3)"]'
  // );
  // if (nextBtnStep2) {
  //   nextBtnStep2.addEventListener("click", () => {
  //     updateMaximoAFinanciar();
  //   });
  // }
  // También actualizar si cambia el producto
  const productOptions = document.getElementById("product-options");
  if (productOptions) {
    productOptions.addEventListener("click", () =>
      setTimeout(actualizarCuotasPantalla4, 100)
    );
  }
  // Y si cambia el año
  const anioOptions = document.getElementById("anio-options");
  if (anioOptions) {
    anioOptions.addEventListener("click", () =>
      setTimeout(actualizarCuotasPantalla4, 100)
    );
  }
});

async function fetchPriceFromInfoauto(codia, year) {
  const categoria = getSelectedCategoria(); // Obtener la categoría seleccionada
  const endpoint =
    categoria === "motos"
      ? `pub/models/${codia}/prices/` // Endpoint para motos usadas
      : `pub/models/${codia}/prices/`; // Endpoint para autos usados (sin cambios)

  try {
    const requestBody = {
      accessToken: accessToken,
      action: "getPriceByCodia", // Acción genérica
      year: year.trim(),
    };

    console.log("[DEBUG] Request Body enviado a curl.php:", requestBody);

    const response = await fetch(`php/curl.php?endpoint=${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log("[DEBUG] Respuesta cruda de curl.php:", responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Respuesta no es JSON:", responseText);
      alert(
        "No se pudo obtener el precio del vehículo. Respuesta inesperada del servidor."
      );
      return;
    }

    if (data.error) {
      console.error("[ERROR] Error en la respuesta del backend:", data.error);
      return;
    }

    accessToken = data.accessToken || accessToken;

    // Actualizar el precio global
    window.precioVehiculo = data.price || 0;
    updateMaximoAFinanciar();

    console.log("[DEBUG] Precio obtenido:", window.precioVehiculo);
  } catch (error) {
    console.error("[ERROR] Error al obtener precio desde Infoauto:", error);
  }
}

// --- MODIFICAR cálculo de cuotas para incluir motos ---
function calcularCuotaFrancesaPromedioConIVA(monto, tna, plazo, fee) {
  // Sumar fee + IVA al monto
  const comision = monto * fee * 1.21;
  const montoConFee = monto + comision;
  const interesMensual = tna / 100 / 12;
  const factor = Math.pow(1 + interesMensual, plazo);
  const cuotaMensual = (montoConFee * interesMensual * factor) / (factor - 1);

  let saldoRestante = montoConFee;
  let cuotas = [];
  for (let i = 1; i <= plazo; i++) {
    const interesCuota = saldoRestante * interesMensual;
    const iva = interesCuota * 0.21;
    const cuotaConIVA = cuotaMensual + iva;
    cuotas.push(cuotaConIVA);
    const capitalCuota = cuotaMensual - interesCuota;
    saldoRestante -= capitalCuota;
  }
  return Math.round(cuotas.reduce((a, b) => a + b, 0) / cuotas.length);
}

function actualizarCuotasPantalla4() {
  // 1. Obtener monto a financiar (input de pantalla 3, o máximo si vacío)
  let monto = 0;
  const input = document.querySelector(".net-finance-input");
  if (input && input.value) {
    monto = parseInt(input.value.replace(/\./g, ""), 10) || 0;
  }
  // Si no hay monto válido, usar el máximo a financiar
  if (!monto || isNaN(monto) || monto < 1000000) {
    const maxStr =
      document
        .querySelector(".custom-summary-amount")
        ?.textContent?.replace(/\./g, "") || "0";
    monto = parseInt(maxStr, 10) || 0;
  }
  console.log("[CUOTAS] Monto a financiar:", monto);

  // 2. Producto seleccionado
  const productoPlaceholder = document.querySelector(
    `[onclick="toggleCustomOptions('product-options')"]`
  );
  const producto = productoPlaceholder?.dataset.value?.trim(); // Usar el nombre exacto del producto
  if (!producto) {
    console.error("[CUOTAS] Producto no seleccionado. No se puede calcular.");
    document
      .querySelectorAll("#step-4 .scrollable-value")
      .forEach((el) => (el.textContent = "--"));
    return;
  }
  console.log("[CUOTAS] Producto seleccionado:", producto);

  // 3. Año seleccionado
  const yearPlaceholder = document.querySelector(
    `[onclick="toggleCustomOptions('anio-options')"]`
  );
  const year =
    yearPlaceholder?.dataset.value?.trim() ||
    yearPlaceholder?.textContent?.trim() ||
    null;
  console.log("[CUOTAS] Año seleccionado:", year);

  // 4. Validar datos de productos y plazos
  if (!window.ltvData) {
    console.error("[CUOTAS] ltvData no está cargado aún:", window.ltvData);
    document
      .querySelectorAll("#step-4 .scrollable-value")
      .forEach((el) => (el.textContent = "--"));
    return;
  }

  console.log(
    "[CUOTAS] Estructura de ltvData:",
    JSON.stringify(window.ltvData, null, 2)
  );

  const productoData = window.ltvData[producto]; // Usar el nombre exacto del producto
  if (!productoData) {
    console.log("[CUOTAS] Producto buscado:", producto);
    console.log("[CUOTAS] Claves en ltvData:", Object.keys(window.ltvData));
    console.error(
      `[CUOTAS] No hay datos para el producto seleccionado: ${producto}. Verifica que las claves en ltvData coincidan.`
    );
    document
      .querySelectorAll("#step-4 .scrollable-value")
      .forEach((el) => (el.textContent = "--"));
    return;
  }

  const plazos = productoData.plazos;
  if (!plazos) {
    console.error(
      `[CUOTAS] No hay plazos disponibles para el producto: ${producto}.`
    );
    document
      .querySelectorAll("#step-4 .scrollable-value")
      .forEach((el) => (el.textContent = "--"));
    return;
  }
  console.log("[CUOTAS] Plazos disponibles:", plazos);

  // 5. Calcular y mostrar cuotas para cada plazo
  // 5. Limpiar los items existentes
  const container = document.querySelector("#step-4 .scrollable-container");
  container.innerHTML = "";

  // 6. Recorrer solo los plazos disponibles en el producto
  Object.keys(plazos).forEach((plazoStr) => {
    const plazo = parseInt(plazoStr, 10);
    const plazoData = plazos[plazo];
    if (!plazoData) return;

    // Crear el item solo si hay datos para ese plazo
    const item = document.createElement("div");
    item.className = "scrollable-item";

    if (plazo === 36) {
      item.innerHTML = `
    <div class="scrollable-item-36-left">
      <div class="cuota-label-mas-elegida-inside">
        <svg height="7.42" viewBox="0 0 7.748 7.42" style="vertical-align: middle">
          <g id="Grupo_2618" data-name="Grupo 2618">
            <path id="Trazado_780" data-name="Trazado 780"
              d="M5.136,2.323l2.278.2a.417.417,0,0,1,.221.694l-1.7,1.5a.648.648,0,0,0,.032.249c.116.6.392,1.373.445,1.951a.41.41,0,0,1-.567.47L3.92,6.237l-.057-.013L1.918,7.38a.411.411,0,0,1-.584-.463c.06-.653.4-1.43.475-2.091a.228.228,0,0,0,0-.109l-1.7-1.5a.417.417,0,0,1,.242-.7l2.257-.2L3.49.261A.411.411,0,0,1,4.24.229Z"
              fill="#fec008"/>
          </g>
        </svg>
        <span class="cuota-label-text-inside">MÁS ELEGIDA</span>
      </div>
      <span class="scrollable-text">36 CUOTAS</span>
    </div>
    <span class="scrollable-value">--</span>
  `;
    } else {
      item.innerHTML = `
    <span class="scrollable-text">${plazo} CUOTAS</span>
    <span class="scrollable-value">--</span>
  `;
    }

    item.addEventListener("click", function () {
      selectCuota(item);
    });
    container.appendChild(item);

    // Si hay monto válido, calcular y mostrar la cuota
    if (monto >= 1000000) {
      const cuota = calcularCuotaFrancesaPromedioConIVA(
        monto,
        parseFloat(plazoData.interest), // TNA
        plazo,
        plazoData.fee // fee (por ejemplo, 0.008)
      );
      item.querySelector(".scrollable-value").innerHTML =
        "$" + cuota.toLocaleString("es-AR");
    }
  });

  // --- Agregar el mensaje SOLO una vez, después de todos los items ---
  let mensajeDiv = document.createElement("div");
  mensajeDiv.className = "mensaje4";
  mensajeDiv.style.marginTop = "5px";
  mensajeDiv.style.width = "100%";
  mensajeDiv.style.display = "flex";
  mensajeDiv.style.justifyContent = "center";
  mensajeDiv.style.alignItems = "center"; // Alinea verticalmente

  mensajeDiv.innerHTML = `
  <div class="mensaje-ayuda-cuota-row" style="display: flex; align-items: center; gap: 8px; justify-content: flex-start; min-height: 24px;">
    <div class="cuota-info-container" style="margin-right: 8px; flex-shrink: 0;">
      <button class="cuota-info-btn" onclick="document.getElementById('cuota-info-tooltip').classList.toggle('active')" title="Información de la cuota">?</button>
      <div id="cuota-info-tooltip" class="cuota-info-tooltip">
        CUOTA PROMEDIO TNA vigente a la fecha, sujeto a calificación del solicitante en cada entidad bancaria con las que opera LEVER SRL. No incluye impuestos de SELLOS DE PRENDA, ni SEGURO del bien.
      </div>
    </div>
    <p id="select-cuota-message" class="">
      Seleccioná una opción para poder cotizar
    </p>
  </div>
`;
  container.appendChild(mensajeDiv);

  // Si ya hay una cuota seleccionada, ocultar el mensaje
  const selectedCuota = container.querySelector(".scrollable-item.selected");
  const mensajeP = mensajeDiv.querySelector("#select-cuota-message");
  const btn = mensajeDiv.querySelector(".cuota-info-btn");

  console.log("selectedCuota:", selectedCuota);
  console.log(
    "mensajeP antes:",
    mensajeP ? mensajeP.style.display : "no existe"
  );

  if (selectedCuota && mensajeP) {
    mensajeP.classList.add("hidden");
    console.log("Ocultando mensaje: agregada clase 'hidden'");
  } else if (mensajeP) {
    mensajeP.classList.remove("hidden");
    console.log("Mostrando mensaje: removida clase 'hidden'");
  }

  if (mensajeP) {
    console.log(
      "mensajeP después:",
      "display:",
      mensajeP.style.display,
      "visibility:",
      mensajeP.style.visibility
    );
  }

  if (btn) {
    const rect = btn.getBoundingClientRect();
    console.log(
      "Botón posición:",
      "top:",
      rect.top,
      "left:",
      rect.left,
      "display:",
      btn.style.display
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Al avanzar a pantalla 4
  const nextBtnStep4 = document.querySelector(
    '.next-button[onclick="goToStep(4)"]'
  );
  if (nextBtnStep4) {
    nextBtnStep4.addEventListener("click", () => {
      mostrarLeyendaUsoParticularStep4();
      setTimeout(actualizarCuotasPantalla4, 100); // Asegurar que las cuotas se actualicen correctamente
    });
  }
  // Si cambia el producto, monto o año, recalcular cuotas
  const input = document.querySelector(".net-finance-input");
  if (input)
    input.addEventListener("input", () =>
      setTimeout(actualizarCuotasPantalla4, 100)
    );
  const productOptions = document.getElementById("product-options");
  if (productOptions)
    productOptions.addEventListener("click", () =>
      setTimeout(actualizarCuotasPantalla4, 100)
    );
  const anioOptions = document.getElementById("anio-options");
  if (anioOptions)
    anioOptions.addEventListener("click", () =>
      setTimeout(actualizarCuotasPantalla4, 100)
    );
});

// --- HACER GLOBAL getSelectedCategoria ---
function getSelectedCategoria() {
  const catPlaceholder = document.querySelector(
    "[onclick=\"toggleCustomOptions('categoria-options')\"]"
  );
  if (!catPlaceholder) return "Autos y Pickup";
  const val = (
    catPlaceholder.dataset.value ||
    catPlaceholder.textContent ||
    ""
  ).toLowerCase();

  if (val.includes("moto")) return "motos";
  if (val.includes("camion")) return "camiones";
  if (val.includes("utilitario")) return "utilitarios";
  if (val.includes("pickup")) return "Autos y Pickup";
  return "autos";
}

function actualizarProductosPorCategoria(categoria) {
  if (!window.productosData) return;
  const productOptions = document.getElementById("product-options");
  productOptions.innerHTML = "";

  // Buscar el segmento_id correspondiente a la categoría seleccionada
  const segmento = window.segmentosData.find(
    (seg) => seg.nombre.toLowerCase() === categoria.toLowerCase()
  );
  const segmentoId = segmento ? segmento.id : null;

  // Obtener el año seleccionado
  const yearPlaceholder = document.querySelector(
    `[onclick="toggleCustomOptions('anio-options')"]`
  );
  const yearSeleccionado =
    yearPlaceholder?.dataset.value?.trim() ||
    yearPlaceholder?.textContent?.trim() ||
    null;

  // Filtrar productos por segmento_id
  let productosFiltrados = [];
  if (Array.isArray(window.productosData)) {
    productosFiltrados = window.productosData.filter(
      (prod) => prod.segmento_id == segmentoId
    );
  } else {
    console.error("window.productosData no es un array", window.productosData);
    // Opcional: muestra mensaje de error en la UI
    productosFiltrados = [];
  }
  // --- AGRUPAR POR nombre + segmento_id + banco ---
  const productosUnicos = [];
  const clavesVistas = new Set();

  productosFiltrados.forEach((prod) => {
    const clave = `${prod.nombre}__${prod.segmento_id}__${prod.banco}`;
    if (!clavesVistas.has(clave)) {
      // --- FILTRO POR LTV DEL AÑO SELECCIONADO ---
      // Buscar la clave en window.ltvData
      if (
        window.ltvData &&
        window.ltvData[clave] &&
        window.ltvData[clave].ltv &&
        window.ltvData[clave].ltv[yearSeleccionado]
      ) {
        clavesVistas.add(clave);
        productosUnicos.push(prod);
      }
    }
  });

  if (productosUnicos.length === 0) {
    productOptions.innerHTML =
      '<div class="custom-option disabled">Sin productos disponibles</div>';
    return;
  }

  productosUnicos.forEach((prod) => {
    const productoKey = `${prod.nombre}__${prod.segmento_id}__${prod.banco}`;
    const option = document.createElement("div");
    option.className = "custom-option";
    option.textContent = prod.nombre; // Solo el nombre visible
    option.dataset.value = productoKey; // Value interno con banco
    option.onclick = function () {
      selectCustomOption(prod.nombre, "product-options", productoKey);
    };
    productOptions.appendChild(option);
  });
}

// Llamar a esta función al seleccionar una categoría
document
  .getElementById("categoria-options")
  .addEventListener("click", (event) => {
    if (event.target.classList.contains("custom-option")) {
      const categoria =
        event.target.dataset.value ||
        event.target.textContent.trim().toLowerCase();
      actualizarProductosPorCategoria(categoria);
      habilitarSelectProductos();
    }
  });

// Validar y cargar productos al iniciar
document.addEventListener("DOMContentLoaded", () => {
  const categoriaPlaceholder = document.querySelector(
    "[onclick=\"toggleCustomOptions('categoria-options')\"]"
  );
  if (categoriaPlaceholder) {
    const categoria =
      categoriaPlaceholder.dataset.value ||
      categoriaPlaceholder.textContent.trim().toLowerCase();
    actualizarProductosPorCategoria(categoria);
    habilitarSelectProductos();
  }
});
document.getElementById("anio-options").addEventListener("click", (event) => {
  if (event.target.classList.contains("custom-option")) {
    // Limpiar placeholders y valores de marca y modelo
    const marcaPlaceholder = document.querySelector(
      "[onclick=\"toggleCustomOptions('marca-options')\"]"
    );
    const modeloPlaceholder = document.querySelector(
      "[onclick=\"toggleCustomOptions('modelo-options')\"]"
    );
    if (marcaPlaceholder) {
      marcaPlaceholder.textContent = "Marca";
      marcaPlaceholder.dataset.value = "";
      marcaPlaceholder.classList.remove("selected-bold");
    }
    if (modeloPlaceholder) {
      modeloPlaceholder.textContent = "Modelo";
      modeloPlaceholder.dataset.value = "";
      modeloPlaceholder.classList.remove("selected-bold");
    }

    // Limpiar opciones de selects dependientes (dejar solo el buscador si existe)
    const marcaOptions = document.getElementById("marca-options");
    if (marcaOptions) {
      const search = marcaOptions.querySelector(".custom-search-container");
      marcaOptions.innerHTML = "";
      if (search) marcaOptions.appendChild(search);
    }
    const modeloOptions = document.getElementById("modelo-options");
    if (modeloOptions) {
      const search = modeloOptions.querySelector(".custom-search-container");
      modeloOptions.innerHTML = "";
      if (search) modeloOptions.appendChild(search);
    }

    // Actualizar productos y habilitar select productos
    const categoria = getSelectedCategoria();
    actualizarProductosPorCategoria(categoria);
    habilitarSelectProductos();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const contactButton = document.querySelector('a[data-url="#contacto"]');
  if (contactButton) {
    contactButton.addEventListener("click", (e) => {
      e.preventDefault();
      // Ocultar todas las secciones principales
      document.querySelectorAll("main > section").forEach((sec) => {
        sec.classList.add("hidden");
      });
      // Mostrar la sección de contacto
      document.getElementById("contacto").classList.remove("hidden");
      window.scrollTo(0, 0);
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const floatingActionButton = document.querySelector(".floating-action-btn");
  const sections = document.querySelectorAll("main > section");
  const contactoSection = document.getElementById("contacto");

  if (floatingActionButton) {
    floatingActionButton.addEventListener("click", (e) => {
      e.preventDefault();
      // Si existe la sección de contacto en la página, mostrarla
      const contactoSection = document.getElementById("contacto");
      if (contactoSection) {
        // Ocultar todas las secciones principales
        document
          .querySelectorAll("main > section")
          .forEach((sec) => sec.classList.add("hidden"));
        contactoSection.classList.remove("hidden");
        window.scrollTo(0, 0);
      } else {
        // Si no existe (por ejemplo, en nosotros.html), redirigir a contacto.html
        window.location.href = "contacto.html";
      }
    });
  }

  // Asegurar que el formulario de contacto se oculte al cambiar de sección
  document
    .querySelectorAll(
      ".inicio-button, .new-button, .another-button, .message-button"
    )
    .forEach((button) => {
      button.addEventListener("click", () => {
        if (contactoSection) contactoSection.classList.add("hidden");
      });
    });

  document
    .querySelectorAll('a[data-url="#nosotros"], a[data-url="#inicio"]')
    .forEach((link) => {
      link.addEventListener("click", () => {
        if (contactoSection) contactoSection.classList.remove("hidden");
      });
    });

  // Ocultar contacto al hacer clic en cualquier sección que no sea contacto
  if (sections && sections.length > 0 && contactoSection) {
    sections.forEach((section) => {
      section.addEventListener("click", () => {
        if (!section.classList.contains("contacto-section")) {
          contactoSection.classList.add("hidden");
        }
      });
    });
  }

  // Ocultar contacto al avanzar entre pasos
  if (contactoSection) {
    document.querySelectorAll(".step").forEach((step) => {
      step.addEventListener("click", () => {
        contactoSection.classList.add("hidden");
      });
    });
  }
});

// Función global para ocultar el formulario de contacto
function ocultarContacto() {
  const contactoSection = document.getElementById("contacto");
  if (contactoSection) contactoSection.classList.add("hidden");
}

// Función global para mostrar el formulario de contacto
function mostrarContacto() {
  // Oculta todas las secciones principales
  document
    .querySelectorAll("main > section")
    .forEach((sec) => sec.classList.add("hidden"));
  // Muestra la sección de contacto
  const contactoSection = document.getElementById("contacto");
  if (contactoSection) contactoSection.classList.remove("hidden");
  // Agrega la clase 'contacto-activo' al body
  document.body.classList.add("contacto-activo");
  window.scrollTo(0, 0);
}

// Reemplaza todos los listeners de botones/secciones relacionados con contacto:
document.addEventListener("DOMContentLoaded", () => {
  // Botón flotante
  const floatingActionButton = document.querySelector(".floating-action-btn");
  if (floatingActionButton) {
    floatingActionButton.addEventListener("click", (e) => {
      e.preventDefault();
      // Si existe la sección de contacto en la página, mostrarla
      const contactoSection = document.getElementById("contacto");
      if (contactoSection) {
        // Ocultar todas las secciones principales
        document
          .querySelectorAll("main > section")
          .forEach((sec) => sec.classList.add("hidden"));
        contactoSection.classList.remove("hidden");
        window.scrollTo(0, 0);
      } else {
        // Si no existe (por ejemplo, en nosotros.html), redirigir a contacto.html
        window.location.href = "contacto.html";
      }
    });
  }

  // Menú hamburguesa y enlaces de menú
  document.querySelectorAll('a[data-url="#contacto"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      // Si existe la sección de contacto en la página, mostrarla
      const contactoSection = document.getElementById("contacto");
      if (contactoSection) {
        // Ocultar todas las secciones principales
        document
          .querySelectorAll("main > section")
          .forEach((sec) => sec.classList.add("hidden"));
        contactoSection.classList.remove("hidden");
        window.scrollTo(0, 0);
      } else {
        // Si no existe (por ejemplo, en nosotros.html), redirigir a contacto.html
        window.location.href = "contacto.html";
      }
    });
  });

  // Ocultar contacto al ir a inicio o nosotros
  document
    .querySelectorAll('a[data-url="#inicio"], a[data-url="#nosotros"]')
    .forEach((link) => {
      link.addEventListener("click", () => {
        ocultarContacto();
      });
    });

  // Footer y otros botones que cambian de sección
  document
    .querySelectorAll(
      ".inicio-button, .new-button, .another-button, .message-button"
    )
    .forEach((button) => {
      button.addEventListener("click", () => {
        ocultarContacto();
      });
    });
});

// Modifica goToStep para ocultar contacto siempre que se navega entre pasos
const originalGoToStep = window.goToStep || goToStep;
window.goToStep = function (step) {
  ocultarContacto();

  // Actualizar el título de pasos arriba del cotizador
  const tituloPaso = document.querySelector(".tituloysubtitulo h1");
  if (tituloPaso) {
    if (step === 1) {
      tituloPaso.innerHTML = "PASO <strong>1 DE 3</strong>";
    } else if (step === 2) {
      tituloPaso.innerHTML = "PASO <strong>2 DE 3</strong>";
    } else if (step === 3) {
      tituloPaso.innerHTML = "PASO <strong>3 DE 3</strong>";
    } else if (step === 4) {
      tituloPaso.innerHTML = "<strong>cotización</strong> estimada";
    }
  }

  originalGoToStep(step);
};

document.addEventListener("DOMContentLoaded", () => {
  // Redirección botón header "Inicio" para todas las páginas
  document.querySelectorAll(".desktop-inicio-btn").forEach((btn) => {
    // Solo aplicar redirección si NO estamos en index.html
    if (!window.location.pathname.includes("index.html")) {
      btn.onclick = function (e) {
        e.preventDefault();
        window.location.href = "index.html";
      };
    } else {
      // Si estamos en index.html, limpiamos el formulario de pantalla 1
      btn.addEventListener("click", function (e) {
        limpiarFormularioPantalla1();
        limpiarDatosSolicitante();
        goToStep(1);
      });
    }
  });

  // Redirección botón header "Nosotros"
  document.querySelectorAll(".desktop-nosotros-btn").forEach((btn) => {
    btn.onclick = function (e) {
      e.preventDefault();
      window.location.href = "nosotrosNew.html";
    };
  });

  // Redirección enlaces menú "Nosotros"
  document
    .querySelectorAll('a[data-text="Nosotros"], a[data-url="#nosotros"]')
    .forEach((link) => {
      link.onclick = function (e) {
        e.preventDefault();
        window.location.href = "nosotrosNew.html";
      };
    });

  // Redirección botón header "Contacto"
  document
    .querySelectorAll(".desktop-header-buttons .desktop-contacto-btn")
    .forEach((btn) => {
      btn.onclick = function (e) {
        e.preventDefault();
        window.location.href = "contacto.html";
      };
    });

  // Redirección enlaces menú "Contacto"
  document
    .querySelectorAll('a[data-text="Contacto"], a[data-url="#contacto"]')
    .forEach((link) => {
      link.onclick = function (e) {
        e.preventDefault();
        window.location.href = "contacto.html";
      };
    });

  // Redirección botón flotante
  const floatingBtn = document.querySelector(".floating-action-btn");
  if (floatingBtn) {
    floatingBtn.onclick = function (e) {
      e.preventDefault();
      // Si existe la sección de contacto en la página, mostrarla
      const contactoSection = document.getElementById("contacto");
      if (contactoSection) {
        // Ocultar todas las secciones principales
        document
          .querySelectorAll("main > section")
          .forEach((sec) => sec.classList.add("hidden"));
        contactoSection.classList.remove("hidden");
        window.scrollTo(0, 0);
      } else {
        // Si no existe (por ejemplo, en nosotros.html), redirigir a contacto.html
        window.location.href = "contacto.html";
      }
    };
  }
});

// --- MENÚ HAMBURGUESA UNIVERSAL PARA TODAS LAS PÁGINAS ---
// ELIMINAR cualquier otro bloque de menú hamburguesa y reemplazar con este:
(function () {
  "use strict";

  // Función de inicialización del menú
  function initHamburguerMenu() {
    console.log("Inicializando menú hamburguesa...");

    const hamburguer = document.getElementById("hamburguer-menu");
    const menu = document.getElementById("menu");
    const overlay = document.getElementById("menu-overlay");
    const closeBtn = document.getElementById("close-menu");

    if (!hamburguer || !menu || !overlay) {
      console.warn("Elementos del menú no encontrados en esta página");
      return;
    }

    console.log("Elementos del menú encontrados, configurando eventos...");

    // Eliminar eventos previos para evitar duplicados
    hamburguer.removeEventListener("click", handleHamburguerClick);
    overlay.removeEventListener("click", closeMenu);
    if (closeBtn) closeBtn.removeEventListener("click", handleCloseClick);

    function openMenu() {
      menu.classList.remove("hidden");
      menu.classList.add("mobile-active");
      overlay.classList.add("active");
      document.body.classList.add("menu-open");
    }

    function closeMenu() {
      menu.classList.add("hidden");
      menu.classList.remove("mobile-active");
      overlay.classList.remove("active");
      document.body.classList.remove("menu-open");
    }

    function handleHamburguerClick(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log("Clic en hamburguesa detectado");

      if (menu.classList.contains("mobile-active")) {
        closeMenu();
      } else {
        openMenu();
      }
    }

    function handleCloseClick(e) {
      e.preventDefault();
      e.stopPropagation();
      closeMenu();
    }

    // Asignar eventos
    hamburguer.addEventListener("click", handleHamburguerClick);
    overlay.addEventListener("click", closeMenu);

    if (closeBtn) {
      closeBtn.addEventListener("click", handleCloseClick);
    }

    // Cerrar menú al hacer click en cualquier link del menú
    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        closeMenu();
      });
    });

    // Cerrar menú con ESC
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });

    console.log("Menú hamburguesa inicializado correctamente");
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHamburguerMenu);
  } else {
    initHamburguerMenu();
  }

  // También inicializar cuando la página se cargue completamente
  window.addEventListener("load", initHamburguerMenu);
})();

// --- SISTEMA DE TRANSICIONES SUAVES ENTRE PÁGINAS ---
function smoothPageTransition(targetUrl, delay = 400) {
  // Agregar clase de fade out
  document.body.classList.add("page-transition", "fade-out");

  // Después del delay, navegar a la nueva página
  setTimeout(() => {
    window.location.href = targetUrl;
  }, delay);
}

// Función para inicializar transición de entrada en página nueva
function initPageTransition() {
  document.body.classList.add("page-transition");

  // Pequeño delay para asegurar que el DOM esté listo
  setTimeout(() => {
    document.body.classList.add("fade-in");
  }, 50);
}

document.addEventListener("DOMContentLoaded", () => {
  // Inicializar transición de entrada
  initPageTransition();

  // Aplicar transiciones a todos los enlaces de navegación

  // Enlaces del menú hamburguesa
  document
    .querySelectorAll(
      'a[href="index.html"], a[href="nosotros.html"], a[href="contacto.html"]'
    )
    .forEach((link) => {
      link.addEventListener("click", function (e) {
        const href = this.getAttribute("href");
        // Solo aplicar transición si no estamos ya en esa página
        if (!window.location.pathname.includes(href)) {
          e.preventDefault();
          if (href === "nosotros.html") {
            smoothPageTransition("nosotrosNew.html");
          } else {
            smoothPageTransition(href);
          }
        }
      });
    });

  // Botones del header desktop
  document
    .querySelectorAll(".desktop-inicio-btn, .desktop-nosotros-btn")
    .forEach((btn) => {
      const originalOnclick = btn.onclick;
      btn.onclick = function (e) {
        const isInicioBtn = this.classList.contains("desktop-inicio-btn");
        const isNosotrosBtn = this.classList.contains("desktop-nosotros-btn");

        if (isInicioBtn && !window.location.pathname.includes("index.html")) {
          e.preventDefault();
          smoothPageTransition("index.html");
        } else if (
          isNosotrosBtn &&
          !window.location.pathname.includes("nosotros.html")
        ) {
          e.preventDefault();
          smoothPageTransition("nosotrosNew.html");
        } else if (originalOnclick) {
          originalOnclick.call(this, e);
        }
      };
    });

  // Botón flotante (contacto)
  const floatingBtn = document.querySelector(".floating-action-btn");
  if (floatingBtn) {
    floatingBtn.onclick = function (e) {
      e.preventDefault();
      // Si existe la sección de contacto en la página, mostrarla
      const contactoSection = document.getElementById("contacto");
      if (contactoSection) {
        // Ocultar todas las secciones principales
        document
          .querySelectorAll("main > section")
          .forEach((sec) => sec.classList.add("hidden"));
        contactoSection.classList.remove("hidden");
        window.scrollTo(0, 0);
      } else {
        // Si no existe (por ejemplo, en nosotros.html), redirigir a contacto.html
        window.location.href = "contacto.html";
      }
    };
  }

  // Enlaces del footer
  document.querySelectorAll(".footer-icons a, footer a").forEach((link) => {
    link.addEventListener("click", function (e) {
      const href = this.getAttribute("href");
      if (
        href &&
        href.includes(".html") &&
        !window.location.pathname.includes(href)
      ) {
        e.preventDefault();
        smoothPageTransition(href);
      }
    });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const cotizarAhoraBtn = document.getElementById("cotizar-ahora-btn");
  if (cotizarAhoraBtn) {
    cotizarAhoraBtn.addEventListener("click", function (e) {
      e.preventDefault();
      finalizeCotizacion(); // Abre WhatsApp en nueva pestaña

      // Limpiar formularios y volver a pantalla 1
      if (typeof limpiarFormularioPantalla1 === "function")
        limpiarFormularioPantalla1();
      if (typeof resetearFormulariosPantalla2 === "function")
        resetearFormulariosPantalla2();
      if (typeof limpiarFormularioPantalla3 === "function")
        limpiarFormularioPantalla3();
      if (typeof limpiarDatosSolicitante === "function")
        limpiarDatosSolicitante();

      // Volver a la pantalla 1
      if (typeof goToStep === "function") goToStep(1);

      // Opcional: scroll al top
      window.scrollTo(0, 0);
    });
  }
});

// --- FUNCIÓN GLOBAL PARA RESETEAR FORMULARIOS DE PANTALLA 2 ---
function resetearFormulariosPantalla2() {
  // Resetear placeholders y valores de selects dependientes
  const categoriaPlaceholder = document.querySelector(
    "[onclick=\"toggleCustomOptions('categoria-options')\"]"
  );
  const anioPlaceholder = document.querySelector(
    "[onclick=\"toggleCustomOptions('anio-options')\"]"
  );
  const marcaPlaceholder = document.querySelector(
    "[onclick=\"toggleCustomOptions('marca-options')\"]"
  );
  const modeloPlaceholder = document.querySelector(
    "[onclick=\"toggleCustomOptions('modelo-options')\"]"
  );
  if (categoriaPlaceholder) {
    categoriaPlaceholder.textContent = "Categoría";
    categoriaPlaceholder.dataset.value = "";
    categoriaPlaceholder.classList.remove("selected-bold");
  }
  if (anioPlaceholder) {
    anioPlaceholder.textContent = "Año";
    anioPlaceholder.dataset.value = "";
    anioPlaceholder.classList.remove("selected-bold");
  }
  if (marcaPlaceholder) {
    marcaPlaceholder.textContent = "Marca";
    marcaPlaceholder.dataset.value = "";
    marcaPlaceholder.classList.remove("selected-bold");
  }
  if (modeloPlaceholder) {
    modeloPlaceholder.textContent = "Modelo";
    modeloPlaceholder.dataset.value = "";
    modeloPlaceholder.classList.remove("selected-bold");
  }

  // Limpiar opciones de selects dependientes (dejar solo el buscador si existe)
  const marcaOptions = document.getElementById("marca-options");
  if (marcaOptions) {
    const search = marcaOptions.querySelector(".custom-search-container");
    marcaOptions.innerHTML = "";
    if (search) marcaOptions.appendChild(search);
  }
  const modeloOptions = document.getElementById("modelo-options");
  if (modeloOptions) {
    const search = modeloOptions.querySelector(".custom-search-container");
    modeloOptions.innerHTML = "";
    if (search) modeloOptions.appendChild(search);
  }

  // Limpiar logo del vehículo si existe (pantalla 3)
  const logo = document.getElementById("vehicle-logo");
  if (logo) {
    logo.src = "";
    logo.alt = "Logo de la marca";
  }
  setTimeout(validarFormularioPantalla2, 50);
}

document.addEventListener("DOMContentLoaded", () => {
  const modificarBtn = document.querySelector("#step-4 .back-button");
  if (modificarBtn) {
    modificarBtn.addEventListener("click", () => {
      goToStep(3);
      mostrarLeyendaUsoParticular();
      limpiarLeyendaUsoParticularStep4();
      limpiarFormularioPantalla3(); // Borra el monto y el producto al volver a pantalla 3
      setTimeout(validarBotonSiguientePantalla3, 50);
    });
  }
});

// --- NUEVO: Limpiar formulario de pantalla 3 al hacer clic en el botón "back" ---
document.addEventListener("DOMContentLoaded", () => {
  const backBtnStep3 = document.querySelector("#step-3 .back-button");
  if (backBtnStep3) {
    backBtnStep3.addEventListener("click", () => {
      limpiarLeyendaUsoParticular();
      resetearFormulariosPantalla2(); // Ya existente - resetea pantalla 2
      limpiarFormularioPantalla3(); // Nueva función - limpia pantalla 3
      setTimeout(validarBotonSiguientePantalla3, 50);
    });
  }
});

// Función simple para validar y controlar el estado del botón de la pantalla 1
// function validarBotonPantalla1() {
//   const dniInput = document.querySelector(".dni-input");
//   const nextButton = document.querySelector("#step-1 .next-button");

//   if (!dniInput || !nextButton) return;

//   if (dniInput.value.trim() !== "") {
//     // Habilitar botón si hay texto
//     nextButton.disabled = false;
//     nextButton.style.opacity = "1";
//     nextButton.style.pointerEvents = "auto";
//     nextButton.style.cursor = "pointer";
//   } else {
//     // Deshabilitar botón si está vacío
//     nextButton.disabled = true;
//     nextButton.style.opacity = "0.5";
//     nextButton.style.pointerEvents = "none";
//     nextButton.style.cursor = "not-allowed";
//   }
// }

// // Inicializar al cargar el documento
// document.addEventListener("DOMContentLoaded", () => {
//   // Desactivar el botón al inicio
//   const step1Button = document.querySelector("#step-1 .next-button");
//   if (step1Button) {
//     step1Button.disabled = true;
//     step1Button.style.opacity = "0.5";
//     step1Button.style.pointerEvents = "none";
//     step1Button.style.cursor = "not-allowed";
//   }

// Agregar listener al campo DNI/CUIT
const dniInput = document.querySelector(".dni-input");
if (dniInput) {
  dniInput.addEventListener("input", validarBotonPantalla1);
  // También usar el listener existente
  if (typeof updateSearchIconState === "function") {
    dniInput.addEventListener("input", updateSearchIconState);
  }
}

// Actualizar estado del botón cuando cambia el switch
const switchInput = document.querySelector(".toggle-switch input");
if (switchInput) {
  switchInput.addEventListener("change", () => {
    setTimeout(validarBotonPantalla1, 50);
  });
}

// Modificar la función limpiarFormularioPantalla1 para actualizar el estado del botón
const originalLimpiarFormulario = window.limpiarFormularioPantalla1;
window.limpiarFormularioPantalla1 = function () {
  if (typeof originalLimpiarFormulario === "function") {
    originalLimpiarFormulario();
  }

  // Deshabilitar el botón después de limpiar
  setTimeout(validarBotonPantalla1, 50);
};
if (categoriaPlaceholder) {
  categoriaPlaceholder.textContent = "Categoría";
  categoriaPlaceholder.dataset.value = "";
  anioPlaceholder.classList.remove("selected-bold");
}
if (anioPlaceholder) {
  anioPlaceholder.textContent = "Año";
  anioPlaceholder.dataset.value = "";
  anioPlaceholder.classList.remove("selected-bold");
}
if (marcaPlaceholder) {
  marcaPlaceholder.textContent = "Marca";
  marcaPlaceholder.dataset.value = "";
  anioPlaceholder.classList.remove("selected-bold");
}
if (modeloPlaceholder) {
  modeloPlaceholder.textContent = "Modelo";
  modeloPlaceholder.dataset.value = "";
  anioPlaceholder.classList.remove("selected-bold");
}

// Limpiar opciones de selects dependientes (dejar solo el buscador si existe)
const marcaOptions = document.getElementById("marca-options");
if (marcaOptions) {
  const search = marcaOptions.querySelector(".custom-search-container");
  marcaOptions.innerHTML = "";
  if (search) marcaOptions.appendChild(search);
}
const modeloOptions = document.getElementById("modelo-options");
if (modeloOptions) {
  const search = modeloOptions.querySelector(".custom-search-container");
  modeloOptions.innerHTML = "";
  if (search) modeloOptions.appendChild(search);
}

// Limpiar logo del vehículo si existe (pantalla 3)
const logo = document.getElementById("vehicle-logo");
if (logo) {
  logo.src = "";
  logo.alt = "Logo de la marca";
}

function habilitarSelectProductos() {
  const productSelectContainer = document.querySelector(
    ".custom-options-container.product-select"
  );
  if (productSelectContainer) {
    productSelectContainer.classList.remove("disabled");
    // Habilitar el placeholder
    const placeholder = productSelectContainer.querySelector(
      ".custom-options-placeholder"
    );
    if (placeholder) {
      placeholder.style.pointerEvents = "auto";
      placeholder.style.opacity = "1";
    }
  }
}

// --- FUNCIÓN GLOBAL PARA LIMPIAR FORMULARIO DE PANTALLA 3 ---
function limpiarFormularioPantalla3() {
  // Limpiar el input de monto a financiar
  const financeInput = document.querySelector(".net-finance-input");
  if (financeInput) {
    financeInput.value = "";
    financeInput.disabled = false;
    financeInput.placeholder = "Monto neto a financiar";
    financeInput.style.opacity = "1";
    financeInput.style.color = ""; // Resetear color en caso de que hubiera error
  }

  // Resetear el select de producto
  const productoPlaceholder = document.querySelector(
    "[onclick=\"toggleCustomOptions('product-options')\"]"
  );
  if (productoPlaceholder) {
    productoPlaceholder.textContent = "Seleccionar Producto";
    productoPlaceholder.dataset.value = "";
    productoPlaceholder.dataset.label = "";
  }

  // Reactivar el botón "Siguiente" si estaba deshabilitado
  const nextButtonStep3 = document.querySelector(
    '.next-button[onclick="goToStep(4)"]'
  );
  if (nextButtonStep3) {
    nextButtonStep3.disabled = false;
    nextButtonStep3.style.opacity = "1";
    nextButtonStep3.style.pointerEvents = "auto";
  }

  // NUEVO: Restaurar el texto de "máximo a financiar" si estaba en "Vehículo no financiable"

  const maxAmount = document.querySelector(".custom-summary-amount");
  if (maxAmount) {
    maxAmount.textContent = "Selecciona producto";
  }

  // NUEVO: Quitar la clase "disabled" del contenedor de productos
  const productSelectContainer = document.querySelector(
    ".custom-options-container.product-select"
  );
  if (productSelectContainer) {
    productSelectContainer.classList.remove("disabled");
  }

  // NUEVO: Recargar las opciones de productos según la categoría seleccionada
  try {
    const categoria = getSelectedCategoria();
    if (categoria) {
      actualizarProductosPorCategoria(categoria.toLowerCase());
    }
  } catch (error) {
    console.error("Error al recargar opciones de productos:", error);
  }
}

// --- NUEVO: Limpiar formulario de pantalla 3 al hacer clic en el botón "back" ---
document.addEventListener("DOMContentLoaded", () => {
  const backBtnStep3 = document.querySelector("#step-3 .back-button");
  if (backBtnStep3) {
    backBtnStep3.addEventListener("click", () => {
      limpiarLeyendaUsoParticular();
      resetearFormulariosPantalla2(); // Ya existente - resetea pantalla 2
      limpiarFormularioPantalla3(); // Nueva función - limpia pantalla 3
    });
  }
});
document.addEventListener("click", (event) => {
  document
    .querySelectorAll(".custom-options-container")
    .forEach((container) => {
      if (!container.contains(event.target)) {
        const options = container.querySelector(".custom-options");
        const placeholder = container.querySelector(
          ".custom-options-placeholder"
        );
        const extra = container.querySelector(".custom-options-extra");
        options.classList.add("hidden");
        placeholder.classList.remove("active");
        if (extra) extra.classList.remove("active");
      }
    });
});
function filterOptions(selectId, filterText) {
  const optionsContainer = document.getElementById(selectId);
  if (!optionsContainer) return;
  const allOptions = optionsContainer.querySelectorAll(".custom-option");
  const filter = filterText.toLowerCase();
  allOptions.forEach((option) => {
    // No ocultar el buscador ni las opciones deshabilitadas
    if (option.classList.contains("disabled")) return;
    const optionText = option.textContent.toLowerCase();
    option.style.display = optionText.includes(filter) ? "flex" : "none";
  });
}

document.addEventListener("click", function (e) {
  // Cerrar todos los tooltips si el click NO fue en un botón ni en un tooltip
  const isBtn = e.target.classList.contains("cuota-info-btn");
  const isTooltip = e.target.classList.contains("cuota-info-tooltip");
  if (!isBtn && !isTooltip) {
    document
      .querySelectorAll(".cuota-info-tooltip.active")
      .forEach((t) => t.classList.remove("active"));
  }
});

// Delegación para mostrar/ocultar el tooltip al hacer click en cualquier botón
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("cuota-info-btn")) {
    e.stopPropagation();
    // Cerrar otros tooltips
    document
      .querySelectorAll(".cuota-info-tooltip.active")
      .forEach((t) => t.classList.remove("active"));
    // Mostrar el tooltip correspondiente
    const tooltip = e.target.parentElement.querySelector(".cuota-info-tooltip");
    if (tooltip) tooltip.classList.toggle("active");
  }
});

function onGoogleSignIn(response) {
  fetch(`${API_BASE}/google-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: response.credential }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        sessionStorage.setItem("user_email", data.user.email);
        document.getElementById("login-modal").style.display = "none";
        document.querySelector("main").style.display = "block";
      } else {
        alert("Error al iniciar sesión con Google");
      }
    });
}
