// --- Declarar accessToken global al inicio ---
let accessToken = null;

// Variable global para guardar el precio del vehículo
window.precioVehiculo = null;

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

function goToStep(step) {
  console.log("goToStep llamada con step:", step);

  const steps = document.querySelectorAll(".step");
  steps.forEach((stepElement, index) => {
    if (index + 1 === step) {
      stepElement.classList.remove("hidden");
      stepElement.classList.add("active");

      // Mostrar el mensaje en la pantalla 4
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
}

function finalizeCotizacion() {
  // --- NUEVO: Enviar cotización por WhatsApp

  const solicitante = sessionStorage.getItem("solicitante_nombre") || "";
  const solicitanteDoc = sessionStorage.getItem("solicitante_dni") || "";
  const producto =
    document.getElementById("selected-product-step4")?.textContent?.trim() ||
    "";
  const monto =
    document
      .getElementById("custom-summary-amount-step4")
      ?.textContent?.trim() || "";
  const cuotaSeleccionada = document.querySelector(
    "#step-4 .scrollable-item.selected"
  );
  const cuotas = cuotaSeleccionada
    ? cuotaSeleccionada
        .querySelector(".scrollable-text")
        ?.textContent?.trim() || ""
    : "";
  const valorCuota = cuotaSeleccionada
    ? cuotaSeleccionada
        .querySelector(".scrollable-value")
        ?.textContent?.trim() || ""
    : "";
  const marca =
    document.getElementById("vehicle-brand-step4")?.textContent?.trim() || "";
  const modelo =
    document.getElementById("vehicle-model-step4")?.textContent?.trim() || "";
  const anio =
    document.getElementById("vehicle-year-step4")?.textContent?.trim() || "";

  let mensaje = `¡Hola! Quiero avanzar con la cotización:\n\n`;
  if (solicitante) mensaje += `Solicitante: ${solicitante}\n`;
  if (solicitanteDoc) mensaje += `DNI/CUIT: ${solicitanteDoc}\n`;
  if (marca) mensaje += `Marca: ${marca}\n`;
  if (modelo) mensaje += `Modelo: ${modelo}\n`;
  if (anio) mensaje += `Año: ${anio}\n`;
  if (producto) mensaje += `Producto: ${producto}\n`;
  if (monto) mensaje += `Monto a financiar: $${monto}\n`;
  if (cuotas && valorCuota) mensaje += `Cuotas: ${cuotas} de ${valorCuota}\n`;

  const numero = "+5493417049138";

  const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;

  window.open(url, "_blank");
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
    message.classList.add("hidden"); // Asegurar que se oculte con la clase
    message.style.removeProperty("display"); // Eliminar el estilo display:block
  } else {
    console.error("No se encontró el elemento con ID 'select-cuota-message'.");
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
}

document.addEventListener("DOMContentLoaded", () => {
  document
    .querySelectorAll(".custom-options-container")
    .forEach((container, index, containers) => {
      const placeholder = container.querySelector(
        ".custom-options-placeholder"
      );
      const options = container.querySelector(".custom-options");
      const extraDiv = container.querySelector(".custom-options-extra"); // Nuevo div
      const searchContainer = options.querySelector(".custom-search-container"); // Nuevo buscador
      const searchInput = searchContainer
        ? searchContainer.querySelector("input")
        : null; // Input del buscador

      // Función para ajustar el margen del siguiente select
      const adjustNextSelect = (isExpanded) => {
        containers.forEach((cont, i) => {
          if (i === index + 1) {
            cont.style.marginTop = isExpanded ? "197px" : "15px"; // Ajustar margen solo para el siguiente select
          } else {
            cont.style.marginTop = "15px"; // Los demás no tienen margen adicional
          }
        });
      };

      // Abrir o cerrar las opciones al hacer clic en el placeholder
      placeholder.addEventListener("click", (event) => {
        event.stopPropagation(); // Evitar que el evento se propague
        const allOptions = document.querySelectorAll(".custom-options");
        const allPlaceholders = document.querySelectorAll(
          ".custom-options-placeholder"
        );

        const allExtras = document.querySelectorAll(".custom-options-extra"); // Todos los extras
        const allSearchContainers = document.querySelectorAll(
          ".custom-search-container"
        ); // Todos los buscadores

        // Cerrar todos los selects abiertos excepto el actual
        allOptions.forEach((opt) => {
          if (opt !== options) {
            opt.classList.add("hidden");
          }
        });

        allPlaceholders.forEach((ph) => {
          if (ph !== placeholder) {
            ph.classList.remove("active"); // Quitar clase para rotar la flecha
          }
        });

        allExtras.forEach((extra) => {
          if (extra !== extraDiv) {
            extra.classList.remove("active"); // Ocultar extras no relacionados
          }
        });

        allSearchContainers.forEach((search) => {
          if (search !== searchContainer) {
            search.classList.remove("active"); // Ocultar buscadores no relacionados
          }
        });

        // Alternar el estado del select actual, su extra y el buscador
        if (options.classList.contains("hidden")) {
          options.classList.remove("hidden");
          placeholder.classList.add("active"); // Agregar clase para rotar la flecha
          extraDiv.classList.add("active"); // Mostrar el extra
          if (searchContainer) searchContainer.classList.add("active"); // Mostrar el buscador
          adjustNextSelect(true); // Ajustar margen del siguiente select
        } else {
          options.classList.add("hidden");
          placeholder.classList.remove("active"); // Quitar clase para rotar la flecha
          extraDiv.classList.remove("active"); // Ocultar el extra
          if (searchContainer) searchContainer.classList.remove("active"); // Ocultar el buscador
          adjustNextSelect(false); // Volver a la posición original
        }
      });

      // Evitar que el buscador cierre o mueva los selects al hacer clic
      if (searchContainer) {
        searchContainer.addEventListener("click", (event) => {
          event.stopPropagation(); // Evitar que el evento cierre el select
        });

        // Filtrar opciones en tiempo real
        searchInput.addEventListener("input", (event) => {
          const filterText = event.target.value.toLowerCase();
          const allOptions = options.querySelectorAll(".custom-option");
          allOptions.forEach((option) => {
            const optionText = option.textContent.toLowerCase();
            if (optionText.includes(filterText)) {
              option.style.display = "flex"; // Mostrar opción si coincide
            } else {
              option.style.display = "none"; // Ocultar opción si no coincide
            }
          });
        });
      }

      // Seleccionar una opción
      options.addEventListener("click", (event) => {
        if (event.target.classList.contains("custom-option")) {
          // --- CORRECCIÓN SOLO PARA MODELO ---
          if (options.id === "modelo-options") {
            placeholder.textContent = event.target.textContent;
            placeholder.dataset.value = event.target.dataset.value; // codia numérico
            placeholder.dataset.label = event.target.textContent;   // nombre modelo
          } else if (options.id === "marca-options") {
            placeholder.textContent = event.target.textContent;
            placeholder.dataset.value = event.target.dataset.value; // id de marca
            placeholder.dataset.label = event.target.textContent;   // nombre marca
          } else if (options.id === "anio-options") {
            placeholder.textContent = event.target.textContent;
            placeholder.dataset.value = event.target.textContent; // año
            placeholder.dataset.label = event.target.textContent; // año
          } else {
            placeholder.textContent = event.target.textContent;
            placeholder.dataset.value = event.target.textContent;
            placeholder.dataset.label = event.target.textContent;
          }
          closeSelect(container);
          open = false;
        }
      });

    document.addEventListener("click", (e) => {
      if (!container.contains(e.target)) {
        closeSelect();
      }
    });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  let dataWithLogo = []; // Array para almacenar marcas y sus logos

  // NUEVO: función para obtener la categoría seleccionada
  function getSelectedCategoria() {
    const catPlaceholder = document.querySelector(
      '[onclick="toggleCustomOptions(\'categoria-options\')"]'
    );
    if (!catPlaceholder) return "autos";
    const val = (catPlaceholder.dataset.value || catPlaceholder.textContent || "").toLowerCase();
    // --- CAMBIO: Si contiene "moto", devolver "motos"
    if (val.includes("moto")) return "motos";
    if (val.includes("utilitario") || val.includes("camion")) return "utilitarios";
    return "autos";
  }

  const fetchMarcasFromInfoauto = async (year) => {
    try {
      // NUEVO: obtener la categoría seleccionada
      const categoria = getSelectedCategoria();

      const requestBody = {
        year: year.trim(),
        accessToken: accessToken, // <-- enviar el token si lo tenés
        action: "getBrandsByYear",
        categoria // <-- enviar la categoría al backend
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
      accessToken = data.accessToken || accessToken; // <-- guardar el nuevo token si viene
      const marcasSelect = document.getElementById("marca-options");
      dataWithLogo = data.brands; // Guardar datos de marcas con logos

      // Guardar el buscador existente antes de limpiar el contenedor
      let searchContainer = marcasSelect.querySelector(
        ".custom-search-container"
      );
      if (!searchContainer) {
        searchContainer = document.createElement("div");
        searchContainer.className = "custom-search-container active";
        searchContainer.innerHTML = `

                    <img src="./images/icons/lupita.svg" alt="Buscar" />
                    <input type="text" placeholder="Buscar marca..." oninput="filterOptions('marca-options', this.value)" />
                `;
        marcasSelect.prepend(searchContainer);
      }

      marcasSelect.innerHTML = ""; // Limpiar opciones existentes
      // Reinsertar el buscador existente
      if (searchContainer) {
        marcasSelect.appendChild(searchContainer);
        searchContainer.classList.remove("hidden"); // Asegurar que esté visible
      }

      data.brands.forEach((brand) => {
        const option = document.createElement("div");
        option.className = "custom-option";
        option.textContent = brand.name;
        option.dataset.value = brand.id;
        option.dataset.logo = brand.logo; // Guardar la URL del logo
        option.onclick = () =>
          selectCustomOption(brand.name, "marca-options", brand.id);
        marcasSelect.appendChild(option);
      });

      console.log("Marcas obtenidas:", data.brands);
    } catch (error) {
      console.error("Error al obtener marcas desde Infoauto:", error);
    }
  };

  const getLogo = (id) => {
    const element = dataWithLogo.find((element) => element.id == id);
    let logoUrl = element?.logo;

    // Si no hay logo, buscar localmente según categoría
    if (!logoUrl || logoUrl === "" || logoUrl === "null") {
      // Obtener categoría seleccionada
      const categoria = getSelectedCategoria();
      // Normalizar nombre de marca: minúsculas, sin espacios, sin tildes, sin puntos
      let nombreMarca = (element?.name || "").toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quitar tildes
        .replace(/[^a-z0-9]/g, "-") // reemplazar todo lo que no sea letra o número por guión
        .replace(/-+/g, "-") // un solo guión
        .replace(/^-|-$/g, ""); // quitar guión inicial/final

      // Ruta base según categoría
      let basePath = "./images/logos/autos/";
      if (categoria === "motos") basePath = "./images/logos/motos/";

      // Probar con .png y .jpg
      const img = document.getElementById("vehicle-logo");
      const tryPng = `${basePath}${nombreMarca}.png`;
      const tryJpg = `${basePath}${nombreMarca}.jpg`;

      // Probar si existe el PNG, si no, probar JPG, si no, usar genérico
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
      return;
    }

    // Si hay logo de la API, usarlo
    document.getElementById("vehicle-logo").src = logoUrl;
    document.getElementById("vehicle-logo").alt = `Logo de ${element?.name || "genérico"}`;
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

// Definir la función toggleCustomOptions en el ámbito global
function toggleCustomOptions(id) {
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

  // Alternar el estado del select actual
  const isHidden = options.classList.contains("hidden");

  document.querySelectorAll(".custom-options").forEach((opt) => {
    if (opt !== options) {
      opt.classList.add("hidden");
      setTimeout(() => opt.classList.add("display-none"), 300); // Retrasar el display: none
    }
  });

  document.querySelectorAll(".custom-options-placeholder").forEach((ph) => {
    if (ph !== placeholder) {
      ph.classList.remove("active"); // Quitar rotación de flecha
    }
  });

  if (isHidden) {
    options.classList.remove("display-none"); // Mostrar antes de la transición
    setTimeout(() => {
      options.classList.remove("hidden");
      placeholder.classList.add("active"); // Rotar la flecha del placeholder
    }, 10); // Pequeño retraso para permitir la transición
  } else {
    options.classList.add("hidden");
    placeholder.classList.remove("active"); // Quitar rotación de flecha
    setTimeout(() => options.classList.add("display-none"), 300); // Retrasar el display: none
  }

  // Verificar estilos aplicados
  const computedStyles = window.getComputedStyle(options);
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

  if (id === "product-options" && extraData) {
    // Forzar SIEMPRE el valor interno (a/b) en dataset.value
    placeholder.dataset.value = extraData;
    // Mostrar el nombre visible
    let displayName = "Seguro en Banco";
    if (extraData === "b") displayName = "Seguro Liberado";
    placeholder.textContent = displayName;
  } else if (id === "modelo-options" && extraData) {
    placeholder.dataset.value = extraData;
  } else if (id === "marca-options" && extraData) {
    placeholder.dataset.value = extraData;
  } else if (id === "anio-options" && extraData) {
    placeholder.dataset.value = extraData;
  } else {
    placeholder.dataset.value = value;
  }

  // Cerrar el menú desplegable
  options.classList.add("hidden");
  placeholder.classList.remove("active"); // Quitar rotación de flecha

  console.log(`Opción seleccionada: ${value}`);

  // Si se selecciona un producto, recalcular el máximo a financiar
  if (id === "product-options") {
    updateMaximoAFinanciar();
  }

  // Si se selecciona una marca, cargar los modelos
  if (id === "marca-options") {
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

        const allOptions = document.querySelectorAll(".custom-options");
        const allPlaceholders = document.querySelectorAll(
          ".custom-options-placeholder"
        );

        // Cerrar todos los selects abiertos excepto el actual
        allOptions.forEach((opt, optIndex) => {
          if (opt !== options) {
            opt.classList.add("hidden");
          }
        });

        allPlaceholders.forEach((ph, phIndex) => {
          if (ph !== placeholder) {
            ph.classList.remove("active");
          }
        });

        // Alternar el estado del select actual
        if (options.classList.contains("hidden")) {
          options.classList.remove("hidden");
          placeholder.classList.add("active");
          resetSearch(); // Reiniciar y mostrar el buscador
        } else {
          options.classList.add("hidden");
          placeholder.classList.remove("active");
        }
      });

      // Evitar que el buscador cierre el select al hacer clic
      if (searchContainer) {
        searchContainer.addEventListener("click", (event) => {
          event.stopPropagation(); // Evitar que el evento cierre el select
        });

        // Filtrar opciones en tiempo real
        searchInput.addEventListener("input", (event) => {
          const filterText = event.target.value.toLowerCase();

          const allOptions = options.querySelectorAll(".custom-option");
          allOptions.forEach((option) => {
            const optionText = option.textContent.toLowerCase();
            option.style.display = optionText.includes(filterText)
              ? "flex"
              : "none";
          });
        });
      }

      // Seleccionar una opción
      options.addEventListener("click", (event) => {
        if (event.target.classList.contains("custom-option")) {
          // --- CORRECCIÓN SOLO PARA MODELO ---
          if (options.id === "modelo-options") {
            placeholder.textContent = event.target.textContent;
            placeholder.dataset.value = event.target.dataset.value; // codia numérico
            placeholder.dataset.label = event.target.textContent;   // nombre modelo
          } else if (options.id === "marca-options") {
            placeholder.textContent = event.target.textContent;
            placeholder.dataset.value = event.target.dataset.value; // id de marca
            placeholder.dataset.label = event.target.textContent;   // nombre marca
          } else if (options.id === "anio-options") {
            placeholder.textContent = event.target.textContent;
            placeholder.dataset.value = event.target.textContent; // año
            placeholder.dataset.label = event.target.textContent; // año
          } else {
            placeholder.textContent = event.target.textContent;
            placeholder.dataset.value = event.target.textContent;
            placeholder.dataset.label = event.target.textContent;
          }
          closeSelect();
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
  const nextButtonStep3 = document.querySelector(".next-button[onclick='goToStep(4)']");
  const productOptions = document.getElementById("product-options");

  if (!financeInput || !maxAmountElement || !minAmountText || !nextButtonStep3 || !productOptions) {
    console.error("No se encontraron los elementos necesarios para la validación.");
    return;
  }

  let isValidAmount = true;

  const validateAmount = () => {
    const maxAmount = parseInt(maxAmountElement.textContent.replace(/\./g, ""), 10) || 0;
    let value = financeInput.value.replace(/[^0-9]/g, ""); // Permitir solo números

    if (value.length > 12) {
      value = value.slice(0, 12); // Limitar a 12 dígitos
    }

    const formattedValue = value.replace(/\B(?=(\d{3})+(?!\d))/g, "."); // Formatear with puntos
    financeInput.value = formattedValue;

    // Validar si el monto supera el máximo permitido
    if (parseInt(value, 10) > maxAmount) {
      financeInput.style.color = "red";
      minAmountText.textContent = "No puede superar el máximo a financiar.";
      minAmountText.style.color = "red";
      isValidAmount = false;
      nextButtonStep3.disabled = true; // Deshabilitar el botón
      nextButtonStep3.style.opacity = "0.5";
      nextButtonStep3.style.pointerEvents = "none";
    } else {
      financeInput.style.color = "";
      minAmountText.textContent = "Monto mínimo: $1.000.000";
      minAmountText.style.color = "";
      isValidAmount = true;
      nextButtonStep3.disabled = false; // Habilitar el botón
      nextButtonStep3.style.opacity = "1";
      nextButtonStep3.style.pointerEvents = "auto";
    }
  };

  financeInput.addEventListener("input", validateAmount);

  financeInput.addEventListener("blur", (event) => {
    if (event.target.value.endsWith(".")) {
      event.target.value = event.target.value.slice(0, -1); // Eliminar punto final si existe
    }
  });

  nextButtonStep3.addEventListener("click", (event) => {
    if (!isValidAmount) {
      event.preventDefault();
      alert("El monto ingresado supera el máximo a financiar permitido. Corrige el monto para continuar.");
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
      }
    });
  }
});

async function fetchModelosFromInfoauto(marcaId, year) {
  // NUEVO: obtener la categoría seleccionada
  function getSelectedCategoria() {
    const catPlaceholder = document.querySelector(
      '[onclick="toggleCustomOptions(\'categoria-options\')"]'
    );
    if (!catPlaceholder) return "autos";
    const val = (catPlaceholder.dataset.value || catPlaceholder.textContent || "").toLowerCase();
    // --- CAMBIO: Si contiene "moto", devolver "motos"
    if (val.includes("moto")) return "motos";
    if (val.includes("utilitario") || val.includes("camion")) return "utilitarios";
    return "autos";
  }
  const categoria = getSelectedCategoria();

  try {
    const requestBody = {
      idMarca: marcaId,
      year: year.trim(),
      accessToken: accessToken, // <-- enviar el token si lo tenés
      action: "getModelsByBrand",
      categoria // <-- enviar la categoría al backend
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
    accessToken = data.accessToken || accessToken; // <-- guardar el nuevo token si viene
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
      <input type="text" placeholder="Buscar modelo..." oninput="filterOptions('modelo-options', this.value)" />
    `;
      modelosSelect.prepend(searchContainer);
    }

    modelosSelect.innerHTML = ""; // Limpiar opciones existentes
    // Reinsertar el buscador existente
    if (searchContainer) {
      modelosSelect.appendChild(searchContainer);
      searchContainer.classList.remove("hidden"); // Asegurar que esté visible
    }

    // Agregar los modelos obtenidos
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
  if (idx !== -1 && containers[idx + 1]) containers[idx + 1].style.marginTop = "15px";
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
      if (arr[idx + 1]) arr[idx + 1].style.marginTop = "197px";
      open = true;
    });

    options.addEventListener("click", (e) => {
      if (e.target.classList.contains("custom-option")) {
        // --- CORRECCIÓN SOLO PARA MODELO ---
        if (options.id === "modelo-options") {
          placeholder.textContent = e.target.textContent;
          placeholder.dataset.value = e.target.dataset.value; // codia numérico
          placeholder.dataset.label = e.target.textContent;   // nombre modelo
        } else if (options.id === "marca-options") {
          placeholder.textContent = e.target.textContent;
          placeholder.dataset.value = e.target.dataset.value; // id de marca
          placeholder.dataset.label = e.target.textContent;   // nombre marca
        } else if (options.id === "anio-options") {
          placeholder.textContent = e.target.textContent;
          placeholder.dataset.value = e.target.textContent; // año
          placeholder.dataset.label = e.target.textContent; // año
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
    const value = productoPlaceholder?.dataset.value || "a"; // Mantener el valor seleccionado
    let displayName = value === "b" ? "Seguro Liberado" : "Seguro en Banco"; // Mostrar el nombre correcto
    document.getElementById("selected-product-step4").textContent = displayName;
  };

  const nextBtnStep4 = document.querySelector(".next-button[onclick='goToStep(4)']");
  if (nextBtnStep4) {
    nextBtnStep4.addEventListener("click", () => {
      updateSelectedProductStep4(); // Actualizar el producto seleccionado
      setTimeout(actualizarCuotasPantalla4, 100); // Asegurar que las cuotas se actualicen correctamente
    });
  }
});

// Mostrar nombres personalizados para los productos A y B (sin modificar base ni backend)
 document.addEventListener("DOMContentLoaded", () => {
    const API_URL =
      location.hostname === "localhost"
        ? "http://localhost:5000"
        : "https://api.lever.com.ar";

    // Mapeo de nombres internos a nombres visibles
    const PRODUCT_DISPLAY_NAMES = {
      A: "Seguro en Banco",
      B: "Seguro Liberado",
      // Agrega más si sumás productos
    };

    fetch(`${API_URL}/api/calculadora`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const productos = data.productos || {};
        const productOptions = document.getElementById("product-options");
        productOptions.innerHTML = "";

        if (Object.keys(productos).length === 0) {
          productOptions.innerHTML =
            '<div class="custom-option">No hay productos disponibles</div>';
          return;
        }

      Object.keys(productos).forEach((nombre) => {
        // Usar el nombre personalizado si existe, sino el nombre original
        const displayName =
          PRODUCT_DISPLAY_NAMES[nombre.toUpperCase()] || nombre;
        const option = document.createElement("div");
        option.className = "custom-option";
        option.textContent = displayName;
        option.onclick = function () {
          selectCustomOption(displayName, "product-options", nombre);
        };
        productOptions.appendChild(option);
      });
    })
    .catch((err) => {
      const productOptions = document.getElementById("product-options");
      productOptions.innerHTML =
        '<div class="custom-option">No se pudo conectar al servidor. Verificá que el backend esté iniciado en <b>http://localhost:5000</b></div>';
      console.error("Error al cargar productos:", err);
    });
});

  document.addEventListener("DOMContentLoaded", () => {
    const shareBtn = document.querySelector(".share-button");
    if (!shareBtn) return;

    shareBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      // Seleccionar los elementos a compartir
      const vehicleSummary = document.querySelector("#step-4 .vehicle-summary");
      const customSummary = document.querySelector(
        "#step-4 .custom-summary-step4"
      );
      const cuotaSeleccionada = document.querySelector(
        "#step-4 .scrollable-item.selected"
      );


      //armado de imagen para compartir

      // Crear un contenedor temporal para la imagen
      const tempDiv = document.createElement("div");
      tempDiv.style.background = "#fff";
      tempDiv.style.padding = "32px 0 24px 0";
      tempDiv.style.borderRadius = "24px";
      tempDiv.style.display = "flex";
      tempDiv.style.flexDirection = "column";
      tempDiv.style.alignItems = "center";
      tempDiv.style.fontFamily = "Montserrat, sans-serif";
      tempDiv.style.color = "#222";
      tempDiv.style.width = "370px";
      tempDiv.style.boxSizing = "border-box";
      tempDiv.style.textAlign = "center";
      tempDiv.style.position = "relative";
      tempDiv.style.fontSize = "15px";
      tempDiv.style.gap = "0";

      // Logo Lever arriba, centrado
      const logo = document.createElement("img");
      logo.src = "./images/logos/lever.svg";
      logo.alt = "Lever";
      logo.style.width = "80px";
      logo.style.height = "auto";
      logo.style.display = "block";
      logo.style.margin = "0 auto 18px auto";
      tempDiv.appendChild(logo);

      // --- TÍTULO "COTIZACIÓN ESTIMADA" entre logo y solicitante ---
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

      // --- DATOS DEL SOLICITANTE entre logo y vehículo ---
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
        clone.style.background = "#fff";
        clone.style.border = "none";
        clone.style.margin = "0 0 18px 0";
        clone.style.padding = "0";
        clone.style.width = "320px";
        clone.style.boxSizing = "border-box";
        clone.style.display = "flex";
        clone.style.alignItems = "center";
        clone.style.justifyContent = "flex-start";
        clone.style.borderRadius = "28px";
        clone.style.minHeight = "90px";
        clone.style.position = "relative";
        clone.style.boxShadow = "0 2px 12px 0 rgba(40,216,158,0.07)";
        Object.assign(clone.style, extraStyles);

        // Usar el logo local siempre para la imagen compartida
        let logoMarca = document.createElement("img");
        logoMarca.src = "./images/car.svg"; // Usa ruta relativa con ./ inicial
        logoMarca.alt = "Logo auto";
        logoMarca.style.width = "54px";
        logoMarca.style.height = "54px";
        logoMarca.style.objectFit = "contain";
        logoMarca.style.marginRight = "18px";
        logoMarca.style.marginLeft = "18px";

        // Clonar y limpiar los textos
        const details = clone.querySelector(".vehicle-details");
        let detailsClone = null;
        if (details) {
          detailsClone = details.cloneNode(true);
          detailsClone.style.display = "flex";
          detailsClone.style.flexDirection = "column";
          detailsClone.style.alignItems = "flex-start";
          detailsClone.style.justifyContent = "center";
          detailsClone.style.gap = "0";
          detailsClone.querySelectorAll("h3, p").forEach((el) => {
            el.style.margin = "0";
            el.style.padding = "0";
            el.style.textAlign = "left";
            el.style.color = "#222";
          });
          const h3 = detailsClone.querySelector("h3");
          if (h3) {
            h3.style.fontSize = "16px";
            h3.style.fontWeight = "bold";
            h3.style.letterSpacing = "0.5px";
          }
          const ps = detailsClone.querySelectorAll("p");
          if (ps[0]) {
            ps[0].style.fontSize = "15px";
            ps[0].style.fontWeight = "bold";
          }
          if (ps[1]) {
            ps[1].style.fontSize = "13px";
            ps[1].style.fontWeight = "400";
          }
        }

        // Limpiar el contenido y agregar logo y detalles alineados
        clone.innerHTML = "";
        clone.appendChild(logoMarca);
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
        clone.style.alignItems = "flex-start";
        clone.style.justifyContent = "center";
        clone.style.borderRadius = "28px";
        clone.style.minHeight = "90px";
        clone.style.position = "relative";
        clone.style.boxShadow = "0 2px 12px 0 rgba(40,216,158,0.07)";

        // Título
        const title = clone.querySelector(".custom-summary-title");
        if (title) {
          title.style.fontSize = "14px";
          title.style.fontWeight = "bold";
          title.style.color = "#222";
          title.style.margin = "18px 0 0 24px";
          title.style.textAlign = "left";
        }
        // Monto
        const amount = clone.querySelector(".custom-summary-amount");
        if (amount) {
          amount.style.fontSize = "15px";
          amount.style.fontWeight = "bold";
          amount.style.color = "#28D89E";
          amount.style.margin = "12px 0 0 24px";
          amount.style.textAlign = "left";
          amount.style.display = "inline-block";
          amount.style.marginTop = "-24px";
          amount.style.marginLeft = "31px";
        }
        // $ símbolo
        const currency = clone.querySelector(".custom-summary-currency");
        if (currency) {
          currency.style.fontSize = "15px";
          currency.style.fontWeight = "bold";
          currency.style.color = "#28D89E";
          currency.style.margin = "12px 0 0 18px";
          currency.style.display = "inline-block";
        }
        // Producto
        const prod = clone.querySelector(".selected-product");
        if (prod) {
          prod.style.position = "absolute";
          prod.style.right = "18px";
          prod.style.top = "24px";
          prod.style.background = "#e8fff6";
          prod.style.color = "#28D89E";
          prod.style.border = "1.5px solid #28D89E";
          prod.style.borderRadius = "12px";
          prod.style.fontWeight = "bold";
          prod.style.fontSize = "8px";
          prod.style.padding = "2px 12px";
          prod.style.margin = "0";
          prod.style.display = "inline-block";
          prod.style.boxShadow = "none";
          prod.style.height = "35px";
        }
        return clone;
      }

      // Clonar los elementos con estilos fieles al diseño original y alineados
      if (vehicleSummary) tempDiv.appendChild(cloneStyled(vehicleSummary));
      if (customSummary) tempDiv.appendChild(cloneSummaryStyled(customSummary));

      // Agregar la cuota seleccionada (ya estaba bien)
      if (cuotaSeleccionada) {
        const cuotaDiv = cuotaSeleccionada.cloneNode(true);
        cuotaDiv.style.margin = "16px auto 0 auto";
        cuotaDiv.style.background = "#e8fff6";
        cuotaDiv.style.border = "2px solid #28D89E";
        cuotaDiv.style.borderRadius = "16px";
        cuotaDiv.style.width = "90%";
        cuotaDiv.style.display = "flex";
        cuotaDiv.style.justifyContent = "space-between";
        cuotaDiv.style.alignItems = "center";
        cuotaDiv.style.padding = "10px 18px";
        cuotaDiv.style.fontWeight = "bold";
        cuotaDiv.style.fontSize = "18px";
        tempDiv.appendChild(cuotaDiv);
      }

      // Insertar el contenedor temporal en el body (fuera de pantalla)
      tempDiv.style.position = "fixed";
      tempDiv.style.left = "-9999px";
      document.body.appendChild(tempDiv);

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

        // Mostrar el resultado
        if (nombre && typeof nombre === "string" && nombre.trim() !== "") {
          profileName.textContent = nombre;
        } else {
          profileName.textContent = "No encontrado";
        }

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
        const tituloVerde = document.querySelector(
          ".credit-status-title-verde"
        );
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
          let esViable = false;
          if (situacionesUltimoPeriodo.length === 0) {
            esViable = true;
          } else {
            esViable = situacionesUltimoPeriodo.every(
              (s) => s === "0" || s === "1" || s === "-"
            );
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
    // Menú hamburguesa estilo index.html
    const hamburguer = document.getElementById("hamburguer-menu");
    const menu = document.getElementById("menu");
    const overlay = document.getElementById("menu-overlay");

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
    hamburguer.addEventListener("click", (e) => {
      e.preventDefault();
      if (menu.classList.contains("mobile-active")) closeMenu();
      else openMenu();
    });
    overlay.addEventListener("click", closeMenu);
    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
  });


  document.addEventListener("DOMContentLoaded", () => {
    const closeBtn = document.getElementById("close-menu");
    if (closeBtn) {
      closeBtn.addEventListener("click", function (e) {
        e.preventDefault();
        // Llama a closeMenu solo si está en mobile
        if (window.innerWidth <= 1024) {
          const menu = document.getElementById("menu");
          const overlay = document.getElementById("menu-overlay");
          menu.classList.add("hidden");
          menu.classList.remove("mobile-active");
          overlay.classList.remove("active");
          document.body.classList.remove("menu-open");
        }
      });
    }
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
    prevBtn.addEventListener("click", function () {
      if (currentVideo > 0) showVideo(currentVideo - 1);
    });
    nextBtn.addEventListener("click", function () {
      if (currentVideo < videos.length - 1) showVideo(currentVideo + 1);
    });
    videoWrap.querySelector(".closebox").addEventListener("click", function () {
      videoWrap.classList.remove("playing");
      videoIframe.src = "";
    });
  });


 

  document.addEventListener("DOMContentLoaded", function () {
    // Mostrar la sección nosotros-cotizar al clickear en el menú
    document
      .querySelectorAll('a[data-url="#nosotros"]')
      .forEach(function (link) {
        link.addEventListener("click", function (e) {
          e.preventDefault();
          // Oculta todas las secciones principales
          document.querySelectorAll("main > section").forEach(function (sec) {
            sec.classList.add("hidden");
          });
          // Muestra la sección nosotros-cotizar
          document
            .getElementById("nosotros-cotizar")
            .classList.remove("hidden");
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
    function updateSwitchVisibility() {
      const dniContainer = document.querySelector("#step-1 .dni-container");
      const switchContainer = document.querySelector(
        "#step-1 .switch-container"
      );
      if (!dniContainer || !switchContainer) return;
      if (window.innerWidth >= 1025) {
        if (dniContainer.classList.contains("expanded")) {
          switchContainer.style.display = "none";
        } else {
          switchContainer.style.display = "flex";
        }
      } else {
        // En mobile, siempre visible (o según tu lógica)
        switchContainer.style.display = "";
      }
    }

    // Llama a la función al expandir/cerrar el popup
    const dniContainer = document.querySelector("#step-1 .dni-container");
    const searchIcon = document.querySelector("#step-1 .search-icon-container");
    const changeApplicantBtn = document.querySelector(
      "#step-1 .change-applicant-button"
    );
    if (searchIcon) {
      searchIcon.addEventListener("click", () => {
        setTimeout(updateSwitchVisibility, 700); // Cambia aquí el delay
      });
    }
    if (changeApplicantBtn) {
      changeApplicantBtn.addEventListener("click", () => {
        setTimeout(updateSwitchVisibility, 700); // Cambia aquí el delay
      });
    }

    // También al cambiar el tamaño de la ventana
    window.addEventListener("resize", updateSwitchVisibility);

    // Y al cargar la página
    updateSwitchVisibility();

    // Si tu showDropdown/hideDropdown cambian la clase 'expanded', puedes enganchar aquí:
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
    // Muestra la sección nosotros-cotizar
    document.getElementById("nosotros-cotizar").classList.remove("hidden");
    document.body.classList.add("nosotros-cotizar-activo");
    window.scrollTo(0, 0);
  }

  document.addEventListener("DOMContentLoaded", () => { 
    // Referencias necesarias
    const dniInput = document.querySelector(".dni-input");
    const indicator = document.querySelector(".credit-indicator");
    const changeApplicantBtn = document.querySelector(
      ".change-applicant-button"
    ); 
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
  const modal = document.getElementById('modal-personas-dni');
  const list = document.getElementById('modal-personas-list');
  if (!modal || !list) {
    console.error("No se encontró el modal o la lista para personas por DNI");
    return;
  }
  list.innerHTML = '';
  personas.forEach((persona, idx) => {
    const btn = document.createElement('button');
    btn.className = 'client-select-btn';
    btn.textContent = persona.nombreCompleto || persona.nombre || persona.razonSocial || persona.razon_social || 'Sin nombre';
    btn.onclick = async function () {
      console.log("Persona seleccionada en modal:", persona);
      modal.classList.add('hidden');
      modal.style.display = "none";
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
          profileName.textContent = nombre && typeof nombre === "string" && nombre.trim() !== "" ? nombre : "No encontrado";
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
          console.log("DEBUG BCRA (data.data.informe.bcra):", data.data.informe.bcra);
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
        console.error("Error consultando InfoExperto para persona seleccionada:", err);
      } finally {
        const loader = document.getElementById("loader-smiley");
        if (loader) loader.style.display = "none";
      }
    };
    list.appendChild(btn);
  });
  modal.classList.remove('hidden');
  modal.style.display = "flex";
  console.log("Modal de selección de persona mostrado");
}

document.addEventListener("DOMContentLoaded", function () {
  const btnCloseModalPersonas = document.getElementById('modal-personas-close');
  if (btnCloseModalPersonas) {
    btnCloseModalPersonas.onclick = function () {
      console.log("Modal de selección de persona cerrado por cancelar");
      const modal = document.getElementById('modal-personas-dni');
      modal.classList.add('hidden');
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
      const tituloAmarillo = document.querySelector(".credit-status-title-amarillo");
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
        personas = data.data.datos.map(p => ({
          nombreCompleto: p.nombre_completo || p.nombreCompleto || p.nombre || p.razonSocial || p.razon_social || "",
          dni: p.numero_documento || p.dni || "",
          cuit: p.cuit || "",
          ...p
        }));
      }

      if (personas.length > 1) {
        console.log("Se detectaron varias personas para el mismo DNI (modal):", personas);
        if (loader) loader.style.display = "none";
        mostrarModalPersonasDNI(personas, function (persona, nombreMostrado) {
          if (profileName) profileName.textContent = nombreMostrado;
          if (persona.dni || persona.numero_documento) sessionStorage.setItem("solicitante_dni", persona.dni || persona.numero_documento);
          if (nombreMostrado) sessionStorage.setItem("solicitante_nombre", nombreMostrado);
          showDropdown();
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
        profileName.textContent = persona.nombreCompleto || persona.nombre || persona.razonSocial || persona.razon_social || "Sin nombre";
        if (persona.dni) sessionStorage.setItem("solicitante_dni", persona.dni);
        if (profileName.textContent) sessionStorage.setItem("solicitante_nombre", profileName.textContent);
        if (loader) loader.style.display = "none";
        // --- SOLO mostrar informe.bcra ---
        if (data && data.data && data.data.informe && data.data.informe.bcra) {
          console.log("informe.bcra:", data.data.informe.bcra);
        }
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
          bcraDatos.forEach(entidad => {
            const nombreEntidad = entidad.nombre || entidad.entidad || "Entidad desconocida";
            if (Array.isArray(entidad.deudas)) {
              entidad.deudas.forEach(deuda => {
                if (deuda.periodo && deuda.situacion) {
                  console.log(
                    `[BCRA] Entidad: ${nombreEntidad} | Periodo: ${deuda.periodo} | Situación: ${deuda.situacion} | Monto: ${deuda.monto || "-"}`
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
        const nombreMostrado = persona.nombre_completo || persona.nombreCompleto || persona.nombre || persona.razonSocial || persona.razon_social || "Sin nombre";
        profileName.textContent = nombreMostrado;
        if (persona.dni || persona.numero_documento) sessionStorage.setItem("solicitante_dni", persona.dni || persona.numero_documento);
        if (nombreMostrado) sessionStorage.setItem("solicitante_nombre", nombreMostrado);
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
          bcraDatos.forEach(entidad => {
            const nombreEntidad = entidad.nombre || entidad.entidad || "Entidad desconocida";
            if (Array.isArray(entidad.deudas)) {
              entidad.deudas.forEach(deuda => {
                if (deuda.periodo && deuda.situacion) {
                  console.log(
                    `[BCRA] Entidad: ${nombreEntidad} | Periodo: ${deuda.periodo} | Situación: ${deuda.situacion} | Monto: ${deuda.monto || "-"}`
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


// --- NUEVO: Resetear selects dependientes al cambiar la categoría ---
document.addEventListener("DOMContentLoaded", () => {
  const categoriaOptions = document.getElementById("categoria-options");
  if (categoriaOptions) {
    categoriaOptions.addEventListener("click", (event) => {
      if (event.target.classList.contains("custom-option")) {
        // Resetear placeholders y valores de selects dependientes
        const anioPlaceholder = document.querySelector(
          '[onclick="toggleCustomOptions(\'anio-options\')"]'
        );
        const marcaPlaceholder = document.querySelector(
          '[onclick="toggleCustomOptions(\'marca-options\')"]'
        );
        const modeloPlaceholder = document.querySelector(
          '[onclick="toggleCustomOptions(\'modelo-options\')"]'
        );
        if (anioPlaceholder) {
          anioPlaceholder.textContent = "Año";
          anioPlaceholder.dataset.value = "";
        }
        if (marcaPlaceholder) {
          marcaPlaceholder.textContent = "Marca";
          marcaPlaceholder.dataset.value = "";
        }
        if (modeloPlaceholder) {
          modeloPlaceholder.textContent = "Modelo";
          modeloPlaceholder.dataset.value = "";
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

        // Limpiar logo del vehículo si existe
        const logo = document.getElementById("vehicle-logo");
        if (logo) {
          logo.src = "";
          logo.alt = "Logo de la marca";
        }
      }
    });
  }
});

// --- NUEVO: Resetear selects de pantalla 2 al volver a step 1 ---
document.addEventListener("DOMContentLoaded", () => {
  // Botón "Back" de step 2
  const backBtnStep2 = document.querySelector('#step-2 .back-button');
  if (backBtnStep2) {
    backBtnStep2.addEventListener("click", () => {
      // Resetear placeholders y valores de selects dependientes
      const categoriaPlaceholder = document.querySelector(
        '[onclick="toggleCustomOptions(\'categoria-options\')"]'
      );
      const anioPlaceholder = document.querySelector(
        '[onclick="toggleCustomOptions(\'anio-options\')"]'
      );
      const marcaPlaceholder = document.querySelector(
        '[onclick="toggleCustomOptions(\'marca-options\')"]'
      );
      const modeloPlaceholder = document.querySelector(
        '[onclick="toggleCustomOptions(\'modelo-options\')"]'
      );
      if (categoriaPlaceholder) {
        categoriaPlaceholder.textContent = "Categoría";
        categoriaPlaceholder.dataset.value = "";
      }
      if (anioPlaceholder) {
        anioPlaceholder.textContent = "Año";
        anioPlaceholder.dataset.value = "";
      }
      if (marcaPlaceholder) {
        marcaPlaceholder.textContent = "Marca";
        marcaPlaceholder.dataset.value = "";
      }
      if (modeloPlaceholder) {
        modeloPlaceholder.textContent = "Modelo";
        modeloPlaceholder.dataset.value = "";
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
  return yearPlaceholder?.dataset.value || yearPlaceholder?.textContent?.trim() || null;
}

// --- MODIFICAR evento del botón "Siguiente" de paso 2 ---
document.addEventListener("DOMContentLoaded", () => {
  const nextBtnStep2 = document.querySelector('.next-button[onclick="goToStep(3)"]');
  if (nextBtnStep2) {
    nextBtnStep2.addEventListener("click", async (event) => {
      event.preventDefault();

      // 1. Obtener codia y año seleccionados
      const codia = getSelectedCodia();
      const year = getSelectedYear();

      // --- DEBUG extra ---
      console.log("[DEBUG] codia:", codia, "year:", year);

      if (!codia || !year) {
        alert("Seleccioná año y modelo antes de avanzar.");
        return;
      }

      // --- OBTENER CATEGORIA CORRECTA ---
      const categoria = getSelectedCategoria(); // <-- AGREGADO

      // 2. Hacer fetch a curl.php para obtener el precio
      try {
        const body = {
          codia,
          year,
          accessToken: accessToken,
          action: "getPriceByCodia",
          categoria // <-- AGREGADO
        };
        const res = await fetch("php/curl.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });

        // Leer como texto y validar si es JSON
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error("Respuesta no es JSON:", text);
          alert("No se pudo obtener el precio del vehículo. Respuesta inesperada del servidor.");
          return;
        }

        accessToken = data.accessToken || accessToken;
        window.precioVehiculo = data.price;
        console.log("[DEBUG] Precio obtenido para codia", codia, "año", year, ":", window.precioVehiculo);
      } catch (err) {
        console.error("Error al obtener el precio del vehículo:", err);
        alert("No se pudo obtener el precio del vehículo.");
        return;
      }

      // --- NUEVO: LOG extra para verificar que window.precioVehiculo está seteado antes de avanzar ---
      console.log("[DEBUG] window.precioVehiculo antes de avanzar a paso 3:", window.precioVehiculo);

      // 3. Actualizar resumen del vehículo (opcional, ya lo hacías)
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
        console.log("[DEBUG] No se encontraron los placeholders de los selects.", { yearPlaceholder, brandPlaceholder, modelPlaceholder });
        return;
      }
      const yearText =
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

      document.getElementById("vehicle-brand").textContent = brand || "Marca";
      document.getElementById("vehicle-model").textContent = model || "Modelo";
      document.getElementById("vehicle-year").textContent = yearText || "Año";

      // 4. Avanzar a paso 3
      goToStep(3);
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
  if (ltv) {
    maxAFinanciar = Math.round(precio * ltv);
  }
  console.log("[MAXAFIN] Máximo a financiar calculado:", maxAFinanciar);

  // 5. Imprimir en pantalla (pantalla 3 y 4)
  const formatted = maxAFinanciar
    ? maxAFinanciar.toLocaleString("es-AR")
    : "0";
  const el3 = document.querySelector(".custom-summary-amount");
  if (el3) el3.textContent = formatted;
  const el4 = document.getElementById("custom-summary-amount-step4");
  if (el4) el4.textContent = formatted;

  // Actualizar el producto seleccionado en pantalla 4
  const selectedProductStep4 = document.getElementById("selected-product-step4");
  if (selectedProductStep4) {
    selectedProductStep4.textContent =
      producto === "a" ? "Seguro en Banco" : "Seguro Liberado";
  }
}

// --- CARGAR LTV DATA AL INICIO ---
document.addEventListener("DOMContentLoaded", () => {
  // Cargar ltvData global desde el backend (solo una vez)
  fetch(
    location.hostname === "localhost"
      ? "http://localhost:5000/api/calculadora"
      : "https://api.lever.com.ar/api/calculadora"
  )
    .then((res) => res.json())
    .then((data) => {
      window.ltvData = data.productos || {};
    });
});

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
    productOptions.addEventListener("click", () => setTimeout(actualizarCuotasPantalla4, 100));
  }
  // Y si cambia el año
  const anioOptions = document.getElementById("anio-options");
  if (anioOptions) {
    anioOptions.addEventListener("click", () => setTimeout(actualizarCuotasPantalla4, 100));
  }
}); 

async function fetchPriceFromInfoauto(codia, year) {
    const categoria = getSelectedCategoria(); // Obtener la categoría seleccionada
    const endpoint = categoria === "motos"
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
            alert("No se pudo obtener el precio del vehículo. Respuesta inesperada del servidor.");
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
function calcularCuotaFrancesa(monto, tasaAnual, plazo, fee) {
    // Fórmula sistema francés + comisión + IVA sobre intereses
    const interesMensual = (tasaAnual / 100) / 12;
    const comision = monto * (fee * 1.21);
    let saldo = monto + comision;
    const factor = Math.pow(1 + interesMensual, plazo);
    const cuotaMensual = saldo * interesMensual * factor / (factor - 1);

    let basePromedio = 0;
    let saldoRestante = saldo;
    for (let i = 1; i <= plazo; i++) {
        const interesCuota = saldoRestante * interesMensual;
        const iva = interesCuota * 0.21;
        const capitalCuota = cuotaMensual - interesCuota;
        const cuotaConIva = cuotaMensual + iva;
        saldoRestante -= capitalCuota;
        basePromedio += cuotaConIva;
    }
    return Math.round(basePromedio / plazo);
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
        const maxStr = document.querySelector(".custom-summary-amount")?.textContent?.replace(/\./g, "") || "0";
        monto = parseInt(maxStr, 10) || 0;
    }
    console.log("[CUOTAS] Monto a financiar:", monto);

    // 2. Producto seleccionado
    const productoPlaceholder = document.querySelector(
      `[onclick="toggleCustomOptions('product-options')"]`
    );
    let producto = productoPlaceholder?.dataset.value?.toLowerCase(); // Usar directamente 'a' o 'b'
    if (!producto) {
        console.error("[CUOTAS] Producto no seleccionado. No se puede calcular.");
        document.querySelectorAll("#step-4 .scrollable-value").forEach(el => el.textContent = "--");
        return;
    }

    // Mapear el producto seleccionado a las claves internas de ltvData
    if (producto === "seguro en banco") producto = "a";
    else if (producto === "seguro liberado") producto = "b";

    console.log("[CUOTAS] Producto seleccionado (clave):", producto);

    // Actualizar el producto seleccionado en pantalla 4
    const selectedProductStep4 = document.getElementById("selected-product-step4");
    if (selectedProductStep4) {
        selectedProductStep4.textContent =
            producto === "b" ? "Seguro Liberado" : "Seguro en Banco";
    }

    // 3. Año seleccionado
    const yearPlaceholder = document.querySelector(
      `[onclick="toggleCustomOptions('anio-options')"]`
    );
    const year = yearPlaceholder?.dataset.value || yearPlaceholder?.textContent?.trim() || null;
    console.log("[CUOTAS] Año seleccionado:", year);

    // 4. Validar datos de productos y plazos
    if (!window.ltvData) {
        console.error("[CUOTAS] ltvData no está cargado aún:", window.ltvData);
        document.querySelectorAll("#step-4 .scrollable-value").forEach(el => el.textContent = "--");
        return;
    }

    console.log("[CUOTAS] Estructura de ltvData:", JSON.stringify(window.ltvData, null, 2));

    const productoData = window.ltvData[producto]; // Usar directamente 'a' o 'b'
    if (!productoData) {
        console.error(`[CUOTAS] No hay datos para el producto seleccionado: ${producto}. Verifica que las claves en ltvData coincidan.`);
        document.querySelectorAll("#step-4 .scrollable-value").forEach(el => el.textContent = "--");
        return;
    }

    const plazos = productoData.plazos;
    if (!plazos) {
        console.error(`[CUOTAS] No hay plazos disponibles para el producto: ${producto}.`);
        document.querySelectorAll("#step-4 .scrollable-value").forEach(el => el.textContent = "--");
        return;
    }
    console.log("[CUOTAS] Plazos disponibles:", plazos);

    // 5. Calcular y mostrar cuotas para cada plazo
    const plazosMostrar = [12, 18, 24, 36, 48];
    plazosMostrar.forEach(plazo => {
        const plazoData = plazos[plazo];
        const cuotaEl = document.querySelectorAll("#step-4 .scrollable-item")[plazosMostrar.indexOf(plazo)]?.querySelector(".scrollable-value");
        if (plazoData && cuotaEl && monto >= 1000000) {
            const cuota = calcularCuotaFrancesa(monto, parseFloat(plazoData.interest), plazo, plazoData.fee);
            console.log(`[CUOTAS] Cuota calculada para ${plazo} meses:`, cuota);
            cuotaEl.innerHTML = "$" + cuota.toLocaleString("es-AR");
        } else if (cuotaEl) {
            cuotaEl.textContent = "--";
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    // Al avanzar a pantalla 4
    const nextBtnStep4 = document.querySelector('.next-button[onclick="goToStep(4)"]');
    if (nextBtnStep4) {
        nextBtnStep4.addEventListener("click", () => {
            setTimeout(actualizarCuotasPantalla4, 100); // Asegurar que las cuotas se actualicen correctamente
        });
    }
    // Si cambia el producto, monto o año, recalcular cuotas
    const input = document.querySelector(".net-finance-input");
    if (input) input.addEventListener("input", () => setTimeout(actualizarCuotasPantalla4, 100));
    const productOptions = document.getElementById("product-options");
    if (productOptions) productOptions.addEventListener("click", () => setTimeout(actualizarCuotasPantalla4, 100));
    const anioOptions = document.getElementById("anio-options");
    if (anioOptions) anioOptions.addEventListener("click", () => setTimeout(actualizarCuotasPantalla4, 100));
});

// --- HACER GLOBAL getSelectedCategoria ---
function getSelectedCategoria() {
  const catPlaceholder = document.querySelector(
    '[onclick="toggleCustomOptions(\'categoria-options\')"]'
  );
  if (!catPlaceholder) return "autos";
  const val = (catPlaceholder.dataset.value || catPlaceholder.textContent || "").toLowerCase();
  if (val.includes("moto")) return "motos";
  if (val.includes("utilitario") || val.includes("camion")) return "utilitarios";
  return "autos";
}

