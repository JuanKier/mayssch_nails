document.addEventListener("DOMContentLoaded", function () {
    const mainContent = document.getElementById("main-content");
    loadClients();
    loadServicesList();
    if (!mainContent) {
        console.error('Elemento main-content no encontrado.');
        return;
    }

    let selectedClientId = null;
    let customers = [];

    function loadAppointments() {
        fetch('/api/get_all_appointments')
            .then(response => response.json())
            .then(appointments => {
                const appointmentTableBody = document.querySelector('#appointmentTable tbody');
                if (!appointmentTableBody) {
                    console.error('Elemento tbody de appointmentTable no encontrado.');
                    return;
                }
                appointmentTableBody.innerHTML = '';
    
                appointments.forEach(appointment => {
                    const row = document.createElement('tr');
                    row.setAttribute('data-id', appointment.id);  // Agregar ID como atributo de datos
                    row.innerHTML = `
                        <td>${appointment.name || 'Nombre no disponible'}</td>
                        <td>${appointment.date || 'Fecha no disponible'}</td>
                        <td>${appointment.dayOfWeek || 'Día no disponible'}</td>
                        <td>${appointment.time || 'Hora no disponible'}</td>
                        <td>${appointment.service_name || 'Servicio no disponible'}</td>
                        <td>
                            <button onclick="editAppointment(${appointment.id})">Editar</button>
                            <button onclick="deleteAppointment(${appointment.id})">Eliminar</button>
                        </td>
                    `;
                    appointmentTableBody.appendChild(row);
                });
                
            })
            .catch(error => console.error('Error al cargar citas:', error));
    }
    

    window.loadAppointmentsView = function() {
        mainContent.innerHTML = ` 
            <h1>Gestión de Citas</h1>
            <div class="input-group">
                <label for="clientSearch">Nombre del Cliente:</label>
                <input type="text" id="clientSearch" list="customerList" placeholder="Buscar Cliente" required>
                <datalist id="customerList"></datalist> <!-- Datalist para autocompletar -->
            </div>
            <div class="input-group">
                <label for="phone">Teléfono del Cliente:</label>
                <input type="text" id="phone" placeholder="Teléfono" readonly> <!-- Solo lectura, se llena al seleccionar cliente -->
            </div>
            <div class="input-group">
                <label for="date">Selecciona una fecha:</label>
                <input type="date" id="date" onchange="updateDayOfWeek()" />
                
            </div>
            <div class="form-group">
                <label for="time">Hora</label>
                <select id="time">
                    <option value="07:00">07:00</option>
                    <option value="08:00">08:00</option>
                    <option value="09:00">09:00</option>
                    <option value="10:00">10:00</option>
                    <option value="11:00">11:00</option>
                    <option value="12:00">12:00</option>
                    <option value="13:00">13:00</option>
                    <option value="14:00">14:00</option>
                    <option value="15:00">15:00</option>
                    <option value="16:00">16:00</option>
                    <option value="17:00">17:00</option>
                    <option value="18:00">18:00</option>
                    <option value="19:00">19:00</option>
                    <option value="20:00">20:00</option>
                    <option value="21:00">21:00</option>
                    <option value="22:00">22:00</option>
                    <option value="23:00">23:00</option>
                </select>
            </div>
            <div class="form-group">
                <label for="service">Servicio</label>
                <select id="service"></select>
            </div>
            <div class="form-group">
                <label for="status">Estado</label>
                <select id="status">
                    <option value="Pendiente">Pendiente</option>
                    <option value="Finalizado">Finalizado</option>
                </select>
            </div>
            <div class="button-group">
                <button class="large-button" onclick="addOrUpdateAppointment()">📅 Agendar Cita</button>
                <button class="large-button" onclick="clearAppointments()">🗑️ Limpiar Citas</button>
            </div>
            <h2>Lista de Citas</h2>
            <table id="appointmentTable">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Fecha</th>
                        <th>Día</th>
                        <th>Hora</th>
                        <th>Servicio</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
            <a href="/" class="button">⬅️ Volver</a>
        `;
        loadAppointments();
    };

    loadClients();

    function loadClients() {
        fetch('/api/customers')
            .then(response => response.json())
            .then(data => {
                const customers = data; // Los datos que recibes de la API
                console.log("Clientes cargados:", customers);
    
                const customerList = document.getElementById("customerList");
                const phoneInput = document.getElementById("phone");
                
                if (!customerList) {
                    console.error('Elemento customerList no encontrado.');
                    return;
                }
    
                customerList.innerHTML = ''; // Limpiar la lista de clientes
    
                // Agregar solo el nombre al datalist
                customers.forEach(customer => {
                    const option = document.createElement('option');
                    option.value = customer.name; // Solo mostrar el nombre en la sugerencia
                    option.dataset.phone = customer.phone; // Guardar el teléfono como dato
                    customerList.appendChild(option);
                });
    
                // Agregar un evento para llenar el campo de teléfono cuando se seleccione un cliente
                const clientSearchInput = document.getElementById("clientSearch");
                clientSearchInput.addEventListener('input', function() {
                    const selectedOption = Array.from(customerList.options).find(option => option.value === clientSearchInput.value);
                    if (selectedOption) {
                        phoneInput.value = selectedOption.dataset.phone; // Llenar el teléfono
                    } else {
                        phoneInput.value = ''; // Limpiar el teléfono si no se encuentra el cliente
                    }
                });
            })
            .catch(error => console.error('Error al cargar clientes:', error));
    }

    window.updateCustomerInfo = function() {
        const clientSearchInput = document.getElementById('clientSearch');
        const clientSearchValue = clientSearchInput.value.trim().toLowerCase();
    
        if (!customers || customers.length === 0) {
            console.warn("La lista de clientes no está disponible o está vacía.");
            return;
        }
    
        console.log("Buscando cliente:", clientSearchValue);
        const selectedClient = customers.find(client => client.name && client.name.toLowerCase().includes(clientSearchValue));
    
        const phoneField = document.getElementById("phone");
        if (!phoneField) {
            console.error("Elemento con id 'phone' no encontrado.");
            return;
        }
    
        if (selectedClient) {
            phoneField.value = selectedClient.phone;
            console.log("Cliente encontrado:", selectedClient);
        } else {
            phoneField.value = '';
            console.log("No se encontró ningún cliente con ese nombre.");
        }
    };
    

    window.scheduleAppointment = function() {
        const appointmentDate = document.getElementById("date").value;

        if (!selectedClientId || !appointmentDate) {
            alert('Por favor, selecciona un cliente y una fecha.');
            return;
        }

        const payload = {
            clientId: selectedClientId,
            date: appointmentDate
        };

        fetch('/api/schedule_appointment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(() => {
            alert("Cita programada.");
            loadClients();
            document.getElementById("appointmentForm").style.display = "none";
            selectedClientId = null;
        })
        .catch(error => console.error('Error al programar la cita:', error));
    };
        
    window.addOrUpdateAppointment = function() {
        const name = document.getElementById("clientSearch").value;
        const phone = document.getElementById("phone").value;
        const date = document.getElementById("date").value;
        const time = document.getElementById("time").value;
        const serviceSelect = document.getElementById("service");
        const service = serviceSelect ? serviceSelect.value : ''; // Asegúrate de usar el ID del servicio seleccionado
        const status = document.getElementById("status").value;
    
        if (!name || !date || !time || !service) {
            alert('Por favor, llena todos los campos.');
            return;
        }
    
        const payload = {
            name,
            phone,
            date,
            time,
            service_id: service, // Asegúrate de enviar el service_id
            status
        };
        console.log("Payload enviado:", payload);  // Para depuración
    
        fetch('/api/add_appointment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(error => { throw new Error(error.message); });
            }
            return response.json();
        })
        .then(data => {
            console.log("Cita agregada:", data);
            loadAppointments();
        })
        .catch(error => {
            console.error('Error al agregar/actualizar cita:', error);
            alert(`Error: ${error.message}`);
        });
    };
    
    
    
    window.clearAppointments = function() {
        const appointmentTableBody = document.querySelector('#appointmentTable tbody');
        if (appointmentTableBody) {
            appointmentTableBody.innerHTML = '';
        }
    };

    window.editAppointment = function(id) {
        fetch(`/api/get_appointment/${id}`)
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(`Error: ${response.status} - ${text}`);
                    });
                }
                return response.json();
            })
            .then(appointment => {
                console.log(appointment);  // Verifica que el JSON sea correcto
                
                // Rellenar el formulario con los datos de la cita
                document.getElementById("clientSearch").value = appointment.customer_name || '';
                document.getElementById("phone").value = appointment.customer_phone || '';
                document.getElementById("date").value = appointment.date || '';
                document.getElementById("time").value = appointment.time || '';
                
                // Rellenar el select de servicios con el servicio correspondiente
                const serviceSelect = document.getElementById("service");
                if (serviceSelect) {
                    serviceSelect.value = appointment.service_id || '';  // Asigna el valor del servicio
                }
    
                // Rellenar el select de estado con el estado de la cita
                const statusSelect = document.getElementById("status");
                if (statusSelect) {
                    statusSelect.value = appointment.status || '';  // Asigna el estado de la cita
                }
    
                // Cambiar el botón para indicar que estamos editando
                const submitButton = document.querySelector("button[onclick='addOrUpdateAppointment()']");
                submitButton.innerText = "Actualizar Cita";
                submitButton.setAttribute('onclick', `updateAppointment(${appointment.id})`);
            })
            .catch(error => {
                console.error('Error al cargar cita:', error);
                alert('Error al cargar cita: ' + error.message);
            });
    };
    

    window.deleteAppointment = function(id) {
        fetch(`/api/delete_appointment/${id}`, { method: 'DELETE' })
            .then(() => loadAppointments())
            .catch(error => console.error('Error al eliminar cita:', error));
    };

    window.updateDayOfWeek = function() {
        const dateInput = document.getElementById("date").value;
        const dayOfWeekElement = document.getElementById("dayOfWeek");
    
        // Comprobar si el elemento #dayOfWeek existe
        if (!dayOfWeekElement) {
            console.error("Elemento #dayOfWeek no encontrado.");
            return;  // Si no se encuentra el elemento, salir de la función
        }
    
        if (dateInput) {
            const date = new Date(dateInput);  // No necesitamos dividir la fecha manualmente
            const options = { weekday: 'long' };  // Solo necesitamos el nombre del día
            dayOfWeekElement.innerText = date.toLocaleDateString('es-ES', options);
            dayOfWeekElement.style.display = 'block';  // Mostrar el día de la semana
        } else {
            dayOfWeekElement.innerText = '';
            dayOfWeekElement.style.display = 'none';  // Ocultar si no hay fecha seleccionada
        }
    };
    
    
    function loadServicesList() {
        fetch('/api/get_all_services')
            .then(response => response.json())
            .then(services => {
                const serviceSelect = document.getElementById("service");
                if (!serviceSelect) {
                    console.error('Elemento service no encontrado.');
                    return;
                }
                serviceSelect.innerHTML = ''; // Limpiar opciones existentes
                
                services.forEach(service => {
                    const option = document.createElement('option');
                    option.value = service.id; // El ID del servicio es el valor
                    option.textContent = service.name; // Nombre del servicio es el texto
                    serviceSelect.appendChild(option);
                });
            })
            .catch(error => console.error('Error al cargar servicios:', error));
    }
    
    window.updateAppointment = function(id) {
        const name = document.getElementById("clientSearch").value;
        const phone = document.getElementById("phone").value;
        const date = document.getElementById("date").value;
        const time = document.getElementById("time").value;
        const serviceSelect = document.getElementById("service");
        const service = serviceSelect ? serviceSelect.value : '';  // Asegúrate de que el ID del servicio esté bien
        const status = document.getElementById("status").value;
    
        if (!name || !date || !time || !service) {
            alert('Por favor, llena todos los campos.');
            return;
        }
    
        const payload = {
            id,  // Asegúrate de incluir el ID de la cita
            name,
            phone,
            date,
            time,
            service_id: service,  // Enviar el service_id correctamente
            status
        };
    
        console.log("Payload enviado:", payload);  // Muestra el payload en la consola para depuración
    
        fetch('/api/update_appointment', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(response => response.json())  // Asegúrate de convertir la respuesta a JSON
        .then(data => {
            console.log("Cita actualizada:", data);
    
            // Asegúrate de que la fila con el data-id esté presente
            const row = document.querySelector(`#appointmentTable tbody tr[data-id='${id}']`);
            if (row) {
                // Actualiza los valores de la fila con los datos de la respuesta
                row.querySelector('td:nth-child(1)').innerText = data.customer_name;
                row.querySelector('td:nth-child(2)').innerText = data.date;
                row.querySelector('td:nth-child(3)').innerText = data.dayOfWeek;  // Asegúrate de que esta propiedad esté en la respuesta
                row.querySelector('td:nth-child(4)').innerText = data.time;
                row.querySelector('td:nth-child(5)').innerText = data.service_name;
            } else {
                console.error(`Fila no encontrada para el id: ${id}`);
            }
    
            // Cambia el botón de "Actualizar Cita" a "Agendar Cita"
            const submitButton = document.querySelector("button[onclick='addOrUpdateAppointment()']");
            submitButton.innerText = "Agendar Cita";
            submitButton.setAttribute('onclick', 'addOrUpdateAppointment()');
        })
        .catch(error => {
            console.error('Error al actualizar cita:', error);
            alert(`Error: ${error.message}`);
        });
    };
    
    
    // Llamada final a la vista de citas
    loadAppointmentsView();
});
