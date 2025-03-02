document.addEventListener('DOMContentLoaded', (event) => {
    console.log('DOM completamente cargado y analizado'); // Mensaje de depuración

    // Cargar los datos actuales del archivo calculadora.txt sin usar la caché del navegador
    fetch('files/calculadora.txt?' + new Date().getTime())
        .then(response => response.json())
        .then(data => {
            console.log('Datos cargados:', data); // Mensaje de depuración
            // Rellenar el formulario con los datos actuales
            const minAFinanciar = document.getElementById('minAFinanciar');
            if (minAFinanciar) {
                minAFinanciar.value = data.minAFinanciar.valor;
            }

            const productoSelect = document.getElementById('productoSelect');
            productoSelect.addEventListener('change', function() {
                const selectedProduct = this.value;
                const productoForm = document.getElementById('productoForm');
                const plazosContainer = document.getElementById('plazosContainer');
                productoForm.innerHTML = ''; // Limpiar el formulario anterior

                if (selectedProduct === 'a' || selectedProduct === 'b') {
                    const productoData = data.productos[selectedProduct];
                    let formHtml = `<h2>Producto ${selectedProduct.toUpperCase()}</h2>`;
                    for (const plazo in productoData.plazos) {
                        formHtml += generarPlazoHtml(selectedProduct, plazo, productoData.plazos[plazo]);
                    }
                    productoForm.innerHTML = formHtml;
                    productoForm.style.display = 'block';
                    plazosContainer.style.display = 'block';
                } else {
                    productoForm.style.display = 'none';
                    plazosContainer.style.display = 'none';
                }
            });
        })
        .catch(error => {
            console.error('Error al cargar los datos:', error);
        });

    // Mostrar el popup modal
    const modal = document.getElementById('myModal');
    const span = document.getElementsByClassName('close')[0];

    if (span) {
        span.onclick = function() {
            modal.style.display = 'none';
        }
    } else {
        console.error('Elemento con clase "close" no encontrado'); // Mensaje de depuración
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
});

function generarPlazoHtml(producto, plazo, datos) {
    return `
        <div id="${producto}${plazo}Form">
            <label for="${producto}${plazo}Interest">Interés ${plazo} meses:</label>
            <input type="number" id="${producto}${plazo}Interest" name="${producto}${plazo}Interest" value="${datos.interest}" required>
            <label for="${producto}${plazo}Fee">Fee ${plazo} meses:</label>
            <input type="number" id="${producto}${plazo}Fee" name="${producto}${plazo}Fee" value="${datos.fee}" required>
            <label for="${producto}${plazo}MinFee">Min Fee ${plazo} meses:</label>
            <input type="number" id="${producto}${plazo}MinFee" name="${producto}${plazo}MinFee" value="${datos.minfee}" required>
            <button type="button" onclick="confirmarEliminarPlazo('${producto}', '${plazo}')">Eliminar Plazo</button>
        </div>
    `;
}

function agregarPlazo() {
    const productoSelect = document.getElementById('productoSelect').value;
    const productoForm = document.getElementById('productoForm');
    const nuevoPlazo = prompt('Ingrese el nuevo plazo en meses:');
    if (nuevoPlazo) {
        const nuevoPlazoHtml = generarPlazoHtml(productoSelect, nuevoPlazo, { interest: '', fee: '', minfee: '' });
        productoForm.insertAdjacentHTML('beforeend', nuevoPlazoHtml);
    }
}

function confirmarEliminarPlazo(producto, plazo) {
    const confirmacion = confirm('¿Está seguro que desea eliminar el plazo seleccionado?');
    if (confirmacion) {
        eliminarPlazo(producto, plazo);
    }
}

function eliminarPlazo(producto, plazo) {
    const plazoForm = document.getElementById(`${producto}${plazo}Form`);
    if (plazoForm) {
        plazoForm.remove();
    }
}

function guardarCambios() {
    console.log('Guardando cambios'); // Mensaje de depuración

    const minAFinanciar = document.getElementById('minAFinanciar').value;
    const productoSelect = document.getElementById('productoSelect').value;
    const productoForm = document.getElementById('productoForm');
    const inputs = productoForm.querySelectorAll('input');

    const data = {
        minAFinanciar: { valor: minAFinanciar },
        productos: {
            [productoSelect]: {
                plazos: {}
            }
        }
    };

    inputs.forEach(input => {
        const [product, plazo, field] = input.id.split(/(\d+)/);
        if (!data.productos[productoSelect].plazos[plazo]) {
            data.productos[productoSelect].plazos[plazo] = {};
        }
        data.productos[productoSelect].plazos[plazo][field.toLowerCase()] = input.value;
    });

    fetch('guardar.php?' + new Date().getTime(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            // Mostrar el popup modal
            const modal = document.getElementById('myModal');
            if (modal) {
                modal.style.display = 'block';
            }
        } else {
            alert('Error al guardar los cambios');
        }
    });
}
