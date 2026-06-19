"use strict";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const state = {
  algorithm: "both",
  huffman: null,
  shannon: null,
  sourceText: "",
  charts: {},
  bitmap: {
    size: 16,
    cells: [],
    image: null,
    pendingFrame: null,
    sourceType: "none",
    hasProcessed: false
  },
  treeViewers: []
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

function treeNodeLabelParts(entry) {
  if (!entry.isLeaf) return [`${entry.node.frequency}`];
  return [symbolLabel(entry.node.symbol), `${entry.node.frequency}`];
}

function treeNodeRadius(entry, dense, largeView = false) {
  if (entry.depth === 0) return largeView ? 96 : 84;
  if (entry.isLeaf) return largeView ? 84 : 72;
  return largeView ? 78 : 66;
}

function treeLinkEndpoint(from, to, dense, largeView = false) {
  const fromRadius = treeNodeRadius(from, dense, largeView);
  const toRadius = treeNodeRadius(to, dense, largeView);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.max(Math.hypot(dx, dy), 1);
  const unitX = dx / distance;
  const unitY = dy / distance;

  return {
    x1: from.x + unitX * fromRadius,
    y1: from.y + unitY * fromRadius,
    x2: to.x - unitX * toRadius,
    y2: to.y - unitY * toRadius
  };
}

function renderTreeSvg(root, algorithm, options = {}) {
  const largeView = Boolean(options.largeView);
  const stats = measureTree(root);
  const leafCount = Math.max(stats.leaves, 1);
  const depthCount = Math.max(stats.depth + 1, 1);
  const dense = leafCount > 14;
  const maxLabelLength = maxTreeLabelLength(root);
  const fontSize = largeView ? 26 : 20;
  const leafFontSize = largeView ? 24 : 20;
  const baseRadius = treeNodeRadius({ depth: 1 }, dense, largeView);
  const rootRadius = treeNodeRadius({ depth: 0 }, dense, largeView);
  const estimatedNodeDiameter = Math.max(rootRadius * 2, maxLabelLength * fontSize * 0.74 + baseRadius * 1.7);
  const spacing = {
    margin: Math.ceil(rootRadius + 48),
    x: Math.max(dense ? 190 : 230, estimatedNodeDiameter + 64),
    y: dense ? 204 : 238
  };
  const width = Math.max(leafCount * spacing.x + spacing.margin, 520);
  const height = Math.max(depthCount * spacing.y + spacing.margin, 300);
  const nodes = [];
  const links = [];

  layoutTree(root, 0, { value: 0 }, nodes, links, spacing);

  const lines = links.map(({ from, to }) => {
    const endpoint = treeLinkEndpoint(from, to, dense, largeView);
    return `
      <line class="svg-tree-link ${algorithm}" x1="${endpoint.x1}" y1="${endpoint.y1}" x2="${endpoint.x2}" y2="${endpoint.y2}" />
    `;
  }).join("");

  const circles = nodes.map((entry) => {
    const labelParts = treeNodeLabelParts(entry).map(escapeHtml);
    const nodeClass = entry.isLeaf ? "leaf" : "internal";
    const rootClass = entry.depth === 0 ? " root" : "";
    const radius = treeNodeRadius(entry, dense, largeView);
    const labelMarkup = entry.isLeaf ? `
        <text class="tree-label leaf-label" text-anchor="middle" dominant-baseline="middle" font-size="${leafFontSize}">
          <tspan x="0" dy="-0.35em">${labelParts[0]}</tspan>
          <tspan x="0" dy="1.15em">${labelParts[1]}</tspan>
        </text>
      ` : `
        <text class="tree-label" text-anchor="middle" dominant-baseline="middle" font-size="${fontSize}">${labelParts[0]}</text>
      `;

    return `
      <g class="svg-tree-node ${algorithm} ${nodeClass}${rootClass}" transform="translate(${entry.x} ${entry.y})">
        <circle r="${radius}" />
        ${labelMarkup}
      </g>
    `;
  }).join("");

  return `
    <svg class="svg-tree ${algorithm}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Árbol ${algorithm}">
      <g class="svg-tree-content">
        ${lines}
        ${circles}
      </g>
    </svg>
  `;
}

function renderTree() {
  if (!state.huffman || !state.shannon) {
    $("#treeView").textContent = "Procese texto para visualizar el arbol.";
    return;
  }

  const huffmanLeaves = measureTree(state.huffman.tree).leaves;
  const shannonLeaves = measureTree(state.shannon.tree).leaves;
  const hasDenseTree = Math.max(huffmanLeaves, shannonLeaves) > 10;
  const treeView = $("#treeView");

  treeView.className = `tree-view ${hasDenseTree ? "tree-view-stacked" : "tree-view-paired"}`;
  treeView.innerHTML = `
    <div class="tree-card">
      <div class="tree-card-header">
        <div>
          <h3>Árbol Huffman</h3>
          <span>Frecuencia acumulada en nodos internos</span>
        </div>
        <div class="tree-controls" aria-label="Controles de zoom Huffman">
          <button type="button" class="tree-control" data-tree-action="zoom-in" aria-label="Acercar árbol Huffman">+</button>
          <button type="button" class="tree-control" data-tree-action="zoom-out" aria-label="Alejar árbol Huffman">-</button>
          <button type="button" class="tree-control reset" data-tree-action="reset" aria-label="Restaurar vista del árbol Huffman">Reset</button>
          <button type="button" class="tree-control expand" data-tree-action="expand" aria-label="Abrir árbol Huffman ampliado">Ampliar</button>
        </div>
      </div>
      <div class="tree-canvas">
        <div class="tree-viewport" data-tree-viewer="huffman">
          <div class="tree-stage">${renderTreeSvg(state.huffman.tree, "huffman")}</div>
        </div>
      </div>
    </div>
    <div class="tree-card">
      <div class="tree-card-header">
        <div>
          <h3>Árbol Shannon-Fano</h3>
          <span>Particiones por probabilidad</span>
        </div>
        <div class="tree-controls" aria-label="Controles de zoom Shannon-Fano">
          <button type="button" class="tree-control" data-tree-action="zoom-in" aria-label="Acercar árbol Shannon-Fano">+</button>
          <button type="button" class="tree-control" data-tree-action="zoom-out" aria-label="Alejar árbol Shannon-Fano">-</button>
          <button type="button" class="tree-control reset" data-tree-action="reset" aria-label="Restaurar vista del árbol Shannon-Fano">Reset</button>
          <button type="button" class="tree-control expand" data-tree-action="expand" aria-label="Abrir árbol Shannon-Fano ampliado">Ampliar</button>
        </div>
      </div>
      <div class="tree-canvas">
        <div class="tree-viewport" data-tree-viewer="shannon">
          <div class="tree-stage">${renderTreeSvg(state.shannon.tree, "shannon")}</div>
        </div>
      </div>
    </div>
  `;
  initTreeViewers();
}

function createTreeViewer(card) {
  const viewport = card.querySelector(".tree-viewport");
  const stage = card.querySelector(".tree-stage");
  const svg = stage.querySelector(".svg-tree");
  const content = stage.querySelector(".svg-tree-content");
  const controls = card.querySelectorAll("[data-tree-action]");
  const viewer = {
    viewport,
    stage,
    scale: 1,
    x: 0,
    y: 0,
    pointers: new Map(),
    isDragging: false,
    lastX: 0,
    lastY: 0,
    pinchStartDistance: 0,
    pinchStartScale: 1,
    svg,
    content
  };

    const applyTransform = () => {
      if (viewer.content && viewer.svg) {
        const rect = viewer.svg.getBoundingClientRect();
        const viewBox = viewer.svg.viewBox.baseVal;
        const unitScale = rect.width > 0 ? viewBox.width / rect.width : 1;
        viewer.content.setAttribute("transform", `translate(${viewer.x * unitScale} ${viewer.y * unitScale}) scale(${viewer.scale})`);
        return;
      }

      viewer.stage.style.transform = `translate(${viewer.x}px, ${viewer.y}px) scale(${viewer.scale})`;
    };

    const clampPan = () => {
      const viewportRect = viewer.viewport.getBoundingClientRect();
      const stageWidth = viewer.stage.offsetWidth * viewer.scale;
      const stageHeight = viewer.stage.offsetHeight * viewer.scale;
      const minX = Math.min(0, viewportRect.width - stageWidth);
      const minY = Math.min(0, viewportRect.height - stageHeight);

      viewer.x = stageWidth <= viewportRect.width ? (viewportRect.width - stageWidth) / 2 : Math.min(0, Math.max(minX, viewer.x));
      viewer.y = stageHeight <= viewportRect.height ? (viewportRect.height - stageHeight) / 2 : Math.min(0, Math.max(minY, viewer.y));
    };

    const setZoom = (nextScale, originX, originY) => {
      const previousScale = viewer.scale;
      const next = Math.min(4, Math.max(1, nextScale));
      if (next === previousScale) return;

      const rect = viewer.viewport.getBoundingClientRect();
      const px = originX - rect.left;
      const py = originY - rect.top;
      const contentX = (px - viewer.x) / previousScale;
      const contentY = (py - viewer.y) / previousScale;

      viewer.scale = next;
      viewer.x = px - contentX * next;
      viewer.y = py - contentY * next;
      clampPan();
      applyTransform();
    };

    const resetView = () => {
      viewer.scale = 1;
      viewer.x = 0;
      viewer.y = 0;
      clampPan();
      applyTransform();
    };

    viewer.clampPan = clampPan;
    viewer.applyTransform = applyTransform;
    viewer.resetView = resetView;

    viewport.addEventListener("wheel", (event) => {
      event.preventDefault();
      const direction = event.deltaY > 0 ? -1 : 1;
      setZoom(viewer.scale * (direction > 0 ? 1.12 : 0.88), event.clientX, event.clientY);
    }, { passive: false });

    viewport.addEventListener("pointerdown", (event) => {
      viewport.setPointerCapture(event.pointerId);
      viewer.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      viewer.isDragging = true;
      viewer.lastX = event.clientX;
      viewer.lastY = event.clientY;
      viewport.classList.add("is-dragging");

      if (viewer.pointers.size === 2) {
        const [first, second] = [...viewer.pointers.values()];
        viewer.pinchStartDistance = Math.hypot(second.x - first.x, second.y - first.y);
        viewer.pinchStartScale = viewer.scale;
      }
    });

    viewport.addEventListener("pointermove", (event) => {
      if (!viewer.pointers.has(event.pointerId)) return;
      viewer.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (viewer.pointers.size === 2) {
        event.preventDefault();
        const [first, second] = [...viewer.pointers.values()];
        const distance = Math.hypot(second.x - first.x, second.y - first.y);
        const centerX = (first.x + second.x) / 2;
        const centerY = (first.y + second.y) / 2;
        if (viewer.pinchStartDistance > 0) {
          setZoom(viewer.pinchStartScale * (distance / viewer.pinchStartDistance), centerX, centerY);
        }
        return;
      }

      const viewportRect = viewer.viewport.getBoundingClientRect();
      const canPan = viewer.stage.offsetWidth * viewer.scale > viewportRect.width || viewer.stage.offsetHeight * viewer.scale > viewportRect.height;
      if (!viewer.isDragging || !canPan) return;
      event.preventDefault();
      viewer.x += event.clientX - viewer.lastX;
      viewer.y += event.clientY - viewer.lastY;
      viewer.lastX = event.clientX;
      viewer.lastY = event.clientY;
      clampPan();
      applyTransform();
    });

    const stopPointer = (event) => {
      viewer.pointers.delete(event.pointerId);
      viewer.isDragging = viewer.pointers.size > 0;
      viewport.classList.toggle("is-dragging", viewer.isDragging);
      if (viewer.pointers.size === 1) {
        const [remaining] = [...viewer.pointers.values()];
        viewer.lastX = remaining.x;
        viewer.lastY = remaining.y;
      }
    };

    viewport.addEventListener("pointerup", stopPointer);
    viewport.addEventListener("pointercancel", stopPointer);

    controls.forEach((button) => {
      button.addEventListener("click", () => {
        const rect = viewer.viewport.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const action = button.dataset.treeAction;

        if (action === "zoom-in") setZoom(viewer.scale * 1.18, centerX, centerY);
        if (action === "zoom-out") setZoom(viewer.scale * 0.84, centerX, centerY);
        if (action === "reset") resetView();
        if (action === "expand") openTreeModal(viewer.viewport.dataset.treeViewer);
      });
    });

    resetView();
    return viewer;
}

function initTreeViewers() {
  state.treeViewers = $$("#treeView .tree-card").map(createTreeViewer);
}

function openTreeModal(algorithm) {
  const isHuffman = algorithm === "huffman";
  const title = isHuffman ? "Árbol Huffman" : "Árbol Shannon-Fano";
  const subtitle = isHuffman ? "Frecuencia acumulada en nodos internos" : "Particiones por probabilidad";
  const tree = isHuffman ? state.huffman.tree : state.shannon.tree;
  const modal = document.createElement("div");

  modal.className = "tree-modal";
  modal.innerHTML = `
    <div class="tree-modal-backdrop" data-tree-close></div>
    <div class="tree-card tree-modal-card" role="dialog" aria-modal="true" aria-label="${title} ampliado">
      <div class="tree-card-header">
        <div>
          <h3>${title}</h3>
          <span>${subtitle}</span>
        </div>
        <div class="tree-controls" aria-label="Controles de zoom ${title}">
          <button type="button" class="tree-control" data-tree-action="zoom-in" aria-label="Acercar ${title}">+</button>
          <button type="button" class="tree-control" data-tree-action="zoom-out" aria-label="Alejar ${title}">-</button>
          <button type="button" class="tree-control reset" data-tree-action="reset" aria-label="Restaurar vista de ${title}">Reset</button>
          <button type="button" class="tree-control expand" data-tree-close aria-label="Cerrar vista ampliada">Cerrar</button>
        </div>
      </div>
      <div class="tree-canvas">
        <div class="tree-viewport modal-tree-viewport" data-tree-viewer="${algorithm}">
          <div class="tree-stage">${renderTreeSvg(tree, algorithm, { largeView: true })}</div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  createTreeViewer(modal.querySelector(".tree-modal-card"));
  modal.querySelectorAll("[data-tree-close]").forEach((element) => {
    element.addEventListener("click", () => modal.remove());
  });
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

function refreshTreeViewersOnResize() {
  state.treeViewers.forEach((viewer) => {
    if (!viewer || !viewer.clampPan || !viewer.applyTransform) return;
    viewer.clampPan();
    viewer.applyTransform();
  });
}

function bindEvents() {
  let resizeTimer = null;

  $$(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      $$(".nav-item").forEach((item) => item.classList.remove("active"));
      $$(".app-section").forEach((section) => section.classList.remove("active"));
      button.classList.add("active");
      $(`#${button.dataset.section}`).classList.add("active");
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

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(refreshTreeViewersOnResize, 120);
  });
}

function init() {
  bindEvents();
  initBitmap();
  $("#sourceText").value = "ingenieria de comunicaciones";
  processText();
}

document.addEventListener("DOMContentLoaded", init);
