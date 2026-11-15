/**
 * Star Schema In-Memory Data Generator
 * Actividad Grupal 01-U2: Online Analytical Processing
 */

const StarSchemaData = (function () {
  const DIM_TIME = [
    { year: 2021, quarters: ['Q1', 'Q2', 'Q3', 'Q4'], months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'] },
    { year: 2022, quarters: ['Q1', 'Q2', 'Q3', 'Q4'], months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'] },
    { year: 2023, quarters: ['Q1', 'Q2', 'Q3', 'Q4'], months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'] },
    { year: 2024, quarters: ['Q1', 'Q2', 'Q3', 'Q4'], months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'] }
  ];

  const DIM_PRODUCT = [
    { category: 'Tecnología', subcategory: 'Laptops Pro', product: 'ThinkPad X1 Carbon', basePrice: 1600 },
    { category: 'Tecnología', subcategory: 'Laptops Pro', product: 'MacBook Pro M3', basePrice: 2200 },
    { category: 'Tecnología', subcategory: 'Servidores', product: 'Dell PowerEdge R750', basePrice: 3800 },
    { category: 'Tecnología', subcategory: 'Monitores', product: 'UltraWide 34" 4K HDR', basePrice: 750 },
    { category: 'Tecnología', subcategory: 'Periféricos', product: 'Teclado Mecánico RGB', basePrice: 120 },
    { category: 'Mobiliario', subcategory: 'Sillas Ergonómicas', product: 'Herman Miller Aeron', basePrice: 1100 },
    { category: 'Mobiliario', subcategory: 'Sillas Ergonómicas', product: 'Ergohuman Plus', basePrice: 650 },
    { category: 'Mobiliario', subcategory: 'Escritorios Standing', product: 'DeskPro Motorizado', basePrice: 580 },
    { category: 'Mobiliario', subcategory: 'Almacenamiento', product: 'Archivador Metálico 4G', basePrice: 230 },
    { category: 'Suministros', subcategory: 'Papelería Premium', product: 'Resma Bond 80g Extra', basePrice: 25 },
    { category: 'Suministros', subcategory: 'Impresión', product: 'Tóner Láser Alta Capacidad', basePrice: 140 },
    { category: 'Suministros', subcategory: 'Seguridad', product: 'Kit Destructora de Papel', basePrice: 180 },
    { category: 'Software SaaS', subcategory: 'ERP Cloud', product: 'Licencia Anual Cloud ERP', basePrice: 1950 },
    { category: 'Software SaaS', subcategory: 'Ciberseguridad', product: 'Suite EDR Endpoint 10U', basePrice: 850 },
    { category: 'Software SaaS', subcategory: 'BI Analytics', product: 'PowerBI/Tableau Pro 5U', basePrice: 600 }
  ];

  const DIM_GEOGRAPHY = [
    { region: 'América del Sur', country: 'Perú', city: 'Lima' },
    { region: 'América del Sur', country: 'Perú', city: 'Arequipa' },
    { region: 'América del Sur', country: 'Colombia', city: 'Bogotá' },
    { region: 'América del Sur', country: 'Chile', city: 'Santiago' },
    { region: 'América del Norte', country: 'Estados Unidos', city: 'New York' },
    { region: 'América del Norte', country: 'Estados Unidos', city: 'San Francisco' },
    { region: 'América del Norte', country: 'México', city: 'Ciudad de México' },
    { region: 'Europa', country: 'España', city: 'Madrid' },
    { region: 'Europa', country: 'Alemania', city: 'Berlín' },
    { region: 'Europa', country: 'Reino Unido', city: 'Londres' }
  ];

  const DIM_CUSTOMER = [
    { segment: 'Corporativo', loyalty: 'Platino' },
    { segment: 'Corporativo', loyalty: 'Oro' },
    { segment: 'Mediana Empresa (Pyme)', loyalty: 'Oro' },
    { segment: 'Mediana Empresa (Pyme)', loyalty: 'Plata' },
    { segment: 'Consumo Directo', loyalty: 'Plata' },
    { segment: 'Consumo Directo', loyalty: 'Bronce' }
  ];

  const DIM_CHANNEL = ['E-Commerce B2B', 'Venta Directa Consultiva', 'Distribuidor Mayorista', 'Retail Físico'];

  function generateFacts(recordCount = 2500) {
    const facts = [];
    let seed = 42;
    function pseudoRandom() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    }

    for (let i = 1; i <= recordCount; i++) {
      const yearObj = DIM_TIME[Math.floor(pseudoRandom() * DIM_TIME.length)];
      const quarterIdx = Math.floor(pseudoRandom() * 4);
      const quarter = yearObj.quarters[quarterIdx];
      const monthIdx = quarterIdx * 3 + Math.floor(pseudoRandom() * 3);
      const month = yearObj.months[monthIdx];
      const day = 1 + Math.floor(pseudoRandom() * 28);

      const prod = DIM_PRODUCT[Math.floor(pseudoRandom() * DIM_PRODUCT.length)];
      const geo = DIM_GEOGRAPHY[Math.floor(pseudoRandom() * DIM_GEOGRAPHY.length)];
      const cust = DIM_CUSTOMER[Math.floor(pseudoRandom() * DIM_CUSTOMER.length)];
      const channel = DIM_CHANNEL[Math.floor(pseudoRandom() * DIM_CHANNEL.length)];

      const quantity = 1 + Math.floor(pseudoRandom() * 12);
      const discountPct = pseudoRandom() < 0.4 ? (Math.floor(pseudoRandom() * 5) * 5) / 100 : 0; // 0, 5, 10, 15, 20%
      const grossSales = Math.round(prod.basePrice * quantity * 100) / 100;
      const discountAmount = Math.round(grossSales * discountPct * 100) / 100;
      const netSales = Math.round((grossSales - discountAmount) * 100) / 100;
      const unitCost = Math.round(prod.basePrice * (0.55 + pseudoRandom() * 0.2) * 100) / 100;
      const totalCost = Math.round(unitCost * quantity * 100) / 100;
      const profit = Math.round((netSales - totalCost) * 100) / 100;
      const profitMarginPct = Math.round((profit / (netSales || 1)) * 1000) / 10;

      facts.push({
        id: i,
        // Dimensiones
        year: yearObj.year,
        quarter: quarter,
        month: month,
        date: `${yearObj.year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        category: prod.category,
        subcategory: prod.subcategory,
        product: prod.product,
        region: geo.region,
        country: geo.country,
        city: geo.city,
        customerSegment: cust.segment,
        customerLoyalty: cust.loyalty,
        channel: channel,
        // Medidas Numéricas
        quantity: quantity,
        unitPrice: prod.basePrice,
        unitCost: unitCost,
        grossSales: grossSales,
        discountAmount: discountAmount,
        netSales: netSales,
        totalCost: totalCost,
        profit: profit,
        profitMarginPct: profitMarginPct
      });
    }

    return facts;
  }

  return {
    DIM_TIME,
    DIM_PRODUCT,
    DIM_GEOGRAPHY,
    DIM_CUSTOMER,
    DIM_CHANNEL,
    generateFacts
  };
})();

if (typeof module !== 'undefined') {
  module.exports = StarSchemaData;
}
