"""
OLAP Multidimensional Cube Engine in Python
Actividad Grupal 01-U2: Online Analytical Processing
100% Free & Open Source (Zero proprietary dependencies)
"""

import sqlite3
import random
import json
from datetime import datetime, timedelta

def create_in_memory_star_schema():
    """Crea una base de datos analítica en memoria SQLite con Esquema Estrella (Star Schema)"""
    conn = sqlite3.connect(":memory:")
    cur = conn.cursor()

    # 1. Tabla de Dimensión: Tiempo
    cur.execute("""
    CREATE TABLE Dim_Time (
        TimeKey INTEGER PRIMARY KEY,
        DateStr TEXT,
        Year INTEGER,
        Quarter TEXT,
        Month TEXT,
        DayOfWeek TEXT
    );
    """)

    # 2. Tabla de Dimensión: Producto
    cur.execute("""
    CREATE TABLE Dim_Product (
        ProductKey INTEGER PRIMARY KEY,
        Category TEXT,
        Subcategory TEXT,
        ProductName TEXT,
        BasePrice REAL
    );
    """)

    # 3. Tabla de Dimensión: Geografía
    cur.execute("""
    CREATE TABLE Dim_Geography (
        GeoKey INTEGER PRIMARY KEY,
        Region TEXT,
        Country TEXT,
        City TEXT
    );
    """)

    # 4. Tabla de Dimensión: Cliente y Canal
    cur.execute("""
    CREATE TABLE Dim_Customer (
        CustomerKey INTEGER PRIMARY KEY,
        Segment TEXT,
        LoyaltyTier TEXT,
        Channel TEXT
    );
    """)

    # 5. Tabla de Hechos: Fact_Sales
    cur.execute("""
    CREATE TABLE Fact_Sales (
        SalesID INTEGER PRIMARY KEY AUTOINCREMENT,
        TimeKey INTEGER,
        ProductKey INTEGER,
        GeoKey INTEGER,
        CustomerKey INTEGER,
        Quantity INTEGER,
        UnitPrice REAL,
        GrossSales REAL,
        DiscountAmount REAL,
        NetSales REAL,
        UnitCost REAL,
        TotalCost REAL,
        Profit REAL,
        FOREIGN KEY (TimeKey) REFERENCES Dim_Time(TimeKey),
        FOREIGN KEY (ProductKey) REFERENCES Dim_Product(ProductKey),
        FOREIGN KEY (GeoKey) REFERENCES Dim_Geography(GeoKey),
        FOREIGN KEY (CustomerKey) REFERENCES Dim_Customer(CustomerKey)
    );
    """)

    # Población de Dimensiones
    time_records = []
    base_date = datetime(2021, 1, 1)
    for i in range(1460): # 4 años
        d = base_date + timedelta(days=i)
        quarter = f"Q{(d.month - 1) // 3 + 1}"
        months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
        days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
        time_records.append((i + 1, d.strftime("%Y-%m-%d"), d.year, quarter, months[d.month - 1], days[d.weekday()]))
    cur.executemany("INSERT INTO Dim_Time VALUES (?, ?, ?, ?, ?, ?)", time_records)

    products = [
        (1, 'Tecnología', 'Laptops Pro', 'ThinkPad X1 Carbon', 1600.0),
        (2, 'Tecnología', 'Laptops Pro', 'MacBook Pro M3', 2200.0),
        (3, 'Tecnología', 'Servidores', 'Dell PowerEdge R750', 3800.0),
        (4, 'Tecnología', 'Monitores', 'UltraWide 34 4K HDR', 750.0),
        (5, 'Mobiliario', 'Sillas Ergonómicas', 'Herman Miller Aeron', 1100.0),
        (6, 'Mobiliario', 'Escritorios Standing', 'DeskPro Motorizado', 580.0),
        (7, 'Suministros', 'Papelería Premium', 'Resma Bond 80g Extra', 25.0),
        (8, 'Software SaaS', 'ERP Cloud', 'Licencia Anual Cloud ERP', 1950.0),
        (9, 'Software SaaS', 'Ciberseguridad', 'Suite EDR Endpoint 10U', 850.0)
    ]
    cur.executemany("INSERT INTO Dim_Product VALUES (?, ?, ?, ?, ?)", products)

    geos = [
        (1, 'América del Sur', 'Perú', 'Lima'),
        (2, 'América del Sur', 'Perú', 'Arequipa'),
        (3, 'América del Sur', 'Colombia', 'Bogotá'),
        (4, 'América del Norte', 'Estados Unidos', 'New York'),
        (5, 'América del Norte', 'Estados Unidos', 'San Francisco'),
        (6, 'Europa', 'España', 'Madrid'),
        (7, 'Europa', 'Alemania', 'Berlín')
    ]
    cur.executemany("INSERT INTO Dim_Geography VALUES (?, ?, ?, ?)", geos)

    customers = [
        (1, 'Corporativo', 'Platino', 'Venta Directa Consultiva'),
        (2, 'Corporativo', 'Oro', 'E-Commerce B2B'),
        (3, 'Pyme', 'Oro', 'Distribuidor Mayorista'),
        (4, 'Pyme', 'Plata', 'E-Commerce B2B'),
        (5, 'Consumo Directo', 'Bronce', 'Retail Físico')
    ]
    cur.executemany("INSERT INTO Dim_Customer VALUES (?, ?, ?, ?)", customers)

    # Generación de Hechos (Fact Records)
    random.seed(42)
    fact_records = []
    for _ in range(5000):
        t_key = random.randint(1, len(time_records))
        p = random.choice(products)
        p_key, base_price = p[0], p[4]
        g_key = random.randint(1, len(geos))
        c_key = random.randint(1, len(customers))

        qty = random.randint(1, 10)
        disc_pct = random.choice([0.0, 0.05, 0.10, 0.15]) if random.random() < 0.35 else 0.0
        gross = round(base_price * qty, 2)
        disc_amt = round(gross * disc_pct, 2)
        net = round(gross - disc_amt, 2)
        cost_unit = round(base_price * random.uniform(0.55, 0.70), 2)
        total_cost = round(cost_unit * qty, 2)
        profit = round(net - total_cost, 2)

        fact_records.append((t_key, p_key, g_key, c_key, qty, base_price, gross, disc_amt, net, cost_unit, total_cost, profit))

    cur.executemany("""
    INSERT INTO Fact_Sales (TimeKey, ProductKey, GeoKey, CustomerKey, Quantity, UnitPrice, GrossSales, DiscountAmount, NetSales, UnitCost, TotalCost, Profit)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, fact_records)

    conn.commit()
    return conn

# Demostración de las 5 Operaciones OLAP
def demonstrate_olap_operations(conn):
    cur = conn.cursor()
    print("=" * 70)
    print("  ACTIVIDAD GRUPAL 01-U2: ONLINE ANALYTICAL PROCESSING (OLAP)")
    print("  Demostración de Operaciones Multidimensionales")
    print("=" * 70)

    # 1. SLICE: Corte por Región = 'América del Sur'
    print("\n--- [1] OPERACIÓN SLICE (Filtro por 1 Dimensión: Región = 'América del Sur') ---")
    cur.execute("""
    SELECT 
        p.Category,
        COUNT(*) as Transacciones,
        ROUND(SUM(f.NetSales), 2) as VentasTotales,
        ROUND(SUM(f.Profit), 2) as GananciaTotal
    FROM Fact_Sales f
    JOIN Dim_Product p ON f.ProductKey = p.ProductKey
    JOIN Dim_Geography g ON f.GeoKey = g.GeoKey
    WHERE g.Region = 'América del Sur'
    GROUP BY p.Category;
    """)
    for row in cur.fetchall():
        print(f"  Categoría: {row[0]:<15} | Transacciones: {row[1]:<5} | Ventas: ${row[2]:<12} | Ganancia: ${row[3]}")

    # 2. DICE: Subcubo (Año IN 2023, 2024 AND Categoría = 'Tecnología' AND Región IN ('América del Sur', 'Europa'))
    print("\n--- [2] OPERACIÓN DICE (Subcubo Multidimensional: Año 2023-2024, Tech, Sur/Europa) ---")
    cur.execute("""
    SELECT 
        t.Year,
        g.Region,
        ROUND(SUM(f.NetSales), 2) as Ventas,
        ROUND(SUM(f.Profit), 2) as Ganancia
    FROM Fact_Sales f
    JOIN Dim_Time t ON f.TimeKey = t.TimeKey
    JOIN Dim_Product p ON f.ProductKey = p.ProductKey
    JOIN Dim_Geography g ON f.GeoKey = g.GeoKey
    WHERE t.Year IN (2023, 2024)
      AND p.Category = 'Tecnología'
      AND g.Region IN ('América del Sur', 'Europa')
    GROUP BY t.Year, g.Region;
    """)
    for row in cur.fetchall():
        print(f"  Año: {row[0]} | Región: {row[1]:<18} | Ventas: ${row[2]:<12} | Ganancia: ${row[3]}")

    # 3. DRILL-DOWN: Jerarquía Temporal (Año ➔ Trimestre)
    print("\n--- [3] OPERACIÓN DRILL-DOWN (Año 2023 ➔ Desglose por Trimestres) ---")
    cur.execute("""
    SELECT 
        t.Year,
        t.Quarter,
        ROUND(SUM(f.NetSales), 2) as VentasTrimestre
    FROM Fact_Sales f
    JOIN Dim_Time t ON f.TimeKey = t.TimeKey
    WHERE t.Year = 2023
    GROUP BY t.Year, t.Quarter
    ORDER BY t.Quarter;
    """)
    for row in cur.fetchall():
        print(f"  Año: {row[0]} | Trimestre: {row[1]} | Ventas: ${row[2]}")

    # 4. ROLL-UP: Agregación de Ciudades hacia País y Región
    print("\n--- [4] OPERACIÓN ROLL-UP (Agregando de Ciudad a País y Región) ---")
    cur.execute("""
    SELECT 
        g.Region,
        g.Country,
        COUNT(DISTINCT g.City) as TotalCiudades,
        ROUND(SUM(f.NetSales), 2) as VentasConsolidadas
    FROM Fact_Sales f
    JOIN Dim_Geography g ON f.GeoKey = g.GeoKey
    GROUP BY g.Region, g.Country;
    """)
    for row in cur.fetchall():
        print(f"  Región: {row[0]:<18} | País: {row[1]:<15} | Ciudades: {row[2]} | Ventas: ${row[3]}")

    # 5. PIVOT: Matriz Cruzada (Categoría vs Región)
    print("\n--- [5] OPERACIÓN PIVOT (Categorías como Filas x Regiones como Columnas) ---")
    cur.execute("""
    SELECT 
        p.Category,
        ROUND(SUM(CASE WHEN g.Region = 'América del Sur' THEN f.NetSales ELSE 0 END), 2) AS [América del Sur],
        ROUND(SUM(CASE WHEN g.Region = 'América del Norte' THEN f.NetSales ELSE 0 END), 2) AS [América del Norte],
        ROUND(SUM(CASE WHEN g.Region = 'Europa' THEN f.NetSales ELSE 0 END), 2) AS [Europa],
        ROUND(SUM(f.NetSales), 2) as TotalGeneral
    FROM Fact_Sales f
    JOIN Dim_Product p ON f.ProductKey = p.ProductKey
    JOIN Dim_Geography g ON f.GeoKey = g.GeoKey
    GROUP BY p.Category;
    """)
    print(f"  {'Categoría':<16} | {'América Sur':<14} | {'América Norte':<14} | {'Europa':<12} | {'Total':<12}")
    print("  " + "-" * 70)
    for row in cur.fetchall():
        print(f"  {row[0]:<16} | ${row[1]:<13} | ${row[2]:<13} | ${row[3]:<11} | ${row[4]}")

if __name__ == "__main__":
    db = create_in_memory_star_schema()
    demonstrate_olap_operations(db)
