/**
 * Application Orchestrator & UI Controller
 * Actividad Grupal 01-U2: Online Analytical Processing
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Inicializar Engine con datos sintéticos
  const dataset = StarSchemaData.generateFacts(3000);
  const engine = new OlapCubeEngine(dataset);

  // Referencias UI
  const kpiSales = document.getElementById('kpi-sales');
  const kpiProfit = document.getElementById('kpi-profit');
  const kpiMargin = document.getElementById('kpi-margin');
  const kpiUnits = document.getElementById('kpi-units');
  const kpiRecords = document.getElementById('kpi-records');

  // Controles de Pivot
  const selRowDim = document.getElementById('sel-row-dim');
  const selColDim = document.getElementById('sel-col-dim');
  const selMeasure = document.getElementById('sel-measure');
  const selAgg = document.getElementById('sel-agg');
  const btnSwapDims = document.getElementById('btn-swap-dims');
  const pivotContainer = document.getElementById('pivot-matrix-container');

  // Controles de Filtros / Slice & Dice
  const filterYear = document.getElementById('filter-year');
  const filterRegion = document.getElementById('filter-region');
  const filterCategory = document.getElementById('filter-category');
  const filterChannel = document.getElementById('filter-channel');
  const btnResetFilters = document.getElementById('btn-reset-filters');

  // Botones Drill / Roll
  const btnDrillTime = document.getElementById('btn-drill-time');
  const btnRollTime = document.getElementById('btn-roll-time');
  const lblTimeLevel = document.getElementById('lbl-time-level');

  const btnDrillGeo = document.getElementById('btn-drill-geo');
  const btnRollGeo = document.getElementById('btn-roll-geo');
  const lblGeoLevel = document.getElementById('lbl-geo-level');

  const btnDrillProd = document.getElementById('btn-drill-prod');
  const btnRollProd = document.getElementById('btn-roll-prod');
  const lblProdLevel = document.getElementById('lbl-prod-level');

  // Canvas del Cubo 3D / Isométrico
  const cubeCanvas = document.getElementById('olap-cube-canvas');
  const cubeCtx = cubeCanvas ? cubeCanvas.getContext('2d') : null;

  // Consola de Consultas
  const queryInput = document.getElementById('query-input');
  const btnRunQuery = document.getElementById('btn-run-query');
  const queryOutput = document.getElementById('query-output');

  // Gráficos Chart.js
  let trendChartInstance = null;
  let breakdownChartInstance = null;

  // --- Funciones de Renderizado ---
  function updateKPIs() {
    const kpis = engine.getKPIs();
    if (kpiSales) kpiSales.textContent = `$${kpis.totalSales.toLocaleString()}`;
    if (kpiProfit) kpiProfit.textContent = `$${kpis.totalProfit.toLocaleString()}`;
    if (kpiMargin) kpiMargin.textContent = `${kpis.profitMargin}%`;
    if (kpiUnits) kpiUnits.textContent = kpis.totalUnits.toLocaleString();
    if (kpiRecords) kpiRecords.textContent = kpis.totalRecords.toLocaleString();
  }

  function renderPivotMatrix() {
    const rowDim = selRowDim.value;
    const colDim = selColDim.value;
    const measure = selMeasure.value;
    const agg = selAgg.value;

    const pivotData = engine.pivot(rowDim, colDim, measure, agg);

    let html = `
      <table class="olap-table">
        <thead>
          <tr>
            <th class="row-header">${rowDim.toUpperCase()} \\ ${colDim.toUpperCase()}</th>
            ${pivotData.cols.map(c => `<th>${c}</th>`).join('')}
            <th>TOTAL ${agg}</th>
          </tr>
        </thead>
        <tbody>
    `;

    const valRange = (pivotData.maxVal - pivotData.minVal) || 1;

    pivotData.matrix.forEach(row => {
      html += `<tr><td class="dim-val">${row.rowKey}</td>`;
      pivotData.cols.forEach(col => {
        const cell = row.cells[col];
        const val = cell.value;
        const normalized = (val - pivotData.minVal) / valRange;
        let heatClass = 'cell-heat-low';
        if (normalized > 0.66) heatClass = 'cell-heat-high';
        else if (normalized > 0.33) heatClass = 'cell-heat-mid';

        const displayVal = measure === 'profitMarginPct' ? `${val}%` : `$${val.toLocaleString()}`;
        html += `<td class="${heatClass}" title="${row.rowKey} - ${col}: ${displayVal} (${cell.count} reg)">${displayVal}</td>`;
      });
      const displayTotal = measure === 'profitMarginPct' ? `${row.rowTotal}%` : `$${row.rowTotal.toLocaleString()}`;
      html += `<td class="total-row">${displayTotal}</td></tr>`;
    });

    // Fila de Resumen / Totales de Columnas
    html += `
        <tr class="total-row">
          <td class="row-header">TOTAL ${agg}</td>
          ${pivotData.cols.map(c => {
            const val = pivotData.colSummary[c] || 0;
            const displayVal = measure === 'profitMarginPct' ? `${val}%` : `$${val.toLocaleString()}`;
            return `<td>${displayVal}</td>`;
          }).join('')}
          <td style="color: var(--accent-amber); font-size: 0.95rem;">
            ${measure === 'profitMarginPct' ? `${pivotData.grandTotal}%` : `$${pivotData.grandTotal.toLocaleString()}`}
          </td>
        </tr>
      </tbody>
    </table>`;

    if (pivotContainer) {
      pivotContainer.innerHTML = html;
    }

    // Actualizar visualizaciones y gráficos
    updateCharts(pivotData);
    drawIsometricCube(rowDim, colDim);
  }

  function updateCharts(pivotData) {
    if (typeof Chart === 'undefined') return;

    // Gráfico de Tendencia o Distribución
    const trendCtx = document.getElementById('chart-trend')?.getContext('2d');
    const breakdownCtx = document.getElementById('chart-breakdown')?.getContext('2d');

    if (trendCtx) {
      if (trendChartInstance) trendChartInstance.destroy();
      
      const datasets = pivotData.cols.slice(0, 5).map((colName, idx) => {
        const colors = ['#38bdf8', '#818cf8', '#34d399', '#fbbf24', '#f43f5e'];
        return {
          label: colName,
          data: pivotData.matrix.map(row => row.cells[colName]?.value || 0),
          backgroundColor: colors[idx % colors.length],
          borderColor: colors[idx % colors.length],
          borderWidth: 1.5,
          tension: 0.3
        };
      });

      trendChartInstance = new Chart(trendCtx, {
        type: 'bar',
        data: {
          labels: pivotData.rows,
          datasets: datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#94a3b8' } },
            tooltip: { mode: 'index', intersect: false }
          },
          scales: {
            x: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
            y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
          }
        }
      });
    }

    if (breakdownCtx) {
      if (breakdownChartInstance) breakdownChartInstance.destroy();

      const totalsByRow = pivotData.matrix.map(r => r.rowTotal);
      breakdownChartInstance = new Chart(breakdownCtx, {
        type: 'doughnut',
        data: {
          labels: pivotData.rows,
          datasets: [{
            data: totalsByRow,
            backgroundColor: [
              '#38bdf8', '#818cf8', '#c084fc', '#34d399',
              '#fbbf24', '#fb7185', '#38bdf8', '#a78bfa'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { color: '#94a3b8' } }
          }
        }
      });
    }
  }

  /**
   * Dibuja una representación visual 3D isométrica del Cubo OLAP
   */
  function drawIsometricCube(xDim, yDim) {
    if (!cubeCtx || !cubeCanvas) return;
    const width = cubeCanvas.width;
    const height = cubeCanvas.height;
    cubeCtx.clearRect(0, 0, width, height);

    const originX = width / 2;
    const originY = height / 2 + 30;
    const size = 32;
    const gridSize = 3;

    function isoProject(x, y, z) {
      const isoX = originX + (x - y) * size * 0.866;
      const isoY = originY + (x + y) * size * 0.5 - z * size * 0.9;
      return { x: isoX, y: isoY };
    }

    function drawIsoBlock(gx, gy, gz, fillTop, fillLeft, fillRight) {
      const p0 = isoProject(gx, gy, gz + 1);
      const p1 = isoProject(gx + 1, gy, gz + 1);
      const p2 = isoProject(gx + 1, gy + 1, gz + 1);
      const p3 = isoProject(gx, gy + 1, gz + 1);

      const b0 = isoProject(gx, gy, gz);
      const b1 = isoProject(gx + 1, gy, gz);
      const b2 = isoProject(gx + 1, gy + 1, gz);
      const b3 = isoProject(gx, gy + 1, gz);

      // Top Face
      cubeCtx.beginPath();
      cubeCtx.moveTo(p0.x, p0.y);
      cubeCtx.lineTo(p1.x, p1.y);
      cubeCtx.lineTo(p2.x, p2.y);
      cubeCtx.lineTo(p3.x, p3.y);
      cubeCtx.closePath();
      cubeCtx.fillStyle = fillTop;
      cubeCtx.fill();
      cubeCtx.strokeStyle = '#0f172a';
      cubeCtx.lineWidth = 1;
      cubeCtx.stroke();

      // Left Face
      cubeCtx.beginPath();
      cubeCtx.moveTo(p0.x, p0.y);
      cubeCtx.lineTo(p3.x, p3.y);
      cubeCtx.lineTo(b3.x, b3.y);
      cubeCtx.lineTo(b0.x, b0.y);
      cubeCtx.closePath();
      cubeCtx.fillStyle = fillLeft;
      cubeCtx.fill();
      cubeCtx.stroke();

      // Right Face
      cubeCtx.beginPath();
      cubeCtx.moveTo(p3.x, p3.y);
      cubeCtx.lineTo(p2.x, p2.y);
      cubeCtx.lineTo(b2.x, b2.y);
      cubeCtx.lineTo(b3.x, b3.y);
      cubeCtx.closePath();
      cubeCtx.fillStyle = fillRight;
      cubeCtx.fill();
      cubeCtx.stroke();
    }

    // Dibujar cubos 3x3x3
    for (let z = 0; z < gridSize; z++) {
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          const isHighlighted = (x === 1 && y === 1);
          const topColor = isHighlighted ? '#38bdf8' : 'rgba(79, 70, 229, 0.7)';
          const leftColor = isHighlighted ? '#0284c7' : 'rgba(67, 56, 202, 0.6)';
          const rightColor = isHighlighted ? '#bae6fd' : 'rgba(99, 102, 241, 0.5)';
          drawIsoBlock(x - 1.5, y - 1.5, z, topColor, leftColor, rightColor);
        }
      }
    }

    // Textos de Dimensiones
    cubeCtx.fillStyle = '#38bdf8';
    cubeCtx.font = 'bold 12px Inter, sans-serif';
    cubeCtx.fillText(`Eje X: ${xDim.toUpperCase()}`, 15, height - 35);
    cubeCtx.fillStyle = '#818cf8';
    cubeCtx.fillText(`Eje Y: ${yDim.toUpperCase()}`, 15, height - 20);
    cubeCtx.fillStyle = '#34d399';
    cubeCtx.fillText(`Eje Z: TIEMPO (Año/Mes)`, 15, height - 5);
  }

  // --- Handlers de Eventos ---

  // Cambio en Pivot
  [selRowDim, selColDim, selMeasure, selAgg].forEach(el => {
    el?.addEventListener('change', renderPivotMatrix);
  });

  // Intercambiar Dimensiones (Rotar / Pivot)
  btnSwapDims?.addEventListener('click', () => {
    const temp = selRowDim.value;
    selRowDim.value = selColDim.value;
    selColDim.value = temp;
    renderPivotMatrix();
  });

  // Filtros (Slice & Dice)
  function handleFilterChange() {
    const filters = {};
    if (filterYear && filterYear.value !== 'ALL') filters.year = [Number(filterYear.value)];
    if (filterRegion && filterRegion.value !== 'ALL') filters.region = [filterRegion.value];
    if (filterCategory && filterCategory.value !== 'ALL') filters.category = [filterCategory.value];
    if (filterChannel && filterChannel.value !== 'ALL') filters.channel = [filterChannel.value];

    engine.dice(filters);
    updateKPIs();
    renderPivotMatrix();
  }

  [filterYear, filterRegion, filterCategory, filterChannel].forEach(el => {
    el?.addEventListener('change', handleFilterChange);
  });

  btnResetFilters?.addEventListener('click', () => {
    if (filterYear) filterYear.value = 'ALL';
    if (filterRegion) filterRegion.value = 'ALL';
    if (filterCategory) filterCategory.value = 'ALL';
    if (filterChannel) filterChannel.value = 'ALL';
    engine.resetFilters();
    updateKPIs();
    renderPivotMatrix();
  });

  // Drill-Down y Roll-Up
  btnDrillTime?.addEventListener('click', () => {
    const nextDim = engine.drillDown('time');
    if (lblTimeLevel) lblTimeLevel.textContent = nextDim.toUpperCase();
    selColDim.value = nextDim;
    renderPivotMatrix();
  });

  btnRollTime?.addEventListener('click', () => {
    const prevDim = engine.rollUp('time');
    if (lblTimeLevel) lblTimeLevel.textContent = prevDim.toUpperCase();
    selColDim.value = prevDim;
    renderPivotMatrix();
  });

  btnDrillGeo?.addEventListener('click', () => {
    const nextDim = engine.drillDown('geography');
    if (lblGeoLevel) lblGeoLevel.textContent = nextDim.toUpperCase();
    selRowDim.value = nextDim;
    renderPivotMatrix();
  });

  btnRollGeo?.addEventListener('click', () => {
    const prevDim = engine.rollUp('geography');
    if (lblGeoLevel) lblGeoLevel.textContent = prevDim.toUpperCase();
    selRowDim.value = prevDim;
    renderPivotMatrix();
  });

  btnDrillProd?.addEventListener('click', () => {
    const nextDim = engine.drillDown('product');
    if (lblProdLevel) lblProdLevel.textContent = nextDim.toUpperCase();
    selRowDim.value = nextDim;
    renderPivotMatrix();
  });

  btnRollProd?.addEventListener('click', () => {
    const prevDim = engine.rollUp('product');
    if (lblProdLevel) lblProdLevel.textContent = prevDim.toUpperCase();
    selRowDim.value = prevDim;
    renderPivotMatrix();
  });

  // Tabs
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const targetPanel = document.getElementById(btn.dataset.tab);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });

  // Consola de Consultas OLAP
  btnRunQuery?.addEventListener('click', () => {
    const q = queryInput.value;
    const res = engine.executeOlapQuery(q);
    if (res.type === 'PIVOT') {
      renderPivotMatrix();
      if (queryOutput) {
        queryOutput.textContent = `Consulta PIVOT ejecutada con éxito sobre ${res.result.rows.length} filas x ${res.result.cols.length} columnas. Gran Total: $${res.result.grandTotal.toLocaleString()}`;
      }
    } else if (res.type === 'TABULAR') {
      if (queryOutput) {
        queryOutput.textContent = JSON.stringify(res.data, null, 2);
      }
    } else {
      if (queryOutput) {
        queryOutput.textContent = `Error: ${res.message}`;
      }
    }
  });

  // Exportar a CSV
  const btnExportCsv = document.getElementById('btn-export-csv');
  btnExportCsv?.addEventListener('click', () => {
    const pivotData = engine.pivot(selRowDim.value, selColDim.value, selMeasure.value, selAgg.value);
    let csv = `${pivotData.rowDimension},${pivotData.cols.join(',')},Total\n`;
    pivotData.matrix.forEach(row => {
      const vals = pivotData.cols.map(c => row.cells[c]?.value || 0);
      csv += `${row.rowKey},${vals.join(',')},${row.rowTotal}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `olap_pivot_${selRowDim.value}_vs_${selColDim.value}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Inicialización
  updateKPIs();
  renderPivotMatrix();
});
