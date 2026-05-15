import { useState, useMemo } from "react";
import { Play, AlertTriangle, CheckCircle2 } from "lucide-react";
import * as Slider from "@radix-ui/react-slider";
import * as Select from "@radix-ui/react-select";
import SignalChart from "./SignalChart";
import DigitalChart from "./DigitalChart";
import MetricsPanel from "./MetricsPanel";

type SignalType = "sine" | "square" | "noise";

export default function ADCSimulator() {
  const [signalType, setSignalType] = useState<SignalType>("sine");
  const [frequency, setFrequency] = useState(5);
  const [amplitude, setAmplitude] = useState(1);
  const [samplingRate, setSamplingRate] = useState(50);
  const [bits, setBits] = useState(8);
  const [isSimulating, setIsSimulating] = useState(false);

  // Calculate signal data
  const signalData = useMemo(() => {
    const points = 200;
    const data = [];

    for (let i = 0; i < points; i++) {
      const t = (i / points) * 2;
      let value = 0;

      if (signalType === "sine") {
        value = amplitude * Math.sin(2 * Math.PI * frequency * t);
      } else if (signalType === "square") {
        value = amplitude * Math.sign(Math.sin(2 * Math.PI * frequency * t));
      } else {
        value = amplitude * (Math.random() * 2 - 1);
      }

      data.push({ t, value });
    }

    return data;
  }, [signalType, frequency, amplitude]);

  // Calculate sampled data
  const sampledData = useMemo(() => {
    const samples = [];
    const sampleInterval = Math.floor(200 / samplingRate);

    for (let i = 0; i < signalData.length; i += sampleInterval) {
      const point = signalData[i];
      const levels = Math.pow(2, bits);
      const quantized = Math.round((point.value / (2 * amplitude) + 0.5) * (levels - 1)) / (levels - 1) * 2 * amplitude - amplitude;

      samples.push({ t: point.t, value: quantized });
    }

    return samples;
  }, [signalData, samplingRate, bits, amplitude]);

  const nyquistFrequency = samplingRate / 2;
  const hasAliasing = frequency > nyquistFrequency;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-[#0a0a0f] via-[#0d0d14] to-[#0a0a0f]">
      {/* Header */}
      <header className="p-6 border-b border-cyan-900/30 bg-gradient-to-r from-[#0f0f1a]/50 to-transparent backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl tracking-tight bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              Simulador de Conversión de Señales
            </h1>
            <p className="text-sm text-gray-500 mt-1">Sistema de conversión analógico-digital en tiempo real</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs text-emerald-400">SISTEMA ACTIVO</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        {/* Left Panel - Configuration */}
        <div className="w-80 flex flex-col gap-4 overflow-auto">
          <div className="bg-gradient-to-br from-[#12121f] to-[#0f0f1a] border border-cyan-900/30 rounded-xl p-5 shadow-xl">
            <h3 className="text-sm text-cyan-400 mb-4 tracking-wider">CONFIGURACIÓN DE SEÑAL</h3>

            {/* Signal Type */}
            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-2 block">Tipo de Señal</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "sine", label: "Sinusoidal" },
                  { value: "square", label: "Cuadrada" },
                  { value: "noise", label: "Ruido" }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSignalType(option.value as SignalType)}
                    className={`px-3 py-2 text-xs rounded-lg transition-all ${
                      signalType === option.value
                        ? "bg-cyan-600/30 border border-cyan-500/50 text-cyan-300"
                        : "bg-white/5 border border-gray-700/50 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Frequency */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs text-gray-400">Frecuencia (Hz)</label>
                <span className="text-xs text-cyan-400">{frequency} Hz</span>
              </div>
              <Slider.Root
                className="relative flex items-center w-full h-5"
                value={[frequency]}
                onValueChange={(value) => setFrequency(value[0])}
                max={50}
                min={1}
                step={1}
              >
                <Slider.Track className="bg-gray-800 relative grow rounded-full h-1">
                  <Slider.Range className="absolute bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full h-full" />
                </Slider.Track>
                <Slider.Thumb className="block w-4 h-4 bg-cyan-400 shadow-lg shadow-cyan-500/50 rounded-full hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400" />
              </Slider.Root>
            </div>

            {/* Amplitude */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs text-gray-400">Amplitud</label>
                <span className="text-xs text-cyan-400">{amplitude.toFixed(1)}V</span>
              </div>
              <Slider.Root
                className="relative flex items-center w-full h-5"
                value={[amplitude]}
                onValueChange={(value) => setAmplitude(value[0])}
                max={2}
                min={0.1}
                step={0.1}
              >
                <Slider.Track className="bg-gray-800 relative grow rounded-full h-1">
                  <Slider.Range className="absolute bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full h-full" />
                </Slider.Track>
                <Slider.Thumb className="block w-4 h-4 bg-cyan-400 shadow-lg shadow-cyan-500/50 rounded-full hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400" />
              </Slider.Root>
            </div>

            {/* Sampling Rate */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs text-gray-400">Frecuencia de Muestreo (Hz)</label>
                <span className="text-xs text-cyan-400">{samplingRate} Hz</span>
              </div>
              <Slider.Root
                className="relative flex items-center w-full h-5"
                value={[samplingRate]}
                onValueChange={(value) => setSamplingRate(value[0])}
                max={100}
                min={10}
                step={5}
              >
                <Slider.Track className="bg-gray-800 relative grow rounded-full h-1">
                  <Slider.Range className="absolute bg-gradient-to-r from-cyan-500 to-violet-500 rounded-full h-full" />
                </Slider.Track>
                <Slider.Thumb className="block w-4 h-4 bg-cyan-400 shadow-lg shadow-cyan-500/50 rounded-full hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400" />
              </Slider.Root>
            </div>

            {/* Quantization Bits */}
            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-2 block">Bits de Cuantización</label>
              <div className="grid grid-cols-3 gap-2">
                {[8, 16, 24].map((bit) => (
                  <button
                    key={bit}
                    onClick={() => setBits(bit)}
                    className={`px-3 py-2 text-xs rounded-lg transition-all ${
                      bits === bit
                        ? "bg-violet-600/30 border border-violet-500/50 text-violet-300"
                        : "bg-white/5 border border-gray-700/50 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    {bit} bits
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg ${
                isSimulating
                  ? "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 shadow-red-500/30"
                  : "bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 shadow-cyan-500/30"
              }`}
            >
              <Play className="w-4 h-4" />
              <span className="text-sm">{isSimulating ? "Detener Simulación" : "Iniciar Simulación"}</span>
            </button>
          </div>

          {/* Metrics Panel */}
          <MetricsPanel
            frequency={frequency}
            nyquistFrequency={nyquistFrequency}
            samplingRate={samplingRate}
            bits={bits}
            sampleCount={sampledData.length}
            hasAliasing={hasAliasing}
          />
        </div>

        {/* Center Panel - Charts */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <div className="flex-1 bg-gradient-to-br from-[#12121f] to-[#0f0f1a] border border-cyan-900/30 rounded-xl p-5 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm text-cyan-400 tracking-wider">SEÑAL ANALÓGICA</h3>
              <div className="text-xs text-gray-500">Original</div>
            </div>
            <SignalChart data={signalData} sampledData={sampledData} isSimulating={isSimulating} />
          </div>

          <div className="flex-1 bg-gradient-to-br from-[#12121f] to-[#0f0f1a] border border-cyan-900/30 rounded-xl p-5 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm text-violet-400 tracking-wider">SEÑAL DIGITALIZADA</h3>
              <div className="text-xs text-gray-500">Cuantizada {bits} bits</div>
            </div>
            <DigitalChart data={sampledData} isSimulating={isSimulating} />
          </div>
        </div>
      </div>
    </div>
  );
}
