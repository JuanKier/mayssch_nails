document.addEventListener("DOMContentLoaded", function () {
    let editingServiceId = null; // Inicializa la variable global

    const addOrUpdateButton = document.getElementById("addOrUpdateService");
    
    if (addOrUpdateButton) {
        addOrUpdateButton.addEventListener("click", addOrUpdateService);
    } else {
        console.error("El botón 'addOrUpdateService' no se encontró en el DOM.");
    }

    // Función para cargar los servicios
    function loadServices() {
        const servicesTable = document.getElementById('services-table');

        fetch('/api/get_all_services')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al cargar los servicios: ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                servicesTable.innerHTML = ''; // Limpia la tabla

                console.log('Datos recibidos:', data); // Depuración: Verifica la estructura de los datos

                data.forEach(service => {
                    // Si los datos son un objeto, usa las propiedades directamente
                    const serviceName = service.name || 'Nombre no disponible';
                    const servicePrice = service.price !== undefined ? `$${service.price.toFixed(2)}` : 'Precio no disponible';

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${serviceName}</td>
                        <td>${servicePrice}</td>
                        <td>
                            <button onclick="editService(${service.id}, '${serviceName}', ${service.price})">Editar</button>
                            <button onclick="deleteService(${service.id})">Eliminar</button>
                        </td>
                    `;
                    servicesTable.appendChild(row);
                });
            })
            .catch(error => console.error('Error al cargar los servicios:', error));
    }

    // Definición de la función addOrUpdateService
    window.addOrUpdateService = function() {
        console.log("addOrUpdateService called");
        const serviceName = document.getElementById('service-name').value;
        const servicePrice = document.getElementById('service-price').value;

        if (!serviceName || !servicePrice) {
            alert('Por favor, llena todos los campos.');
            return;
        }

        const priceNumber = parseFloat(servicePrice.replace(/[.,]/g, ''));
        if (isNaN(priceNumber)) {
            alert('El precio debe ser un número válido.');
            return;
        }

        const endpoint = editingServiceId ? '/api/update_service' : '/api/add_service';
        const payload = {
            id: editingServiceId,
            name: serviceName,
            price: priceNumber
        };

        fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(() => {
            loadServices(); // Recarga la lista de servicios
            document.getElementById('service-name').value = ''; // Limpia el campo de nombre
            document.getElementById('service-price').value = ''; // Limpia el campo de precio
            editingServiceId = null; // Resetea el ID de edición
        })
        .catch(error => console.error('Error al guardar el servicio:', error));
    };

    // Función para editar servicio
    window.editService = function(id, name, price) {
        editingServiceId = id; // Guarda el ID del servicio a editar
        document.getElementById('service-name').value = name; // Rellena el campo de nombre
        document.getElementById('service-price').value = price; // Rellena el campo de precio
    };

    // Función para eliminar servicio
    window.deleteService = function(id) {
        fetch(`/api/delete_service/${id}`, { method: 'DELETE' })
            .then(() => loadServices()) // Recarga la lista de servicios después de eliminar
            .catch(error => console.error('Error al eliminar el servicio:', error));
    };

    loadServices(); // Cargar los servicios al inicio
});
