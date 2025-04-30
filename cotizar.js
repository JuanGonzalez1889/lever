// No se requiere lógica adicional para los selects

function goToStep(step) {
    document.querySelectorAll('.step').forEach((stepDiv, index) => {
        stepDiv.classList.remove('active');
        stepDiv.classList.add('hidden');
        const backButton = stepDiv.querySelector('.back-button');
        if (backButton) {
            backButton.classList.toggle('hidden', step === 1);
        }
    });
    const targetStep = document.getElementById(`step-${step}`);
    if (targetStep) {
        targetStep.classList.add('active');
        targetStep.classList.remove('hidden');
    }
}

// Inicializamos el paso 1 como activo
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('step-1').classList.add('active');
    document.querySelectorAll('.custom-select-container').forEach((container, index, containers) => {
        const placeholder = container.querySelector('.custom-select-placeholder');
        const options = container.querySelector('.custom-select-options');

        // Función para ajustar el margen dinámico de los selects inferiores
        const adjustNextSelects = (isExpanded) => {
            const nextContainers = Array.from(containers).slice(index + 1);
            const margin = isExpanded ? `${options.scrollHeight + 15}px` : '15px';
            nextContainers.forEach(nextContainer => {
                nextContainer.style.marginTop = margin;
            });
        };

        // Abrir o cerrar las opciones al hacer clic en el placeholder
        placeholder.addEventListener('click', (event) => {
            event.stopPropagation(); // Evitar que el evento se propague
            const allOptions = document.querySelectorAll('.custom-select-options');
            const allContainers = document.querySelectorAll('.custom-select-container');

            // Cerrar todos los selects abiertos
            allOptions.forEach(opt => opt.classList.remove('active'));
            allContainers.forEach(cont => cont.style.marginTop = '15px'); // Resetear márgenes

            if (!options.classList.contains('active')) {
                options.classList.add('active');
                adjustNextSelects(true); // Desplazar los selects inferiores
            } else {
                options.classList.remove('active');
                adjustNextSelects(false); // Volver a la posición original
            }
        });

        // Seleccionar una opción
        options.addEventListener('click', (event) => {
            if (event.target.classList.contains('custom-option')) {
                placeholder.textContent = event.target.textContent;
                placeholder.dataset.value = event.target.dataset.value;
                options.classList.remove('active');
                adjustNextSelects(false); // Volver a la posición original
            }
        });

        // Cerrar las opciones si se hace clic fuera del contenedor
        document.addEventListener('click', () => {
            options.classList.remove('active');
            adjustNextSelects(false); // Volver a la posición original
        });
    });
});
