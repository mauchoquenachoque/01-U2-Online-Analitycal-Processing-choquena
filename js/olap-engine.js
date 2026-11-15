/**
 * OLAP In-Memory Multidimensional Cube Engine
 * Implements Slice, Dice, Drill-Down, Roll-Up, and Pivot operations
 * Actividad Grupal 01-U2: Online Analytical Processing
 */

class OlapCubeEngine {
  constructor(dataset = []) {
    this.rawDataset = dataset;
    this.activeDataset = [...dataset];
    this.activeFilters = {};
    
    // Jerarquías predefinidas para Drill-Down y Roll-Up
    this.hierarchies = {
      time: ['year', 'quarter', 'month'],
      geography: ['region', 'country', 'city'],
      product: ['category', 'subcategory', 'product']
    };

    this.currentLevels = {
      time: 0,       // year
      geography: 0,  // region
      product: 0     // category
    };
  }

  setDataset(dataset) {
    this.rawDataset = dataset;
    this.resetFilters();
  }

  resetFilters() {
    this.activeFilters = {};
    this.activeDataset = [...this.rawDataset];
    this.currentLevels = { time: 0, geography: 0, product: 0 };
    return this.activeDataset;
  }

  /**
   * Operación SLICE:
   * Filtra el cubo seleccionando un corte específico a lo largo de 1 dimensión.
   */
  slice(dimension, value) {
    if (!dimension || value === undefined || value === 'ALL') {
      delete this.activeFilters[dimension];
    } else {
      this.activeFilters[dimension] = [value];
    }
    return this._applyFilters();
  }

  /**
   * Operación DICE:
   * Extrae un subcubo seleccionando rangos o múltiples valores en 2 o más dimensiones.
   * @param {Object} filterObject - ej: { year: [2023, 2024], category: ['Tecnología'] }
   */
  dice(filterObject) {
    Object.keys(filterObject).forEach(dim => {
      const vals = filterObject[dim];
      if (vals && vals.length > 0 && !vals.includes('ALL')) {
        this.activeFilters[dim] = Array.isArray(vals) ? vals : [vals];
      } else {
        delete this.activeFilters[dim];
      }
    });
    return this._applyFilters();
  }

  _applyFilters() {
    this.activeDataset = this.rawDataset.filter(row => {
      for (const [dim, allowedValues] of Object.entries(this.activeFilters)) {
        if (!allowedValues || allowedValues.length === 0) continue;
        const val = String(row[dim]);
        const isMatch = allowedValues.some(v => String(v) === val);
        if (!isMatch) return false;
      }
      return true;
    });
    return this.activeDataset;
  }

  /**
   * Operación DRILL-DOWN:
   * Profundiza en una jerarquía dimensional, pasando de un nivel superior (menos detalle)
   * a un nivel inferior (más detalle).
   */
  drillDown(hierarchyName) {
    const hier = this.hierarchies[hierarchyName];
    if (!hier) throw new Error(`Jerarquía desconocida: ${hierarchyName}`);
    if (this.currentLevels[hierarchyName] < hier.length - 1) {
      this.currentLevels[hierarchyName]++;
    }
    return hier[this.currentLevels[hierarchyName]];
  }

  /**
   * Operación ROLL-UP:
   * Agrupa los datos ascendiendo a un nivel más alto en la jerarquía (resumen).
   */
  rollUp(hierarchyName) {
    const hier = this.hierarchies[hierarchyName];
    if (!hier) throw new Error(`Jerarquía desconocida: ${hierarchyName}`);
    if (this.currentLevels[hierarchyName] > 0) {
      this.currentLevels[hierarchyName]--;
    }
    return hier[this.currentLevels[hierarchyName]];
  }

  getCurrentDimensionForHierarchy(hierarchyName) {
    const hier = this.hierarchies[hierarchyName];
    return hier[this.currentLevels[hierarchyName]];
  }

  /**
   * Operación PIVOT:
   * Reorganiza y rota las dimensiones del cubo, proyectando los datos en una
   * matriz bidimensional (filas vs columnas) con agregaciones cruzadas.
   */
  pivot(rowDimension, colDimension, measure = 'netSales', aggFunction = 'SUM') {
    const rowsSet = new Set();
    const colsSet = new Set();
    const cells = {};

    // 1. Recorrer el dataset activo para poblar las celdas
    for (const record of this.activeDataset) {
      const rowVal = record[rowDimension] ?? '(Nulo)';
      const colVal = record[colDimension] ?? '(Nulo)';
      const val = Number(record[measure]) || 0;

      rowsSet.add(rowVal);
      colsSet.add(colVal);

      if (!cells[rowVal]) cells[rowVal] = {};
      if (!cells[rowVal][colVal]) {
        cells[rowVal][colVal] = { values: [], count: 0, sum: 0 };
      }

      cells[rowVal][colVal].values.push(val);
      cells[rowVal][colVal].sum += val;
      cells[rowVal][colVal].count += 1;
    }

    const rows = Array.from(rowsSet).sort();
    const cols = Array.from(colsSet).sort();

    // 2. Calcular agregaciones por celda, subtotales de fila y columna
    const matrix = [];
    const colTotals = {};
    cols.forEach(c => (colTotals[c] = { sum: 0, count: 0 }));
    let grandSum = 0;
    let grandCount = 0;

    let minVal = Infinity;
    let maxVal = -Infinity;

    for (const r of rows) {
      const rowData = { rowKey: r, cells: {}, rowTotal: 0, rowCount: 0 };

      for (const c of cols) {
        const cellData = cells[r]?.[c];
        let aggVal = 0;
        let count = 0;

        if (cellData && cellData.count > 0) {
          count = cellData.count;
          switch (aggFunction.toUpperCase()) {
            case 'SUM':
              aggVal = cellData.sum;
              break;
            case 'AVG':
              aggVal = cellData.sum / cellData.count;
              break;
            case 'COUNT':
              aggVal = cellData.count;
              break;
            case 'MIN':
              aggVal = Math.min(...cellData.values);
              break;
            case 'MAX':
              aggVal = Math.max(...cellData.values);
              break;
            default:
              aggVal = cellData.sum;
          }

          if (aggVal < minVal) minVal = aggVal;
          if (aggVal > maxVal) maxVal = aggVal;

          colTotals[c].sum += cellData.sum;
          colTotals[c].count += cellData.count;
          rowData.rowTotal += cellData.sum;
          rowData.rowCount += cellData.count;
          grandSum += cellData.sum;
          grandCount += cellData.count;
        }

        rowData.cells[c] = {
          value: Math.round(aggVal * 100) / 100,
          count: count
        };
      }

      // Si la agregación es AVG, calcular promedio de fila
      if (aggFunction.toUpperCase() === 'AVG' && rowData.rowCount > 0) {
        rowData.rowTotal = Math.round((rowData.rowTotal / rowData.rowCount) * 100) / 100;
      } else {
        rowData.rowTotal = Math.round(rowData.rowTotal * 100) / 100;
      }

      matrix.push(rowData);
    }

    // Calcular totales de columnas
    const colSummary = {};
    for (const c of cols) {
      if (aggFunction.toUpperCase() === 'AVG' && colTotals[c].count > 0) {
        colSummary[c] = Math.round((colTotals[c].sum / colTotals[c].count) * 100) / 100;
      } else {
        colSummary[c] = Math.round(colTotals[c].sum * 100) / 100;
      }
    }

    const grandTotalCalculated =
      aggFunction.toUpperCase() === 'AVG' && grandCount > 0
        ? Math.round((grandSum / grandCount) * 100) / 100
        : Math.round(grandSum * 100) / 100;

    return {
      rowDimension,
      colDimension,
      measure,
      aggFunction,
      rows,
      cols,
      matrix,
      colSummary,
      grandTotal: grandTotalCalculated,
      minVal: minVal === Infinity ? 0 : minVal,
      maxVal: maxVal === -Infinity ? 0 : maxVal
    };
  }

  /**
   * Métricas y KPIs globales del cubo activo
   */
  getKPIs() {
    const totalRecords = this.activeDataset.length;
    let totalSales = 0;
    let totalProfit = 0;
    let totalUnits = 0;
    let totalDiscount = 0;

    for (const r of this.activeDataset) {
      totalSales += r.netSales || 0;
      totalProfit += r.profit || 0;
      totalUnits += r.quantity || 0;
      totalDiscount += r.discountAmount || 0;
    }

    const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
    const avgTicket = totalRecords > 0 ? totalSales / totalRecords : 0;

    return {
      totalRecords,
      totalSales: Math.round(totalSales * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      profitMargin: Math.round(profitMargin * 10) / 10,
      totalUnits,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      avgTicket: Math.round(avgTicket * 100) / 100
    };
  }

  /**
   * Ejecutor de Consultas Analíticas MDX / OLAP SQL simuladas
   * Sintaxis soportada:
   * SELECT [dimension1], [dimension2], [AGG(measure)] GROUP BY CUBE/ROLLUP
   */
  executeOlapQuery(queryString) {
    const query = queryString.trim();
    const pivotMatch = query.match(/PIVOT\s+(\w+)\s+BY\s+(\w+)\s+MEASURE\s+(\w+)\s+AGG\s+(\w+)/i);
    if (pivotMatch) {
      const [, rowDim, colDim, measure, agg] = pivotMatch;
      return {
        type: 'PIVOT',
        result: this.pivot(rowDim, colDim, measure, agg)
      };
    }

    const selectMatch = query.match(/SELECT\s+(.+)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?(?:\s+GROUP\s+BY\s+(.+))?/i);
    if (!selectMatch) {
      return {
        type: 'ERROR',
        message: 'Sintaxis no reconocida. Ejemplo: PIVOT category BY region MEASURE netSales AGG SUM o SELECT category, SUM(netSales) FROM SalesCube GROUP BY category'
      };
    }

    const [, selectFields, fromCube, whereClause, groupByFields] = selectMatch;

    // Procesar agrupamiento
    const groupDims = groupByFields ? groupByFields.split(',').map(s => s.trim().replace(/CUBE\(|\)|ROLLUP\(|GROUPING\s+SETS\(/gi, '')) : ['category'];
    const primaryDim = groupDims[0] || 'category';

    const grouped = {};
    for (const r of this.activeDataset) {
      const key = r[primaryDim] ?? 'Desconocido';
      if (!grouped[key]) {
        grouped[key] = { count: 0, sumSales: 0, sumProfit: 0, sumUnits: 0 };
      }
      grouped[key].count++;
      grouped[key].sumSales += r.netSales || 0;
      grouped[key].sumProfit += r.profit || 0;
      grouped[key].sumUnits += r.quantity || 0;
    }

    const formattedRows = Object.keys(grouped).map(key => ({
      dimension: key,
      ventasTotales: Math.round(grouped[key].sumSales * 100) / 100,
      gananciaTotal: Math.round(grouped[key].sumProfit * 100) / 100,
      unidadesVendidas: grouped[key].sumUnits,
      transacciones: grouped[key].count
    }));

    return {
      type: 'TABULAR',
      query,
      rowCount: formattedRows.length,
      data: formattedRows
    };
  }
}

if (typeof module !== 'undefined') {
  module.exports = OlapCubeEngine;
}
