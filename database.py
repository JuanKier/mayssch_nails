import sqlite3
from datetime import datetime

# Función para conectar a la base de datos
def connect():
    return sqlite3.connect("appointments.db")

# Función para crear tablas
def create_tables():
    with connect() as conn:
        cursor = conn.cursor()
        cursor.execute('''CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL)''')
        cursor.execute('''CREATE TABLE IF NOT EXISTS services (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL)''')
        cursor.execute('''CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            service_id INTEGER,
            status TEXT NOT NULL DEFAULT 'Pendiente',
            is_deleted BOOLEAN DEFAULT FALSE,
            FOREIGN KEY (customer_id) REFERENCES customers (id),
            FOREIGN KEY (service_id) REFERENCES services (id))''')
        cursor.execute('''CREATE TABLE IF NOT EXISTS service_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER,
            service_id INTEGER,
            appointment_date TEXT,
            appointment_time TEXT,
            FOREIGN KEY (customer_id) REFERENCES customers (id),
            FOREIGN KEY (service_id) REFERENCES services (id))''')
        conn.commit()

# Función auxiliar para ejecutar consultas
def execute_query(query, params=()):
    with connect() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        conn.commit()

# Funciones CRUD para clientes

def insert_customer(name, phone):
    with connect() as conn:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO customers (name, phone) VALUES (?, ?)", (name, phone))
        return cursor.lastrowid  # Devuelve el ID del cliente insertado

def update_customer(customer_id, name, phone):
    execute_query("UPDATE customers SET name = ?, phone = ? WHERE id = ?", (name, phone, customer_id))

def delete_customer(customer_id):
    execute_query("DELETE FROM customers WHERE id = ?", (customer_id,))

def get_all_customers():
    with connect() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM customers')
        return cursor.fetchall()

# Función para buscar un cliente por nombre y teléfono
def find_customer(name, phone):
    with connect() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM customers WHERE name = ? AND phone = ?', (name, phone))
        return cursor.fetchone()  # Devuelve el cliente encontrado o None si no existe

# Función para insertar un nuevo cliente
def insert_customer(name, phone):
    execute_query("INSERT INTO customers (name, phone) VALUES (?, ?)", (name, phone))


def insert_or_update_customer(name, phone, customer_id=None):
    if customer_id is not None:
        update_customer(customer_id, name, phone)
    else:
        existing_customer = find_customer(name, phone)
        if not existing_customer:
            insert_customer(name, phone)


# Funciones CRUD para servicios
def insert_service(name, price):
    execute_query("INSERT INTO services (name, price) VALUES (?, ?)", (name, price))

def update_service(service_id, name, price):
    execute_query("UPDATE services SET name = ?, price = ? WHERE id = ?", (name, price, service_id))

def delete_service(service_id):
    execute_query("DELETE FROM services WHERE id = ?", (service_id,))

def get_all_services():
    with connect() as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT id, name, price FROM services')
        return [{"id": row[0], "name": row[1], "price": row[2]} for row in cursor.fetchall()]

# Funciones CRUD para citas
def insert_appointment(customer_id, date, time, service_id, status):
    execute_query('INSERT INTO appointments (customer_id, date, time, service_id, status) VALUES (?, ?, ?, ?, ?)',
                  (customer_id, date, time, service_id, status))

def update_appointment(appointment_id, customer_id, date, time, service_id, status):
    execute_query('UPDATE appointments SET customer_id = ?, date = ?, time = ?, service_id = ?, status = ? WHERE id = ?',
                  (customer_id, date, time, service_id, status, appointment_id))

def delete_appointment(appointment_id):
    execute_query('UPDATE appointments SET is_deleted = 1 WHERE id = ?', (appointment_id,))

def get_all_appointments():
    with connect() as conn:
        cursor = conn.cursor()
        cursor.execute(''' 
            SELECT a.id, c.name, c.phone, a.date, a.time, s.name, a.status 
            FROM appointments a 
            JOIN customers c ON a.customer_id = c.id 
            JOIN services s ON a.service_id = s.id 
            WHERE a.is_deleted = FALSE''')
        return cursor.fetchall() or []  # Retorna lista vacía si no hay citas

# Funciones para el historial de servicios
def insert_service_history(customer_id, service_id, appointment_date, appointment_time):
    execute_query('INSERT INTO service_history (customer_id, service_id, appointment_date, appointment_time) VALUES (?, ?, ?, ?)',
                  (customer_id, service_id, appointment_date, appointment_time))

def get_service_history(customer_id, limit=10, offset=0):
    with connect() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT s.name, sh.appointment_date, sh.appointment_time
            FROM service_history sh
            JOIN services s ON sh.service_id = s.id
            WHERE sh.customer_id = ?
            LIMIT ? OFFSET ?
        ''', (customer_id, limit, offset))
        return cursor.fetchall() or []  # Retorna lista vacía si no hay historial

def clear_service_history(customer_id):
    execute_query("UPDATE service_history SET is_deleted = 1 WHERE customer_id = ?", (customer_id,))

def get_customer_by_name(name):
    with connect() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM customers WHERE name = ?", (name,))
        return cursor.fetchone()  # Retorna un único cliente o None si no existe
    
def clear_appointments(date):
    execute_query("DELETE FROM appointments WHERE date = ?", (date,))

def get_appointment_by_id(appointment_id):
    with connect() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT a.id, c.name, c.phone, a.date, a.time, s.name, a.status 
            FROM appointments a 
            JOIN customers c ON a.customer_id = c.id 
            JOIN services s ON a.service_id = s.id 
            WHERE a.id = ? AND a.is_deleted = FALSE''', (appointment_id,))
        row = cursor.fetchone()  # Devuelve una fila o None si no se encuentra
        if row:
            return {
                'id': row[0],
                'customer_name': row[1],
                'customer_phone': row[2],
                'date': row[3],
                'time': row[4],
                'service_name': row[5],
                'status': row[6]
            }
        return None  # Si no se encuentra la cita