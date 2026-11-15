# OLAP Studio 360 | Online Analytical Processing (OLAP)

[![Deploy to GitHub Pages](https://github.com/mauchoquenachoque/01-U2-Online-Analitycal-Processing-choquena/actions/workflows/deploy.yml/badge.svg)](https://github.com/mauchoquenachoque/01-U2-Online-Analitycal-Processing-choquena/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Dev.to Article](https://img.shields.io/badge/Dev.to-Article%20Published-brightgreen)](DEVTO_ARTICLE.md)
[![100% Free & Open Source](https://img.shields.io/badge/Dependencies-100%25%20FOSS-emerald)](https://opensource.org/)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-informational)](https://mauchoquenachoque.github.io/01-U2-Online-Analitycal-Processing-choquena/)

Plataforma interactiva de **Procesamiento Analítico en Línea (OLAP)** construida con librerías 100% libres y de código abierto (FOSS). Implementa un motor multidimensional en memoria basado en el **Esquema Estrella (Star Schema)** con soporte completo para las 5 operaciones fundamentales del cubo: **Slice**, **Dice**, **Drill-Down**, **Roll-Up** y **Pivot**.

> 🎓 **Asignatura:** Actividad Grupal 01-U2: Online Analytical Processing  
> 👤 **Autor:** Mau Choquena Choque & Equipo  
> 🌐 **Despliegue Público (Cloud SaaS):** [https://mauchoquenachoque.github.io/01-U2-Online-Analitycal-Processing-choquena/](https://mauchoquenachoque.github.io/01-U2-Online-Analitycal-Processing-choquena/)  
> 📝 **Artículo Técnico en Dev.to:** [Ver Artículo Completo en Markdown (DEVTO_ARTICLE.md)](DEVTO_ARTICLE.md)

---

## 🌟 Características Principales

- **Autofuncionamiento sin despliegue obligatorio (Zero Dependencies):** Solo requiere abrir el archivo `index.html` en cualquier navegador web moderno. No requiere compilar, empaquetar ni configurar servidores externos.
- **Motor Multidimensional In-Memory:** Cálculos analíticos instantáneos sobre miles de hechos agregados mediante funciones de agregación (`SUM`, `AVG`, `COUNT`, `MIN`, `MAX`).
- **5 Operaciones OLAP Interactivas:**
  1. ✂️ **Slice (Corte):** Filtrado analítico aislando un plano bidimensional a través de una dimensión (ej. Año o Región).
  2. 🎲 **Dice (Subcubo):** Extracción de un hipercubo menor mediante condiciones multidimensionales simultáneas.
  3. 🔍 **Drill-Down (Profundización):** Navegación descendente en jerarquías:
     - Tiempo: `Año ➔ Trimestre ➔ Mes`
     - Geografía: `Región ➔ País ➔ Ciudad`
     - Producto: `Categoría ➔ Subcategoría ➔ Producto SKU`
  4. 📈 **Roll-Up (Consolidación):** Agrupación y totalización ascendente hacia resúmenes de mayor nivel.
  5. 🔄 **Pivot (Rotación Dimensional):** Intercambio instantáneo de ejes de filas por columnas para revelar nuevos patrones.
- **Visualizador 3D Isométrico de Cubo:** Representación gráfica en tiempo real del espacio vectorial del cubo y subcubos seleccionados.
- **Consola de Consultas OLAP / MDX:** Ejecutor de consultas analíticas tipo SQL-OLAP y matrices PIVOT.
- **Exportación 1-Clic a CSV:** Permite descargar los resultados de la matriz cruzada para análisis externo.
- **Despliegue Continuo Automatizado (CI/CD):** Pipeline en GitHub Actions que compila, valida y publica en GitHub Pages en cada push a la rama `main`.

---

## 🏛️ Arquitectura: Esquema Estrella (Star Schema)

```
                            ┌────────────────────────┐
                            │        Dim_Time        │
                            ├────────────────────────┤
                            │ PK: TimeKey            │
                            │ Year, Quarter, Month   │
                            └───────────┬────────────┘
                                        │
┌────────────────────────┐              │              ┌────────────────────────┐
│      Dim_Product       │              │              │     Dim_Geography      │
├────────────────────────┤              │              ├────────────────────────┤
│ PK: ProductKey         ├──────────────┼──────────────┤ PK: GeoKey             │
│ Category, Subcat, SKU  │              │              │ Region, Country, City  │
└────────────────────────┘              ▼              └────────────────────────┘
                            ┌────────────────────────┐
                            │       Fact_Sales       │
                            ├────────────────────────┤
                            │ FK: TimeKey            │
                            │ FK: ProductKey         │
                            │ FK: GeoKey             │
                            │ FK: CustomerKey        │
                            │ ---------------------- │
                            │ Measure: NetSales ($)  │
                            │ Measure: UnitCost ($)  │
                            │ Measure: Quantity      │
                            │ Measure: Discount ($)  │
                            │ Measure: Profit ($)    │
                            └───────────▲────────────┘
                                        │
                            ┌───────────┴────────────┐
                            │      Dim_Customer      │
                            ├────────────────────────┤
                            │ PK: CustomerKey        │
                            │ Segment, LoyaltyTier   │
                            │ Channel (Canal Venta)  │
                            └────────────────────────┘
```

---

## 🚀 Guía de Uso Rápido

### Opción A: Ejecución Directa en el Navegador (Recomendada)
Haga doble clic en el archivo `index.html` o ábralo con Google Chrome, Mozilla Firefox o Microsoft Edge. ¡Funciona inmediatamente incluso sin conexión a Internet!

### Opción B: Servidor Local en Python (Zero Dependencies)
Si desea levantarlo como servidor local HTTP:
```bash
python app.py
```
El servidor abrirá automáticamente su navegador en `http://localhost:8080`.

### Opción C: Ejecución de Consultas OLAP por Consola (Python)
Para verificar las 5 operaciones dimensionales en una base de datos relacional SQLite en memoria:
```bash
python olap_cube.py
```

---

## ⚙️ Despliegue Automatizado (CI/CD en Cloud Público)

El repositorio cuenta con un flujo de trabajo automatizado en `.github/workflows/deploy.yml`:
- **Disparador:** Cada `git push` a la rama `main`.
- **Pipeline:**
  1. Clona el código fuente.
  2. Valida la integridad estructural de los componentes del motor OLAP.
  3. Ejecuta validaciones de sintaxis en el motor de referencia en Python.
  4. Configura y empaqueta el artefacto web.
  5. Despliega automáticamente a **GitHub Pages** (red global CDN de alta disponibilidad).

---

## 📚 Estructura del Proyecto

```
01-U2-Online-Analitycal-Processing-choquena/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Flujo CI/CD para despliegue automatizado
├── css/
│   └── styles.css              # Estilos UI modernos en modo oscuro (Glassmorphism)
├── js/
│   ├── data.js                 # Generador de hechos y dimensiones en Esquema Estrella
│   ├── olap-engine.js          # Motor multidimensional: Slice, Dice, Drill, Roll, Pivot
│   └── app.js                  # Orquestador UI, gráficos Chart.js y Canvas isométrico
├── index.html                  # Aplicación web completa y autocontenida
├── olap_cube.py                # Implementación OLAP en Python puro con SQLite en memoria
├── app.py                      # Servidor HTTP local con cero dependencias
├── requirements.txt            # Manifiesto de dependencias libres
├── DEVTO_ARTICLE.md            # Artículo técnico completo listo para Dev.to
├── LICENSE                     # Licencia de código abierto MIT
└── README.md                   # Documentación técnica del proyecto
```

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia **MIT**, permitiendo su libre uso, modificación y distribución con fines académicos y profesionales.
