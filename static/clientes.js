document.addEventListener("DOMContentLoaded", function () {
    const mainContent = document.getElementById("main-content");
    let customers = []; // Definimos customers como un array vacío
    let currentCustomerIndex = null;

    window.loadCustomersView = function() {
        mainContent.innerHTML = `
            <h1>Gestión de Clientes</h1>
            <div class="input-group">
                <label for="customerName">Nombre del Cliente:</label>
                <input type="text" id="customerName" placeholder="Nombre del Cliente" required>
            </div>
            <div class="input-group">
                <label for="customerPhone">Teléfono:</label>
                <input type="text" id="customerPhone" placeholder="Teléfono" required>
            </div>
            <button id="addUpdateCustomer">Agregar/Actualizar Cliente</button>
            <table id="customersTable">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Teléfono</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
            <a href="/" class="button">⬅️ Volver</a>
            <div id="serviceHistoryDialog" class="modal" style="display:none;">
                <div class="modal-content">
                    <h3>Historial de Servicios</h3>
                    <div id="historyListView" class="history-list"></div>
                    <button id="clearHistoryButton">Limpiar Historial</button>
                    <button id="closeDialogButton">Cerrar</button>
                </div>
            </div>
        `;
        loadCustomers();
        addEventListenersToCustomerView();
    };

    function addEventListenersToCustomerView() {
        const addUpdateCustomerButton = document.getElementById("addUpdateCustomer");
        addUpdateCustomerButton.addEventListener("click", addOrUpdateCustomer);
    }

    window.addOrUpdateCustomer = function() {
        const customerName = document.getElementById("customerName").value;
        const customerPhone = document.getElementById("customerPhone").value;

        if (!customerName || !customerPhone) {
            alert('Por favor, llena todos los campos.');
            return;
        }

        const payload = {
            name: customerName,
            phone: customerPhone
        };

        // Cambié esta línea para apuntar a la ruta de actualización correcta
        const endpoint = currentCustomerIndex !== null ? `/api/update_customer/${currentCustomerIndex}` : '/api/add_update_customer';

        fetch(endpoint, {
            method: currentCustomerIndex !== null ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(() => {
            loadCustomers();
            document.getElementById("customerName").value = '';
            document.getElementById("customerPhone").value = '';
            currentCustomerIndex = null;
        })
        .catch(error => console.error('Error al agregar/actualizar el cliente:', error));
    };

    function loadCustomers() {
        fetch('/api/get_all_customers')
            .then(response => response.json())
            .then(customersData => {
                console.log("Datos de clientes recibidos:", customersData); // Depuración
                customers = customersData.map(data => ({
                    id: data[0],
                    name: data[1],
                    phone: data[2]
                }));
                const customersTableBody = document.querySelector('#customersTable tbody');
                customersTableBody.innerHTML = '';
    
                customers.forEach((customer, index) => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${customer.name || 'Nombre no disponible'}</td>
                        <td>${customer.phone || 'Teléfono no disponible'}</td>
                        <td>
                            <button onclick="loadCustomerToEdit(${index})">Editar</button>
                            <button onclick="openServiceHistoryDialog(${customer.id})">Historial</button>
                            <button onclick="deleteCustomer(${customer.id})">Eliminar</button> <!-- Botón para eliminar -->
                        </td>
                    `;
                    customersTableBody.appendChild(row);
                });
            })
            .catch(error => console.error('Error al cargar clientes:', error));
    }

    window.loadCustomerToEdit = function(index) {
        if (customers.length === 0) {
            console.warn("No hay clientes disponibles para editar.");
            return; // Salir si no hay clientes
        }
    
        const customer = customers[index];
        if (!customer) {
            console.error(`Cliente no encontrado en el índice proporcionado: ${index}`);
            return; // Salir si el cliente no se encuentra
        }
    
        document.getElementById("customerName").value = customer.name;
        document.getElementById("customerPhone").value = customer.phone;
        currentCustomerIndex = customer.id; // Guardamos el ID del cliente para actualizar
    };

    window.deleteCustomer = function(customerId) {
        if (confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
            fetch(`/api/delete_customer/${customerId}`, { method: 'DELETE' })
                .then(() => {
                    alert('Cliente eliminado con éxito!');
                    loadCustomers(); // Actualizar la lista de clientes
                })
                .catch(error => console.error('Error al eliminar el cliente:', error));
        }
    };

    window.openServiceHistoryDialog = function(customerId) {
        fetch(`/api/get_service_history/${customerId}`)
            .then(response => response.json())
            .then(history => {
                const historyListView = document.getElementById("historyListView");
                historyListView.innerHTML = '';

                history.forEach(service => {
                    const div = document.createElement("div");
                    div.innerHTML = `Servicio: ${service.name}, Fecha: ${service.date}, Precio: Gs ${service.price.toLocaleString()}`;
                    historyListView.appendChild(div);
                });

                document.getElementById("serviceHistoryDialog").style.display = "block";
                document.getElementById("clearHistoryButton").onclick = function() {
                    clearServiceHistory(customerId);
                };
                document.getElementById("closeDialogButton").onclick = function() {
                    document.getElementById("serviceHistoryDialog").style.display = "none";
                };
            })
            .catch(error => console.error('Error al cargar el historial de servicios:', error));
    };

    window.clearServiceHistory = function(customerId) {
        fetch(`/api/clear_service_history/${customerId}`, { method: 'DELETE' })
            .then(() => {
                alert("Historial de servicios limpiado.");
                document.getElementById("serviceHistoryDialog").style.display = "none";
            })
            .catch(error => console.error('Error al limpiar el historial de servicios:', error));
    };

    loadCustomersView(); // Cargar vista inicial de clientes
});
