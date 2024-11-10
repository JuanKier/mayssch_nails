from flask import Flask, render_template, jsonify, request
from datetime import datetime
import locale
locale.setlocale(locale.LC_TIME, 'es_ES.UTF-8')

from database import (
    create_tables,
    get_all_services,
    insert_service,
    insert_or_update_customer,
    insert_appointment,
    get_all_appointments,
    delete_appointment,
    clear_appointments,
    get_all_customers,
    delete_customer,
    get_service_history,
    clear_service_history,
    delete_service,
    update_service,
    find_customer,
    insert_customer,
    get_appointment_by_id  # Asegúrate de que esta función esté en tu módulo
)

app = Flask(__name__)

# Llama a create_tables para asegurarte de que las tablas existen al iniciar la aplicación
create_tables()

@app.route('/api/update_appointment', methods=['PUT'])
def update_appointment():
    data = request.get_json()
    # Lógica para actualizar la cita en la base de datos
    return jsonify({"message": "Cita actualizada exitosamente"})

@app.route('/api/appointments', methods=['GET'])
def get_appointments():
    appointments = get_all_appointments()
    return jsonify(appointments)

@app.route('/api/get_all_services', methods=['GET'])
def get_all_services_route():
    services = get_all_services()
    return jsonify(services)

@app.route('/api/add_service', methods=['POST'])
def add_service():
    service_data = request.json
    if 'name' in service_data and 'price' in service_data:
        insert_service(service_data['name'], service_data['price'])
        return jsonify({"message": "Service added successfully"}), 201
    return jsonify({"message": "Invalid data"}), 400

@app.route('/api/get_appointment/<int:id>', methods=['GET'])
def get_appointment(id):
    appointment = get_appointment_by_id(id)  # Función que obtiene la cita de la base de datos
    if appointment:
        return jsonify(appointment), 200
    else:
        return jsonify({"error": "Cita no encontrada"}), 404

@app.route('/api/get_all_appointments', methods=['GET'])
def get_all_appointments_route():

    appointments = get_all_appointments()

    formatted_appointments = []
    for appointment in appointments:
        print("Appointment:", appointment)  # Verifica cómo luce cada cita
        print("Fecha original:", appointment[3])  # Asumimos que la fecha está en el índice 3

        if appointment[3]:  # Verifica que la fecha no esté vacía o sea None
            try:
                # Ajusta el formato según el formato real de la fecha en la base de datos
                date_obj = datetime.strptime(appointment[3], '%Y-%m-%d')  # Cambia el formato si es necesario
                day_of_week = date_obj.strftime('%A')  # Día de la semana en español
                formatted_date = date_obj.strftime('%d/%m/%Y')  # Fecha formateada como DD/MM/YYYY
            except ValueError:
                formatted_date = 'Fecha no válida'
                day_of_week = 'Día no disponible'
        else:
            formatted_date = 'Fecha no disponible'
            day_of_week = 'Día no disponible'

        formatted_appointments.append({
            'id': appointment[0],  # ID de la cita
            'name': appointment[1],  # Nombre del cliente
            'date': formatted_date,  # Fecha formateada
            'dayOfWeek': day_of_week,  # Día de la semana
            'time': appointment[4],  # Hora de la cita
            'service_name': appointment[5],  # Nombre del servicio
            'status': appointment[6]  # Estado de la cita
        })

    return jsonify(formatted_appointments)

@app.route('/api/add_appointment', methods=['POST'])
def add_appointment():
    try:
        data = request.json
        service_id = data.get('service_id')
        if not service_id:
            return jsonify({"message": "El servicio no fue seleccionado."}), 400
        if not data:
            return jsonify({"message": "No se recibieron datos"}), 400

        # Validar los campos requeridos
        required_fields = ['name', 'phone', 'date', 'time', 'service_id', 'status']
        for field in required_fields:
            if field not in data:
                return jsonify({"message": f"Falta el campo requerido: {field}"}), 400

        # Buscar o crear el cliente
        customer = find_customer(data['name'], data['phone'])
        if not customer:
            insert_customer(data['name'], data['phone'])
            customer = find_customer(data['name'], data['phone'])
        customer_id = customer[0]  # Obtener el ID del cliente

        # Insertar la cita
        appointment_id = insert_appointment(customer_id, data['date'], data['time'], data['service_id'], data['status'])

        return jsonify({"message": "Cita agregada con éxito!", "appointment_id": appointment_id}), 201
    except Exception as e:
        return jsonify({"message": "Error interno del servidor", "error": str(e)}), 500


@app.route('/api/delete_appointment/<int:id>', methods=['DELETE'])
def delete_appointment_route(id):
    delete_appointment(id)
    return jsonify({"message": "Cita eliminada con éxito!"})

@app.route('/api/clear_appointments', methods=['POST'])
def clear_appointments_route():
    data = request.json
    clear_appointments(data['date'])
    return jsonify({"message": "Citas limpiadas con éxito!"})

@app.route('/api/get_services', methods=['GET'])
def get_services():
    services = get_all_services()
    return jsonify(services)

@app.route('/api/get_all_customers', methods=['GET'])
def get_all_customers_route():
    customers = get_all_customers()
    return jsonify(customers)

@app.route('/api/add_update_customer', methods=['POST'])
def add_update_customer():
    try:
        data = request.json
        if 'name' not in data or 'phone' not in data:
            return jsonify({"error": "El nombre y el teléfono son requeridos."}), 400

        insert_or_update_customer(data['name'], data['phone'])
        return jsonify({"message": "Cliente agregado/actualizado con éxito!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/update_customer/<int:id>', methods=['PUT'])
def update_customer_route(id):
    try:
        data = request.json
        if 'name' not in data or 'phone' not in data:
            return jsonify({"error": "El nombre y el teléfono son requeridos."}), 400
        
        # Aquí debes incluir tu lógica para actualizar el cliente en la base de datos
        insert_or_update_customer(data['name'], data['phone'], customer_id=id)  # Asegúrate de tener la lógica adecuada para manejar la actualización
        return jsonify({"message": "Cliente actualizado con éxito!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/delete_customer/<int:id>', methods=['DELETE'])
def delete_customer_route(id):
    delete_customer(id)
    return jsonify({"message": "Cliente eliminado con éxito!"})

@app.route('/api/get_service_history/<int:customer_id>', methods=['GET'])
def get_service_history_route(customer_id):
    history = get_service_history(customer_id)
    return jsonify(history)

@app.route('/api/clear_service_history/<int:customer_id>', methods=['DELETE'])
def clear_service_history_route(customer_id):
    clear_service_history(customer_id)
    return jsonify({"message": "Historial de servicios limpiado con éxito!"})

@app.route('/api/customers', methods=['GET'])
def get_customers():
    customers = get_all_customers()
    customer_list = [{"id": c[0], "name": c[1], "phone": c[2]} for c in customers]
    return jsonify(customer_list)

@app.route('/api/update_service', methods=['POST'])
def update_service_route():
    try:
        service_data = request.json
        if 'id' not in service_data or 'name' not in service_data or 'price' not in service_data:
            return jsonify({"message": "Invalid data"}), 400

        # Asegúrate de que la lógica para actualizar el servicio está bien definida
        update_service(service_data['id'], service_data['name'], service_data['price'])
        return jsonify({"message": "Service updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/delete_service/<int:id>', methods=['DELETE'])
def delete_service_route(id):
    delete_service(id)  # Cambia esto a tu lógica de eliminación
    return jsonify({"message": "Service deleted successfully!"}), 200

# Ruta para servir el archivo `citas.html`
@app.route('/citas')
def citas():
    return render_template('citas.html')

@app.route('/clientes')
def clientes():
    return render_template('clientes.html')

@app.route('/servicios')
def servicios():
    return render_template('servicios.html')

@app.route('/')
def main():
    return render_template('main.html')  # Cambiado a clientes.html para mostrar la página de gestión de clientes

if __name__ == '__main__':
    app.run(debug=True)
