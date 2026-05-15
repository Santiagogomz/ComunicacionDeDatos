import { useState } from "react";
import { FileText, Upload, Play, Download, GitCompare } from "lucide-react";
import * as Tabs from "@radix-ui/react-tabs";
import InputPanel from "./encoding/InputPanel";
import FrequencyTable from "./encoding/FrequencyTable";
import CodeTable from "./encoding/CodeTable";
import HuffmanTree from "./encoding/HuffmanTree";
import MetricsDisplay from "./encoding/MetricsDisplay";
import OutputPanel from "./encoding/OutputPanel";
import { encodeHuffman, encodeShannonFano } from "../utils/encodingAlgorithms";

type Algorithm = "huffman" | "shannon-fano" | "compare";

export default function DataEncoding() {
  const [inputText, setInputText] = useState("");
  const [algorithm, setAlgorithm] = useState<Algorithm>("huffman");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [compareResult, setCompareResult] = useState<any>(null);

  const handleProcess = () => {
    if (!inputText.trim()) return;

    setIsProcessing(true);
    setTimeout(() => {
      if (algorithm === "huffman") {
        const huffmanResult = encodeHuffman(inputText);
        setResult(huffmanResult);
        setCompareResult(null);
      } else if (algorithm === "shannon-fano") {
        const shannonResult = encodeShannonFano(inputText);
        setResult(shannonResult);
        setCompareResult(null);
      } else {
        const huffmanResult = encodeHuffman(inputText);
        const shannonResult = encodeShannonFano(inputText);
        setResult(huffmanResult);
        setCompareResult(shannonResult);
      }
      setIsProcessing(false);
    }, 500);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setInputText(text);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-[#0a0a0f] via-[#0d0d14] to-[#0a0a0f]">
      {/* Header */}
      <header className="p-6 border-b border-cyan-900/30 bg-gradient-to-r from-[#0f0f1a]/50 to-transparent backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl tracking-tight bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              Codificación y Compresión de Datos
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Algoritmos de compresión sin pérdida - Huffman y Shannon-Fano
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs text-emerald-400">SISTEMA ACTIVO</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        {/* Left Panel - Input */}
        <div className="w-96 flex flex-col gap-4">
          <div className="bg-gradient-to-br from-[#12121f] to-[#0f0f1a] border border-cyan-900/30 rounded-xl p-5 shadow-xl">
            <h3 className="text-sm text-cyan-400 mb-4 tracking-wider">ENTRADA DE DATOS</h3>

            {/* Algorithm Selection */}
            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-2 block">Algoritmo</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { value: "huffman", label: "Huffman", icon: FileText },
                  { value: "shannon-fano", label: "Shannon-Fano", icon: FileText },
                  { value: "compare", label: "Comparar Ambos", icon: GitCompare }
                ].map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setAlgorithm(option.value as Algorithm)}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg transition-all ${
                        algorithm === option.value
                          ? "bg-cyan-600/30 border border-cyan-500/50 text-cyan-300"
                          : "bg-white/5 border border-gray-700/50 text-gray-400 hover:bg-white/10"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Text Input */}
            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-2 block">Texto a Codificar</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ingrese el texto que desea codificar..."
                className="w-full h-32 px-3 py-2 bg-black/30 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 resize-none"
              />
              <div className="text-xs text-gray-500 mt-1">
                {inputText.length} caracteres
              </div>
            </div>

            {/* File Upload */}
            <div className="mb-4">
              <label className="cursor-pointer block">
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-gray-700/50 rounded-lg text-sm text-gray-400 hover:bg-white/10 hover:border-cyan-500/50 transition-all">
                  <Upload className="w-4 h-4" />
                  Cargar Archivo .txt
                </div>
              </label>
            </div>

            {/* Process Button */}
            <button
              onClick={handleProcess}
              disabled={!inputText.trim() || isProcessing}
              className="w-full py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              <span className="text-sm">
                {isProcessing ? "Procesando..." : "Procesar"}
              </span>
            </button>
          </div>

          {/* Quick Stats */}
          {result && (
            <div className="bg-gradient-to-br from-[#12121f] to-[#0f0f1a] border border-cyan-900/30 rounded-xl p-5 shadow-xl">
              <h3 className="text-sm text-cyan-400 mb-3 tracking-wider">RESUMEN</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Símbolos únicos:</span>
                  <span className="text-white">{Object.keys(result.codes).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Compresión:</span>
                  <span className="text-cyan-400">{result.compressionRatio}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Center Panel - Visualization */}
        <div className="flex-1 flex flex-col gap-4 overflow-auto">
          {!result ? (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-[#12121f] to-[#0f0f1a] border border-cyan-900/30 rounded-xl">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-violet-600/20 border border-cyan-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-10 h-10 text-cyan-400" />
                </div>
                <p className="text-gray-400 text-sm">Ingrese texto y presione "Procesar"</p>
                <p className="text-gray-600 text-xs mt-1">para visualizar el proceso de codificación</p>
              </div>
            </div>
          ) : (
            <Tabs.Root defaultValue="huffman" className="flex-1 flex flex-col">
              <Tabs.List className="flex gap-2 mb-4">
                <Tabs.Trigger
                  value="huffman"
                  className="px-4 py-2 text-sm rounded-lg transition-all data-[state=active]:bg-cyan-600/30 data-[state=active]:border data-[state=active]:border-cyan-500/50 data-[state=active]:text-cyan-300 data-[state=inactive]:bg-white/5 data-[state=inactive]:text-gray-400"
                >
                  Huffman
                </Tabs.Trigger>
                {compareResult && (
                  <Tabs.Trigger
                    value="shannon"
                    className="px-4 py-2 text-sm rounded-lg transition-all data-[state=active]:bg-violet-600/30 data-[state=active]:border data-[state=active]:border-violet-500/50 data-[state=active]:text-violet-300 data-[state=inactive]:bg-white/5 data-[state=inactive]:text-gray-400"
                  >
                    Shannon-Fano
                  </Tabs.Trigger>
                )}
              </Tabs.List>

              <Tabs.Content value="huffman" className="flex-1 flex flex-col gap-4 overflow-auto">
                <div className="grid grid-cols-2 gap-4">
                  <FrequencyTable frequencies={result.frequencies} />
                  <CodeTable codes={result.codes} algorithm="Huffman" />
                </div>
                <HuffmanTree tree={result.tree} />
                <OutputPanel
                  encoded={result.encoded}
                  decoded={result.decoded}
                  originalText={inputText}
                />
              </Tabs.Content>

              {compareResult && (
                <Tabs.Content value="shannon" className="flex-1 flex flex-col gap-4 overflow-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <FrequencyTable frequencies={compareResult.frequencies} />
                    <CodeTable codes={compareResult.codes} algorithm="Shannon-Fano" />
                  </div>
                  <OutputPanel
                    encoded={compareResult.encoded}
                    decoded={compareResult.decoded}
                    originalText={inputText}
                  />
                </Tabs.Content>
              )}
            </Tabs.Root>
          )}
        </div>

        {/* Right Panel - Metrics */}
        <div className="w-80">
          {result && (
            <MetricsDisplay
              result={result}
              compareResult={compareResult}
              originalText={inputText}
            />
          )}
        </div>
      </div>
    </div>
  );
}
