"use strict";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const state = {
  algorithm: "both",
  huffman: null,
  shannon: null,
  sourceText: "",
  charts: {},
  adcVisibility: {
    analogica: true,
    muestras: true,
    cuantizada: true
  },
  bitmap: {
    size: 16,
    cells: [],
    image: null,
    pendingFrame: null,
    sourceType: "none",
    hasProcessed: false
  }
};

class HuffmanNode {
  constructor(symbol, frequency, left = null, right = null) {
    this.symbol = symbol;
    this.frequency = frequency;
    this.left = left;
    this.right = right;
  }
}

class ShannonNode {
  constructor(symbols, left = null, right = null) {
    this.symbol = symbols.length === 1 ? symbols[0].symbol : null;
    this.frequency = symbols.reduce((sum, item) => sum + item.frequency, 0);
    this.left = left;
    this.right = right;
  }
}

function symbolLabel(symbol) {
  if (symbol === " ") return "espacio";
  if (symbol === "\n") return "\\n";
  if (symbol === "\t") return "\\t";
  return symbol;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setStatus(text) {
  $("#statusText").textContent = text;
}

function fileExtension(file) {
  const name = file && file.name ? file.name : "";
  const dotIndex = name.lastIndexOf(".");
  return dotIndex >= 0 ? name.slice(dotIndex).toLowerCase() : "";
}

function isValidTextFile(file) {
  if (!file || file.size === 0) return false;
  const hasTxtExtension = fileExtension(file) === ".txt";
  const hasValidMime = !file.type || file.type === "text/plain";
  return hasTxtExtension && hasValidMime;
}

function readTextFile(file, onLoad) {
  if (!isValidTextFile(file)) {
    setStatus("Solo se permiten archivos .txt.");
    return false;
  }

  const reader = new FileReader();
  reader.onload = () => onLoad(String(reader.result || ""));
  reader.readAsText(file, "UTF-8");
  return true;
}

function isValidBitmapImageFile(file) {
  if (!file || file.size === 0) return false;
  const allowedExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".bmp"]);
  const hasAllowedExtension = allowedExtensions.has(fileExtension(file));
  const hasImageMime = !!file.type && file.type.startsWith("image/");
  return hasAllowedExtension && hasImageMime;
}

function setBitmapDropState(stateName, message) {
  const dropzone = $("#bitmapDropzone");
  dropzone.classList.remove("drag-active", "has-error", "has-file");
  if (stateName) dropzone.classList.add(stateName);
  $("#bitmapDropStatus").textContent = message;
}

function buildFrequencies(text) {
  const frequencies = {};
  for (const char of text) frequencies[char] = (frequencies[char] || 0) + 1;
  return frequencies;
}

function originalBitSize(text) {
  return new TextEncoder().encode(text).length * 8;
}

function symbolCount(text) {
  return Array.from(text).length;
}

function entropy(frequencies, total) {
  return Object.values(frequencies).reduce((sum, frequency) => {
    const probability = frequency / total;
    return sum - probability * Math.log2(probability);
  }, 0);
}

function buildHuffmanTree(frequencies) {
  const nodes = Object.entries(frequencies)
    .map(([symbol, frequency]) => new HuffmanNode(symbol, frequency))
    .sort((a, b) => a.frequency - b.frequency || String(a.symbol).localeCompare(String(b.symbol)));

  if (nodes.length === 1) return nodes[0];

  while (nodes.length > 1) {
    nodes.sort((a, b) => a.frequency - b.frequency);
    const left = nodes.shift();
    const right = nodes.shift();
    nodes.push(new HuffmanNode(null, left.frequency + right.frequency, left, right));
  }

  return nodes[0];
}

function walkHuffman(node, prefix = "", codes = {}) {
  if (!node) return codes;
  if (node.symbol !== null) {
    codes[node.symbol] = prefix || "0";
    return codes;
  }
  walkHuffman(node.left, `${prefix}0`, codes);
  walkHuffman(node.right, `${prefix}1`, codes);
  return codes;
}

function splitShannonSymbols(symbols) {
  const total = symbols.reduce((sum, item) => sum + item.frequency, 0);
  let acc = 0;
  let bestIndex = 1;
  let bestDelta = Infinity;

  for (let i = 1; i < symbols.length; i += 1) {
    acc += symbols[i - 1].frequency;
    const delta = Math.abs(acc - (total - acc));
    if (delta < bestDelta) {
      bestDelta = delta;
      bestIndex = i;
    }
  }

  return bestIndex;
}

function buildShannonCodes(symbols, prefix = "", codes = {}) {
  if (symbols.length === 1) {
    codes[symbols[0].symbol] = prefix || "0";
    return codes;
  }

  const split = splitShannonSymbols(symbols);
  buildShannonCodes(symbols.slice(0, split), `${prefix}0`, codes);
  buildShannonCodes(symbols.slice(split), `${prefix}1`, codes);
  return codes;
}

function buildShannonTree(symbols) {
  if (symbols.length === 1) return new ShannonNode(symbols);

  const split = splitShannonSymbols(symbols);
  const left = buildShannonTree(symbols.slice(0, split));
  const right = buildShannonTree(symbols.slice(split));
  return new ShannonNode(symbols, left, right);
}

function encodeWithCodes(text, codes) {
  return [...text].map((char) => codes[char]).join("");
}

function decodeWithCodes(bits, codes) {
  const reverse = Object.fromEntries(Object.entries(codes).map(([symbol, code]) => [code, symbol]));
  const prefixes = new Set();
  for (const code of Object.values(codes)) {
    for (let i = 1; i <= code.length; i += 1) prefixes.add(code.slice(0, i));
  }

  let buffer = "";
  let output = "";

  for (const bit of bits) {
    if (bit !== "0" && bit !== "1") {
      return { output, valid: false, error: "El mensaje contiene caracteres que no son binarios." };
    }

    buffer += bit;
    if (!prefixes.has(buffer)) {
      return { output, valid: false, error: "El código binario no corresponde a la tabla seleccionada." };
    }

    if (reverse[buffer] !== undefined) {
      output += reverse[buffer];
      buffer = "";
    }
  }

  if (buffer.length > 0) {
    return { output, valid: false, error: "El código binario quedó incompleto para la tabla seleccionada." };
  }

  return { output, valid: true, error: "" };
}

function metricsFor(text, frequencies, codes, encoded) {
  const originalBits = originalBitSize(text);
  const compressedBits = encoded.length;
  const totalSymbols = symbolCount(text);
  const averageLength = Object.entries(codes).reduce((sum, [symbol, code]) => {
    return sum + code.length * (frequencies[symbol] / totalSymbols);
  }, 0);
  const h = entropy(frequencies, totalSymbols);

  return {
    originalBits,
    compressedBits,
    averageLength,
    compressionRate: originalBits ? ((1 - compressedBits / originalBits) * 100) : 0,
    efficiency: averageLength ? (h / averageLength) * 100 : 0,
    entropy: h
  };
}

function runHuffman(text) {
  const frequencies = buildFrequencies(text);
  const tree = buildHuffmanTree(frequencies);
  const codes = walkHuffman(tree);
  const encoded = encodeWithCodes(text, codes);
  return {
    name: "Huffman",
    frequencies,
    tree,
    codes,
    encoded,
    decoded: decodeWithCodes(encoded, codes).output,
    metrics: metricsFor(text, frequencies, codes, encoded)
  };
}

function runShannonFano(text) {
  const frequencies = buildFrequencies(text);
  const symbols = Object.entries(frequencies)
    .map(([symbol, frequency]) => ({ symbol, frequency }))
    .sort((a, b) => b.frequency - a.frequency || a.symbol.localeCompare(b.symbol));
  const tree = buildShannonTree(symbols);
  const codes = buildShannonCodes(symbols);
  const encoded = encodeWithCodes(text, codes);
  return {
    name: "Shannon-Fano",
    frequencies,
    tree,
    codes,
    encoded,
    decoded: decodeWithCodes(encoded, codes).output,
    metrics: metricsFor(text, frequencies, codes, encoded)
  };
}

function processText() {
  const text = $("#sourceText").value;
  $("#charCount").textContent = `${text.length} caracteres`;
  if (text.length === 0) {
    clearCompressionUI();
    setStatus("Ingrese texto");
    return;
  }

  state.sourceText = text;
  state.huffman = runHuffman(text);
  state.shannon = runShannonFano(text);
  updateCompressionUI(text);
  clearDecodeUI();
  updateCharts();
  renderTree();
  setStatus("Mensaje procesado");
}

function clearDecodeUI() {
  $("#encodedInput").value = "";
  $("#decodedOutput").value = "";
  $("#decodeStatus").textContent = "Pendiente";
}

function clearCompressionUI() {
  state.sourceText = "";
  state.huffman = null;
  state.shannon = null;
  $("#originalBits").textContent = "0";
  $("#huffmanBits").textContent = "0 bits";
  $("#shannonBits").textContent = "0 bits";
  $("#compressionRate").textContent = "0%";
  $("#efficiencyValue").textContent = "0%";
  $("#avgLength").textContent = "0";
  $("#entropyValue").textContent = "0";
  $("#bestAlgorithm").textContent = "Sin datos";
  $("#analyzedMessagePreview").textContent = "Sin mensaje procesado";
  $("#resultTotalChars").textContent = "0";
  $("#resultUniqueSymbols").textContent = "0";
  $("#resultAlgorithms").textContent = "Huffman y Shannon-Fano";
  $("#encodedOutput").value = "";
  $("#encodedMeta").textContent = "0 bits";
  $("#huffmanEncodedOutput").value = "";
  $("#shannonEncodedOutput").value = "";
  $("#decodedSummaryOutput").value = "";
  $("#summaryOriginalSize").textContent = "0 bits";
  $("#summaryHuffmanSize").textContent = "0 bits";
  $("#summaryShannonSize").textContent = "0 bits";
  $("#summaryCompressionRate").textContent = "0%";
  $("#visualOriginalSize").textContent = "0 bits";
  $("#visualHuffmanSize").textContent = "0 bits";
  $("#visualShannonSize").textContent = "0 bits";
  $("#visualBestAlgorithm").textContent = "Sin datos";
  $("#visualSizeDifference").textContent = "0 bits";
  $("#visualCompressionRate").textContent = "0%";
  clearDecodeUI();
  $("#symbolsTable").innerHTML = '<tr><td colspan="6">Procese un texto para ver la tabla.</td></tr>';
  $("#treeView").textContent = "Procese texto para visualizar el arbol.";
}

function updateCompressionUI(text) {
  const huffman = state.huffman;
  const shannon = state.shannon;
  const active = state.algorithm === "shannon" ? shannon : huffman;
  const best = huffman.metrics.compressedBits <= shannon.metrics.compressedBits ? huffman : shannon;

  $("#originalBits").textContent = `${originalBitSize(text)}`;
  $("#huffmanBits").textContent = `${huffman.metrics.compressedBits} bits`;
  $("#shannonBits").textContent = `${shannon.metrics.compressedBits} bits`;
  $("#compressionRate").textContent = `${best.metrics.compressionRate.toFixed(2)}%`;
  $("#efficiencyValue").textContent = `${best.metrics.efficiency.toFixed(2)}%`;
  $("#avgLength").textContent = `${best.metrics.averageLength.toFixed(3)} bits`;
  $("#entropyValue").textContent = `${best.metrics.entropy.toFixed(3)} bits`;
  $("#bestAlgorithm").textContent = best.name;
  $("#encodedOutput").value = active.encoded;
  $("#encodedMeta").textContent = `${active.metrics.compressedBits} bits`;
  $("#analyzedMessagePreview").textContent = text.length > 180 ? `${text.slice(0, 180)}...` : text;
  $("#resultTotalChars").textContent = `${symbolCount(text)}`;
  $("#resultUniqueSymbols").textContent = `${Object.keys(huffman.frequencies).length}`;
  $("#resultAlgorithms").textContent = "Huffman y Shannon-Fano";
  $("#huffmanEncodedOutput").value = huffman.encoded;
  $("#shannonEncodedOutput").value = shannon.encoded;
  $("#decodedSummaryOutput").value = huffman.decoded;
  $("#summaryOriginalSize").textContent = `${huffman.metrics.originalBits} bits`;
  $("#summaryHuffmanSize").textContent = `${huffman.metrics.compressedBits} bits`;
  $("#summaryShannonSize").textContent = `${shannon.metrics.compressedBits} bits`;
  $("#summaryCompressionRate").textContent = `${best.metrics.compressionRate.toFixed(2)}%`;
  $("#visualOriginalSize").textContent = `${huffman.metrics.originalBits} bits`;
  $("#visualHuffmanSize").textContent = `${huffman.metrics.compressedBits} bits`;
  $("#visualShannonSize").textContent = `${shannon.metrics.compressedBits} bits`;
  $("#visualBestAlgorithm").textContent = best.name;
  $("#visualSizeDifference").textContent = `${Math.abs(huffman.metrics.compressedBits - shannon.metrics.compressedBits)} bits`;
  $("#visualCompressionRate").textContent = `${best.metrics.compressionRate.toFixed(2)}%`;

  renderSymbolsTable(text, huffman, shannon);
}

function renderSymbolsTable(text, huffman, shannon) {
  const totalSymbols = symbolCount(text);
  const rows = Object.entries(huffman.frequencies)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([symbol, frequency]) => {
      const probability = (frequency / totalSymbols) * 100;
      return `
        <tr>
          <td>${escapeHtml(symbolLabel(symbol))}</td>
          <td>${frequency}</td>
          <td>${huffman.codes[symbol]}</td>
          <td>${huffman.codes[symbol].length}</td>
          <td>${shannon.codes[symbol]}</td>
          <td>${shannon.codes[symbol].length}</td>
        </tr>
      `;
    })
    .join("");

  $("#symbolsTable").innerHTML = rows;
}

function measureTree(node, depth = 0) {
  if (!node) return { leaves: 0, depth };
  if (!node.left && !node.right) return { leaves: 1, depth };
  const left = measureTree(node.left, depth + 1);
  const right = measureTree(node.right, depth + 1);
  return {
    leaves: left.leaves + right.leaves,
    depth: Math.max(left.depth, right.depth)
  };
}

function maxTreeLabelLength(node) {
  if (!node) return 0;
  const label = node.symbol === null ? `${node.frequency}` : `${symbolLabel(node.symbol)}:${node.frequency}`;
  return Math.max(label.length, maxTreeLabelLength(node.left), maxTreeLabelLength(node.right));
}

function layoutTree(node, depth, cursor, nodes, links, spacing) {
  if (!node) return 0;

  const isLeaf = !node.left && !node.right;
  if (isLeaf) {
    const x = spacing.margin + cursor.value * spacing.x;
    const y = spacing.margin + depth * spacing.y;
    nodes.push({ node, x, y, depth, isLeaf });
    cursor.value += 1;
    return x;
  }

  const leftX = layoutTree(node.left, depth + 1, cursor, nodes, links, spacing);
  const rightX = layoutTree(node.right, depth + 1, cursor, nodes, links, spacing);
  const x = (leftX + rightX) / 2;
  const y = spacing.margin + depth * spacing.y;
  const current = { node, x, y, depth, isLeaf: false };
  nodes.push(current);

  [node.left, node.right].forEach((child) => {
    if (!child) return;
    const childEntry = nodes.find((entry) => entry.node === child);
    if (childEntry) links.push({ from: current, to: childEntry });
  });

  return x;
}

function renderTreeSvg(root, algorithm) {
  const stats = measureTree(root);
  const leafCount = Math.max(stats.leaves, 1);
  const depthCount = Math.max(stats.depth + 1, 1);
  const dense = leafCount > 10;
  const maxLabelLength = maxTreeLabelLength(root);
  const fontSize = dense ? 13 : 15;
  const estimatedMaxNodeWidth = Math.max(dense ? 68 : 82, maxLabelLength * fontSize * 0.78 + 30);
  const spacing = {
    margin: Math.ceil(estimatedMaxNodeWidth / 2 + 18),
    x: Math.max(dense ? 88 : 112, estimatedMaxNodeWidth + 20),
    y: dense ? 94 : 112
  };
  const nodeHeight = dense ? 34 : 40;
  const width = Math.max(leafCount * spacing.x + spacing.margin, 280);
  const height = Math.max(depthCount * spacing.y + spacing.margin, 180);
  const nodes = [];
  const links = [];

  layoutTree(root, 0, { value: 0 }, nodes, links, spacing);

  const lines = links.map(({ from, to }) => `
    <line class="svg-tree-link ${algorithm}" x1="${from.x}" y1="${from.y + nodeHeight / 2}" x2="${to.x}" y2="${to.y - nodeHeight / 2}" />
  `).join("");

  const circles = nodes.map((entry) => {
    const label = entry.isLeaf ? `${symbolLabel(entry.node.symbol)}:${entry.node.frequency}` : `${entry.node.frequency}`;
    const safeLabel = escapeHtml(label);
    const nodeClass = entry.isLeaf ? "leaf" : "internal";
    const rootClass = entry.depth === 0 ? " root" : "";
    const nodeWidth = Math.max(dense ? 68 : 82, label.length * fontSize * 0.78 + 30);
    const x = -nodeWidth / 2;
    const y = -nodeHeight / 2;
    return `
      <g class="svg-tree-node ${algorithm} ${nodeClass}${rootClass}" transform="translate(${entry.x} ${entry.y})">
        <rect x="${x}" y="${y}" width="${nodeWidth}" height="${nodeHeight}" rx="${nodeHeight / 2}" />
        <text text-anchor="middle" dominant-baseline="central" font-size="${fontSize}">${safeLabel}</text>
      </g>
    `;
  }).join("");

  return `
    <svg class="svg-tree ${algorithm}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Árbol ${algorithm}">
      ${lines}
      ${circles}
    </svg>
  `;
}

function renderTree() {
  if (!state.huffman || !state.shannon) {
    $("#treeView").textContent = "Procese texto para visualizar el arbol.";
    return;
  }

  $("#treeView").innerHTML = `
    <div class="tree-card">
      <div class="tree-card-header">
        <h3>Árbol Huffman</h3>
        <span>Frecuencia acumulada en nodos internos</span>
      </div>
      <div class="tree-canvas">${renderTreeSvg(state.huffman.tree, "huffman")}</div>
    </div>
    <div class="tree-card">
      <div class="tree-card-header">
        <h3>Árbol Shannon-Fano</h3>
        <span>Particiones por probabilidad</span>
      </div>
      <div class="tree-canvas">${renderTreeSvg(state.shannon.tree, "shannon")}</div>
    </div>
  `;
}

function chartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: "#ffffff", font: { size: 13, weight: "600" } } }
    },
    scales: {
      x: { ticks: { color: "#e6edf8", font: { size: 12 } }, grid: { color: "#263852" } },
      y: { ticks: { color: "#e6edf8", font: { size: 12 } }, grid: { color: "#263852" } }
    }
  };
}

function adcChartOptions(chartKey) {
  const options = chartOptions();
  const defaultLegendClick = Chart.defaults.plugins.legend.onClick;

  options.parsing = false;
  options.plugins.legend.onClick = (event, legendItem, legend) => {
    defaultLegendClick(event, legendItem, legend);

    if (chartKey === "adc") {
      state.adcVisibility.analogica = legend.chart.isDatasetVisible(0);
      state.adcVisibility.muestras = legend.chart.isDatasetVisible(1);
    }

    if (chartKey === "digital") {
      state.adcVisibility.cuantizada = legend.chart.isDatasetVisible(0);
    }
  };

  return options;
}

function replaceChart(key, canvasId, config) {
  if (state.charts[key]) state.charts[key].destroy();
  state.charts[key] = new Chart($(canvasId), config);
}

function updateCharts() {
  if (!state.huffman || !window.Chart) {
    setStatus("Chart.js no disponible");
    return;
  }
  const symbols = Object.keys(state.huffman.frequencies).sort((a, b) => state.huffman.frequencies[b] - state.huffman.frequencies[a]);
  const labels = symbols.map(symbolLabel);

  replaceChart("frequency", "#frequencyChart", {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: "Frecuencia", data: symbols.map((s) => state.huffman.frequencies[s]), backgroundColor: "#1e3a8a" }]
    },
    options: chartOptions()
  });

  replaceChart("length", "#lengthChart", {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Huffman", data: symbols.map((s) => state.huffman.codes[s].length), backgroundColor: "#1e3a8a" },
        { label: "Shannon-Fano", data: symbols.map((s) => state.shannon.codes[s].length), backgroundColor: "#7c3aed" }
      ]
    },
    options: chartOptions()
  });

  replaceChart("comparison", "#comparisonChart", {
    type: "bar",
    data: {
      labels: ["Original", "Huffman", "Shannon-Fano"],
      datasets: [{
        label: "Bits",
        data: [state.huffman.metrics.originalBits, state.huffman.metrics.compressedBits, state.shannon.metrics.compressedBits],
        backgroundColor: ["#1f2937", "#1e3a8a", "#7c3aed"]
      }]
    },
    options: chartOptions()
  });
}

function decodeMessage() {
  const bits = $("#encodedInput").value.trim();
  const selected = $("#decodeAlgorithm").value === "shannon" ? state.shannon : state.huffman;
  $("#decodedOutput").value = "";

  if (!selected) {
    $("#decodeStatus").textContent = "Primero procese un texto para generar la tabla.";
    return;
  }

  if (bits.length === 0) {
    $("#decodeStatus").textContent = "Ingrese un código binario.";
    return;
  }

  const decoded = decodeWithCodes(bits, selected.codes);
  $("#decodedOutput").value = decoded.output;
  $("#decodeStatus").textContent = decoded.valid ? "Válido" : decoded.error;
}

function initBitmap() {
  const size = Number($("#bitmapSize").value);
  state.bitmap.size = size;
  resetBitmapState();
}

function updateBitmapResolutionLabel() {
  const size = state.bitmap.size;
  $("#bitmapMeta").textContent = `${size} x ${size}`;
  $("#bitmapResolutionLabel").textContent = `Resolución: ${size}x${size}`;
}

function resetBitmapState() {
  const size = state.bitmap.size;
  state.bitmap.cells = Array.from({ length: size * size }, () => 0);
  state.bitmap.image = null;
  state.bitmap.sourceType = "none";
  state.bitmap.hasProcessed = false;
  updateBitmapResolutionLabel();
  $("#bitmapFile").value = "";
  setBitmapDropState("", "Sin imagen cargada.");
  clearCanvas("#bitmapOriginalCanvas");
  drawBitmap();
  resetBitmapMetrics();
  updateBitmapDownloadState();
}

function clearCanvas(selector) {
  const canvas = $(selector);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function resetBitmapMetrics() {
  $("#bitmapOriginal").textContent = "0";
  $("#bitmapCompressed").textContent = "0";
  $("#bitmapWhite").textContent = "0";
  $("#bitmapBlack").textContent = "0";
  $("#bitmapRatio").textContent = "0%";
  $("#bitmapOutput").value = "";
}

function updateBitmapDownloadState() {
  $("#downloadBitmap").disabled = !state.bitmap.hasProcessed;
}

function requestBitmapReprocess() {
  const nextSize = Number($("#bitmapSize").value);
  state.bitmap.size = nextSize;
  updateBitmapResolutionLabel();

  if (state.bitmap.pendingFrame) cancelAnimationFrame(state.bitmap.pendingFrame);
  state.bitmap.pendingFrame = requestAnimationFrame(() => {
    state.bitmap.pendingFrame = null;
    reprocessBitmapSource();
  });
}

function reprocessBitmapSource() {
  if (state.bitmap.sourceType === "image" && state.bitmap.image) {
    processBitmapImage(state.bitmap.image);
    return;
  }

  if (state.bitmap.sourceType === "pattern") {
    applyBitmapPattern();
    return;
  }

  if (state.bitmap.sourceType === "manual") {
    state.bitmap.cells = resizeBitmapCells(state.bitmap.cells, state.bitmap.size);
    drawBitmap();
    compressBitmap();
    updateBitmapDownloadState();
    return;
  }

  resetBitmapState();
}

function resizeBitmapCells(cells, nextSize) {
  const previousSize = Math.sqrt(cells.length);
  if (!Number.isInteger(previousSize) || previousSize <= 0) {
    return Array.from({ length: nextSize * nextSize }, () => 0);
  }

  return Array.from({ length: nextSize * nextSize }, (_, index) => {
    const x = index % nextSize;
    const y = Math.floor(index / nextSize);
    const previousX = Math.min(previousSize - 1, Math.floor((x / nextSize) * previousSize));
    const previousY = Math.min(previousSize - 1, Math.floor((y / nextSize) * previousSize));
    return cells[previousY * previousSize + previousX] || 0;
  });
}

function drawBitmap() {
  const canvas = $("#bitmapCanvas");
  const ctx = canvas.getContext("2d");
  const size = state.bitmap.size;
  const cell = canvas.width / size;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  state.bitmap.cells.forEach((value, index) => {
    const x = index % size;
    const y = Math.floor(index / size);
    ctx.fillStyle = value ? "#0b0f19" : "#ffffff";
    ctx.fillRect(x * cell, y * cell, cell, cell);
  });

  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= size; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * cell, 0);
    ctx.lineTo(i * cell, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * cell);
    ctx.lineTo(canvas.width, i * cell);
    ctx.stroke();
  }
}

function toggleBitmapCell(event) {
  const canvas = $("#bitmapCanvas");
  const rect = canvas.getBoundingClientRect();
  const size = state.bitmap.size;
  const x = Math.floor(((event.clientX - rect.left) / rect.width) * size);
  const y = Math.floor(((event.clientY - rect.top) / rect.height) * size);
  const index = y * size + x;
  if (index < 0 || index >= state.bitmap.cells.length) return;
  state.bitmap.cells[index] = state.bitmap.cells[index] ? 0 : 1;
  state.bitmap.sourceType = "manual";
  state.bitmap.hasProcessed = true;
  drawBitmap();
  compressBitmap();
  updateBitmapDownloadState();
}

function compressBitmap() {
  const cells = state.bitmap.cells;
  const runs = [];
  let current = cells[0] || 0;
  let count = 0;

  for (const cell of cells) {
    if (cell === current) {
      count += 1;
    } else {
      runs.push([current, count]);
      current = cell;
      count = 1;
    }
  }
  runs.push([current, count]);

  const maxRun = Math.max(...runs.map(([, run]) => run));
  const runBits = Math.max(1, Math.ceil(Math.log2(maxRun + 1)));
  const compressedBits = runs.length * (1 + runBits);
  const originalBits = cells.length;
  const ratio = ((1 - compressedBits / originalBits) * 100);
  const blackPixels = cells.filter(Boolean).length;
  const whitePixels = cells.length - blackPixels;

  $("#bitmapOriginal").textContent = `${originalBits}`;
  $("#bitmapCompressed").textContent = `${compressedBits}`;
  $("#bitmapWhite").textContent = `${whitePixels}`;
  $("#bitmapBlack").textContent = `${blackPixels}`;
  $("#bitmapRatio").textContent = `${ratio.toFixed(2)}%`;
  $("#bitmapOutput").value = runs.map(([value, run]) => `${value}:${run}`).join(" ");
}

function randomBitmap() {
  if (state.bitmap.sourceType === "image" && state.bitmap.hasProcessed) {
    const replace = window.confirm("Ya hay una imagen cargada. ¿Querés reemplazarla por un patrón de prueba?");
    if (!replace) return;
  }

  applyBitmapPattern();
}

function applyBitmapPattern() {
  const size = state.bitmap.size;
  clearCanvas("#bitmapOriginalCanvas");
  state.bitmap.cells = Array.from({ length: size * size }, (_, index) => {
    const x = index % size;
    const y = Math.floor(index / size);
    return (x === y || x + y === size - 1 || (x > 3 && x < size - 4 && y % 4 === 0)) ? 1 : 0;
  });
  state.bitmap.image = null;
  state.bitmap.sourceType = "pattern";
  state.bitmap.hasProcessed = true;
  drawBitmap();
  compressBitmap();
  updateBitmapDownloadState();
}

function loadBitmapImage(file) {
  if (!isValidBitmapImageFile(file)) {
    setStatus("Solo se permiten imágenes PNG, JPG, JPEG, WEBP o BMP.");
    setBitmapDropState("has-error", "Archivo inválido.");
    return;
  }

  const image = new Image();
  image.onload = () => {
    state.bitmap.image = image;
    drawOriginalBitmapPreview(image);
    processBitmapImage(image);
    setStatus("Imagen procesada en blanco y negro");
    setBitmapDropState("has-file", "Imagen cargada correctamente.");
    URL.revokeObjectURL(image.src);
  };
  image.onerror = () => {
    setStatus("Solo se permiten imágenes PNG, JPG, JPEG, WEBP o BMP.");
    setBitmapDropState("has-error", "Archivo inválido.");
    URL.revokeObjectURL(image.src);
  };
  image.src = URL.createObjectURL(file);
}

function processBitmapImage(image) {
  const size = state.bitmap.size;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, size, size);
  const pixels = ctx.getImageData(0, 0, size, size).data;
  state.bitmap.cells = Array.from({ length: size * size }, (_, i) => {
    const offset = i * 4;
    const luminance = pixels[offset] * 0.299 + pixels[offset + 1] * 0.587 + pixels[offset + 2] * 0.114;
    return luminance < 128 ? 1 : 0;
  });
  state.bitmap.sourceType = "image";
  state.bitmap.hasProcessed = true;
  drawBitmap();
  compressBitmap();
  updateBitmapDownloadState();
}

function handleBitmapDropFiles(files) {
  if (!files || files.length === 0) {
    setBitmapDropState("has-error", "Archivo inválido.");
    return;
  }

  const file = files[0];
  if (files.length > 1) setStatus("Se procesó solo el primer archivo.");
  loadBitmapImage(file);
}

function preventBitmapDropDefaults(event) {
  event.preventDefault();
  event.stopPropagation();
}

function drawOriginalBitmapPreview(image) {
  const canvas = $("#bitmapOriginalCanvas");
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
}

function downloadProcessedBitmap() {
  if (!state.bitmap.hasProcessed) {
    setStatus("No hay imagen procesada para descargar.");
    return;
  }

  const canvas = $("#bitmapCanvas");
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = "bitmap_bn_procesado.png";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function signalValue(type, t, frequency) {
  if (type === "square") return Math.sin(2 * Math.PI * frequency * t) >= 0 ? 1 : -1;
  if (type === "noise") return Math.sin(2 * Math.PI * frequency * t) * 0.35 + (Math.random() * 2 - 1) * 0.65;
  return Math.sin(2 * Math.PI * frequency * t);
}

function quantize(value, bits) {
  const levels = 2 ** bits;
  return Math.round(((value + 1) / 2) * (levels - 1)) / (levels - 1) * 2 - 1;
}

function updateAdc() {
  if (!window.Chart) {
    setStatus("Chart.js no disponible");
    return;
  }

  const type = $("#signalType").value;
  const frequency = Number($("#signalFrequency").value);
  const samplingRate = Number($("#samplingRate").value);
  const bits = Number($("#quantBits").value);
  const duration = 1;
  const points = 240;
  const analog = [];
  const samples = [];
  const sampleCount = Math.max(2, Math.floor(samplingRate * duration));

  for (let i = 0; i < points; i += 1) {
    const t = (i / (points - 1)) * duration;
    analog.push({ x: t, y: signalValue(type, t, frequency) });
  }

  for (let i = 0; i < sampleCount; i += 1) {
    const t = (i / (sampleCount - 1)) * duration;
    samples.push({ x: t, y: quantize(signalValue(type, t, frequency), bits) });
  }

  const nyquist = samplingRate / 2;
  const aliasing = frequency > nyquist;
  $("#frequencyLabel").textContent = `${frequency} Hz`;
  $("#samplingLabel").textContent = `${samplingRate} Hz`;
  $("#nyquistValue").textContent = `${nyquist.toFixed(1)} Hz`;
  $("#sampleCount").textContent = `${sampleCount}`;
  $("#quantLevels").textContent = `${2 ** bits}`;
  $("#aliasingValue").textContent = aliasing ? "Sí" : "No";
  $("#nyquistStatus").textContent = aliasing ? "Aliasing detectado" : "Nyquist estable";
  $("#nyquistStatus").style.color = aliasing ? "#f59e0b" : "#10b981";

  const adcOptions = adcChartOptions("adc");
  const digitalOptions = adcChartOptions("digital");

  replaceChart("adc", "#adcChart", {
    type: "line",
    data: {
      datasets: [
        { label: "Analógica", data: analog, borderColor: "#e5e7eb", pointRadius: 0, tension: 0.2, hidden: !state.adcVisibility.analogica },
        { label: "Muestras", data: samples, borderColor: "#7c3aed", backgroundColor: "#7c3aed", pointRadius: 3, showLine: false, hidden: !state.adcVisibility.muestras }
      ]
    },
    options: adcOptions
  });

  replaceChart("digital", "#digitalChart", {
    type: "line",
    data: {
      datasets: [{ label: "Cuantizada", data: samples, borderColor: "#1e3a8a", backgroundColor: "#1e3a8a", stepped: true, pointRadius: 2, hidden: !state.adcVisibility.cuantizada }]
    },
    options: digitalOptions
  });
}

function bindEvents() {
  $$(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      $$(".nav-item").forEach((item) => item.classList.remove("active"));
      $$(".app-section").forEach((section) => section.classList.remove("active"));
      button.classList.add("active");
      $(`#${button.dataset.section}`).classList.add("active");
      if (button.dataset.section === "adc") updateAdc();
    });
  });

  $$(".segment").forEach((button) => {
    button.addEventListener("click", () => {
      $$(".segment").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      state.algorithm = button.dataset.algorithm;
      if (state.huffman) updateCompressionUI($("#sourceText").value);
    });
  });

  $("#sourceText").addEventListener("input", () => {
    $("#charCount").textContent = `${$("#sourceText").value.length} caracteres`;
  });
  $("#processButton").addEventListener("click", processText);
  $("#decodeButton").addEventListener("click", decodeMessage);
  $("#textFile").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    readTextFile(file, (text) => {
      $("#fileName").textContent = file.name;
      $("#sourceText").value = text;
      processText();
    });
  });
  $("#decodeFile").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    readTextFile(file, (text) => {
      $("#decodeFileName").textContent = file.name;
      $("#encodedInput").value = text;
      $("#decodedOutput").value = "";
      $("#decodeStatus").textContent = "Pendiente";
    });
  });

  $("#loadDemoButton").addEventListener("click", () => {
    $("#sourceText").value = "comunicación de datos y compresión binaria con huffman y shannon fano";
    processText();
  });

  $("#bitmapCanvas").addEventListener("click", toggleBitmapCell);
  $("#bitmapSize").addEventListener("input", requestBitmapReprocess);
  $("#clearBitmap").addEventListener("click", initBitmap);
  $("#randomBitmap").addEventListener("click", randomBitmap);
  $("#downloadBitmap").addEventListener("click", downloadProcessedBitmap);
  $("#bitmapFile").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) loadBitmapImage(file);
  });

  const bitmapDropzone = $("#bitmapDropzone");
  ["dragenter", "dragover"].forEach((eventName) => {
    bitmapDropzone.addEventListener(eventName, (event) => {
      preventBitmapDropDefaults(event);
      setBitmapDropState("drag-active", "Soltá la imagen para procesarla.");
    });
  });
  ["dragleave"].forEach((eventName) => {
    bitmapDropzone.addEventListener(eventName, (event) => {
      preventBitmapDropDefaults(event);
      const message = state.bitmap.hasProcessed ? "Imagen cargada correctamente." : "Sin imagen cargada.";
      setBitmapDropState(state.bitmap.hasProcessed ? "has-file" : "", message);
    });
  });
  bitmapDropzone.addEventListener("drop", (event) => {
    preventBitmapDropDefaults(event);
    handleBitmapDropFiles(event.dataTransfer.files);
  });

  ["#signalType", "#signalFrequency", "#samplingRate", "#quantBits"].forEach((selector) => {
    $(selector).addEventListener("input", updateAdc);
    $(selector).addEventListener("change", updateAdc);
  });
}

function init() {
  bindEvents();
  initBitmap();
  updateAdc();
  $("#sourceText").value = "ingenieria de comunicaciones";
  processText();
}

document.addEventListener("DOMContentLoaded", init);
