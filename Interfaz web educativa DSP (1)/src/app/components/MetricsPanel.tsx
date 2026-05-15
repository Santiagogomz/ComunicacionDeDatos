import { AlertTriangle, CheckCircle2, Activity, Zap, Hash, Layers } from "lucide-react";

interface MetricsPanelProps {
  frequency: number;
  nyquistFrequency: number;
  samplingRate: number;
  bits: number;
  sampleCount: number;
  hasAliasing: boolean;
}

export default function MetricsPanel({
  frequency,
  nyquistFrequency,
  samplingRate,
  bits,
  sampleCount,
  hasAliasing
}: MetricsPanelProps) {
  const quantizationLevels = Math.pow(2, bits);

  return (
    <div className="bg-gradient-to-br from-[#12121f] to-[#0f0f1a] border border-cyan-900/30 rounded-xl p-5 shadow-xl">
      <h3 className="text-sm text-cyan-400 mb-4 tracking-wider">MÉTRICAS DEL SISTEMA</h3>

      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-gray-800/50">
          <Activity className="w-4 h-4 text-cyan-400" />
          <div className="flex-1">
            <div className="text-xs text-gray-400">Frecuencia</div>
            <div className="text-sm text-white">{frequency} Hz</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-gray-800/50">
          <Zap className="w-4 h-4 text-violet-400" />
          <div className="flex-1">
            <div className="text-xs text-gray-400">Frec. de Nyquist</div>
            <div className="text-sm text-white">{nyquistFrequency} Hz</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-gray-800/50">
          <Hash className="w-4 h-4 text-amber-400" />
          <div className="flex-1">
            <div className="text-xs text-gray-400">Muestras</div>
            <div className="text-sm text-white">{sampleCount}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-gray-800/50">
          <Layers className="w-4 h-4 text-pink-400" />
          <div className="flex-1">
            <div className="text-xs text-gray-400">Niveles de Cuantización</div>
            <div className="text-sm text-white">{quantizationLevels}</div>
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="mt-4 pt-4 border-t border-gray-800/50">
        <div className="text-xs text-gray-400 mb-2">ESTADO</div>
        {hasAliasing ? (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <div>
              <div className="text-xs text-red-400">Aliasing Detectado</div>
              <div className="text-xs text-red-300/60 mt-1">
                Aumentar frecuencia de muestreo
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div>
              <div className="text-xs text-emerald-400">Muestreo Correcto</div>
              <div className="text-xs text-emerald-300/60 mt-1">
                Cumple teorema de Nyquist
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
