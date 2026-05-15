import { Activity, Binary } from "lucide-react";

interface SidebarProps {
  activeModule: "adc" | "encoding";
  onModuleChange: (module: "adc" | "encoding") => void;
}

export default function Sidebar({ activeModule, onModuleChange }: SidebarProps) {
  return (
    <aside className="w-64 bg-gradient-to-b from-[#0f0f1a] to-[#0a0a0f] border-r border-cyan-900/30 flex flex-col">
      {/* Logo Area */}
      <div className="p-6 border-b border-cyan-900/30">
        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-violet-600 rounded-xl flex items-center justify-center mb-3 shadow-lg shadow-cyan-500/20">
          <Activity className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-sm text-cyan-400 tracking-wider">SISTEMA DSP</h1>
        <p className="text-xs text-gray-500 mt-1">v2.0.1</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <button
          onClick={() => onModuleChange("adc")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
            activeModule === "adc"
              ? "bg-gradient-to-r from-cyan-600/20 to-violet-600/20 border border-cyan-500/50 shadow-lg shadow-cyan-500/10"
              : "hover:bg-white/5 border border-transparent"
          }`}
        >
          <Activity className={`w-5 h-5 ${activeModule === "adc" ? "text-cyan-400" : "text-gray-400"}`} />
          <div className="flex-1 text-left">
            <div className={`text-sm ${activeModule === "adc" ? "text-cyan-300" : "text-gray-300"}`}>
              Simulador ADC
            </div>
            <div className="text-xs text-gray-500">Conversión analógica</div>
          </div>
        </button>

        <button
          onClick={() => onModuleChange("encoding")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
            activeModule === "encoding"
              ? "bg-gradient-to-r from-cyan-600/20 to-violet-600/20 border border-cyan-500/50 shadow-lg shadow-cyan-500/10"
              : "hover:bg-white/5 border border-transparent"
          }`}
        >
          <Binary className={`w-5 h-5 ${activeModule === "encoding" ? "text-cyan-400" : "text-gray-400"}`} />
          <div className="flex-1 text-left">
            <div className={`text-sm ${activeModule === "encoding" ? "text-cyan-300" : "text-gray-300"}`}>
              Codificación de Datos
            </div>
            <div className="text-xs text-gray-500">Procesamiento digital</div>
          </div>
        </button>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-cyan-900/30">
        <div className="text-xs text-gray-600 text-center">
          Sistema Educativo DSP
          <br />
          <span className="text-cyan-500/50">© 2026</span>
        </div>
      </div>
    </aside>
  );
}
