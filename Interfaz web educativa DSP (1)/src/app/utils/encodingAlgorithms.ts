// Huffman Encoding Algorithm
class HuffmanNode {
  char: string | null;
  freq: number;
  left: HuffmanNode | null;
  right: HuffmanNode | null;

  constructor(char: string | null, freq: number) {
    this.char = char;
    this.freq = freq;
    this.left = null;
    this.right = null;
  }
}

function buildFrequencyTable(text: string): Record<string, number> {
  const freq: Record<string, number> = {};
  for (const char of text) {
    freq[char] = (freq[char] || 0) + 1;
  }
  return freq;
}

function buildHuffmanTree(frequencies: Record<string, number>): HuffmanNode {
  const nodes = Object.entries(frequencies).map(
    ([char, freq]) => new HuffmanNode(char, freq)
  );

  while (nodes.length > 1) {
    nodes.sort((a, b) => a.freq - b.freq);

    const left = nodes.shift()!;
    const right = nodes.shift()!;

    const parent = new HuffmanNode(null, left.freq + right.freq);
    parent.left = left;
    parent.right = right;

    nodes.push(parent);
  }

  return nodes[0];
}

function generateHuffmanCodes(
  node: HuffmanNode | null,
  code: string = "",
  codes: Record<string, string> = {}
): Record<string, string> {
  if (!node) return codes;

  if (node.char !== null) {
    codes[node.char] = code || "0";
    return codes;
  }

  generateHuffmanCodes(node.left, code + "0", codes);
  generateHuffmanCodes(node.right, code + "1", codes);

  return codes;
}

export function encodeHuffman(text: string) {
  const startTime = performance.now();

  const frequencies = buildFrequencyTable(text);
  const tree = buildHuffmanTree(frequencies);
  const codes = generateHuffmanCodes(tree);

  let encoded = "";
  for (const char of text) {
    encoded += codes[char];
  }

  // Decode to verify
  let decoded = "";
  let current = tree;
  for (const bit of encoded) {
    current = bit === "0" ? current.left! : current.right!;
    if (current.char !== null) {
      decoded += current.char;
      current = tree;
    }
  }

  const endTime = performance.now();
  const processingTime = (endTime - startTime).toFixed(2);

  const originalBits = text.length * 8;
  const compressedBits = encoded.length;
  const compressionRatio = (((originalBits - compressedBits) / originalBits) * 100).toFixed(2);

  // Calculate average code length
  let avgLength = 0;
  for (const [char, code] of Object.entries(codes)) {
    avgLength += code.length * (frequencies[char] / text.length);
  }

  return {
    frequencies,
    codes,
    tree,
    encoded,
    decoded,
    originalBits,
    compressedBits,
    compressionRatio,
    processingTime,
    avgCodeLength: avgLength.toFixed(2),
    efficiency: ((text.length / compressedBits) * 100).toFixed(2)
  };
}

// Shannon-Fano Encoding Algorithm
function shannonFanoRecursive(
  symbols: [string, number][],
  codes: Record<string, string>,
  prefix: string = ""
) {
  if (symbols.length === 1) {
    codes[symbols[0][0]] = prefix || "0";
    return;
  }

  if (symbols.length === 2) {
    codes[symbols[0][0]] = prefix + "0";
    codes[symbols[1][0]] = prefix + "1";
    return;
  }

  // Split symbols into two groups with similar frequencies
  const totalFreq = symbols.reduce((sum, [_, freq]) => sum + freq, 0);
  let leftFreq = 0;
  let splitIndex = 0;

  for (let i = 0; i < symbols.length - 1; i++) {
    leftFreq += symbols[i][1];
    if (Math.abs(leftFreq - (totalFreq - leftFreq)) <= Math.abs(leftFreq + symbols[i + 1][1] - (totalFreq - leftFreq - symbols[i + 1][1]))) {
      splitIndex = i + 1;
      break;
    }
  }

  const left = symbols.slice(0, splitIndex);
  const right = symbols.slice(splitIndex);

  shannonFanoRecursive(left, codes, prefix + "0");
  shannonFanoRecursive(right, codes, prefix + "1");
}

export function encodeShannonFano(text: string) {
  const startTime = performance.now();

  const frequencies = buildFrequencyTable(text);
  const symbols = Object.entries(frequencies).sort((a, b) => b[1] - a[1]);

  const codes: Record<string, string> = {};
  shannonFanoRecursive(symbols, codes);

  let encoded = "";
  for (const char of text) {
    encoded += codes[char];
  }

  // Decode
  let decoded = "";
  let currentCode = "";
  for (const bit of encoded) {
    currentCode += bit;
    for (const [char, code] of Object.entries(codes)) {
      if (code === currentCode) {
        decoded += char;
        currentCode = "";
        break;
      }
    }
  }

  const endTime = performance.now();
  const processingTime = (endTime - startTime).toFixed(2);

  const originalBits = text.length * 8;
  const compressedBits = encoded.length;
  const compressionRatio = (((originalBits - compressedBits) / originalBits) * 100).toFixed(2);

  let avgLength = 0;
  for (const [char, code] of Object.entries(codes)) {
    avgLength += code.length * (frequencies[char] / text.length);
  }

  return {
    frequencies,
    codes,
    encoded,
    decoded,
    originalBits,
    compressedBits,
    compressionRatio,
    processingTime,
    avgCodeLength: avgLength.toFixed(2),
    efficiency: ((text.length / compressedBits) * 100).toFixed(2)
  };
}
