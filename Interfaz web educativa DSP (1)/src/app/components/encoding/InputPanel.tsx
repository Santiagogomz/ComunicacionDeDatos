import { Upload } from "lucide-react";

interface InputPanelProps {
  text: string;
  onTextChange: (text: string) => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function InputPanel({ text, onTextChange, onFileUpload }: InputPanelProps) {
  return (
    <div className="bg-gradient-to-br from-[#12121f] to-[#0f0f1a] border border-cyan-900/30 rounded-xl p-5 shadow-xl">
      <h3 className="text-sm text-cyan-400 mb-4 tracking-wider">ENTRADA DE DATOS</h3>

      <textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Ingrese el texto que desea codificar..."
        className="w-full h-48 px-3 py-2 bg-black/30 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 resize-none"
      />

      <div className="flex items-center justify-between mt-3">
        <div className="text-xs text-gray-500">{text.length} caracteres</div>

        <label className="cursor-pointer">
          <input
            type="file"
            accept=".txt"
            onChange={onFileUpload}
            className="hidden"
          />
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-gray-700/50 rounded-lg text-xs text-gray-400 hover:bg-white/10 hover:border-cyan-500/50 transition-all">
            <Upload className="w-3 h-3" />
            Cargar .txt
          </div>
        </label>
      </div>
    </div>
  );
}
