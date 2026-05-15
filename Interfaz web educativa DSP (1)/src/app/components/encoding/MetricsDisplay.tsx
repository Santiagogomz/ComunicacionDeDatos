import { BarChart2, Zap, Percent, TrendingDown, Clock } from "lucide-react";

interface MetricsDisplayProps {
  result: any;
  compareResult?: any;
  originalText: string;
}

export default function MetricsDisplay({ result, compareResult, originalText }: MetricsDisplayProps) {
  return (
    <div className="flex flex-col gap-4 h-full overflow-auto">
      {/* Main Metrics */}
      <div className="bg-gradient-to-br from-[#12121f] to-[#0f0f1a] border border-cyan-900/30 rounded-xl p-5 shadow-xl">
        <h3 className="text-sm text-cyan-400 mb-4 tracking-wider">MÉTRICAS PRINCIPALES</h3>

        <div className="space-y-3">
          <div className="p-3 bg-white/5 rounded-lg border border-gray-800/50">
            <div className="flex items-center gap-2 mb-1">
              <BarChart2 className="w-3 h-3 text-cyan-400" />
              <span className="text-xs text-gray-400">Tamaño Original</span>
            </div>
            <div className="text-lg text-white">{result.originalBits} bits</div>
            <div className="text-xs text-gray-500">{(result.originalBits / 8).toFixed(0)} bytes</div>
          </div>

          <div className="p-3 bg-white/5 rounded-lg border border-gray-800/50">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-3 h-3 text-violet-400" />
              <span className="text-xs text-gray-400">Tamaño Comprimido</span>
            </div>
            <div className="text-lg text-white">{result.compressedBits} bits</div>
            <div className="text-xs text-gray-500">{(result.compressedBits / 8).toFixed(1)} bytes</div>
          </div>

          <div className="p-3 bg-gradient-to-r from-cyan-600/20 to-violet-600/20 rounded-lg border border-cyan-500/30">
            <div className="flex items-center gap-2 mb-1">
              <Percent className="w-3 h-3 text-cyan-400" />
              <span className="text-xs text-gray-400">Tasa de Compresión</span>
            </div>
            <div className="text-2xl text-cyan-400">{result.compressionRatio}%</div>
          </div>

          <div className="p-3 bg-white/5 rounded-lg border border-gray-800/50">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="text-xs text-gray-400">Eficiencia</span>
            </div>
            <div className="text-lg text-white">{result.efficiency}%</div>
          </div>

          <div className="p-3 bg-white/5 rounded-lg border border-gray-800/50">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span className="text-xs text-gray-400">Tiempo de Procesamiento</span>
            </div>
            <div className="text-lg text-white">{result.processingTime} ms</div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="bg-gradient-to-br from-[#12121f] to-[#0f0f1a] border border-violet-900/30 rounded-xl p-5 shadow-xl">
        <h3 className="text-sm text-violet-400 mb-4 tracking-wider">ESTADÍSTICAS</h3>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between py-2 border-b border-gray-800/30">
            <span className="text-gray-400">Caracteres totales:</span>
            <span className="text-white">{originalText.length}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-800/30">
            <span className="text-gray-400">Símbolos únicos:</span>
            <span className="text-white">{Object.keys(result.codes).length}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-800/30">
            <span className="text-gray-400">Longitud promedio:</span>
            <span className="text-white">{result.avgCodeLength} bits</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-400">Reducción:</span>
            <span className="text-cyan-400">
              {result.originalBits - result.compressedBits} bits
            </span>
          </div>
        </div>
      </div>

      {/* Comparison */}
      {compareResult && (
        <div className="bg-gradient-to-br from-[#12121f] to-[#0f0f1a] border border-amber-900/30 rounded-xl p-5 shadow-xl">
          <h3 className="text-sm text-amber-400 mb-4 tracking-wider">COMPARACIÓN</h3>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-400">Huffman</span>
                <span className="text-cyan-400">{result.compressionRatio}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600"
                  style={{ width: `${result.compressionRatio}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-gray-400">Shannon-Fano</span>
                <span className="text-violet-400">{compareResult.compressionRatio}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-violet-600"
                  style={{ width: `${compareResult.compressionRatio}%` }}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-gray-800/30">
              <div className="text-gray-400 mb-1">Mejor algoritmo:</div>
              <div className="text-white">
                {parseFloat(result.compressionRatio) >= parseFloat(compareResult.compressionRatio)
                  ? "Huffman"
                  : "Shannon-Fano"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
