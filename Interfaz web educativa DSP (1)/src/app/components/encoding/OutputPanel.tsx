import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface OutputPanelProps {
  encoded: string;
  decoded: string;
  originalText: string;
}

export default function OutputPanel({ encoded, decoded, originalText }: OutputPanelProps) {
  const [copiedEncoded, setCopiedEncoded] = useState(false);
  const [copiedDecoded, setCopiedDecoded] = useState(false);

  const handleCopy = async (text: string, type: "encoded" | "decoded") => {
    await navigator.clipboard.writeText(text);
    if (type === "encoded") {
      setCopiedEncoded(true);
      setTimeout(() => setCopiedEncoded(false), 2000);
    } else {
      setCopiedDecoded(true);
      setTimeout(() => setCopiedDecoded(false), 2000);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Encoded Output */}
      <div className="bg-gradient-to-br from-[#12121f] to-[#0f0f1a] border border-cyan-900/30 rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm text-cyan-400 tracking-wider">TEXTO CODIFICADO</h3>
          <button
            onClick={() => handleCopy(encoded, "encoded")}
            className="p-1.5 hover:bg-cyan-500/10 rounded transition-colors"
          >
            {copiedEncoded ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>

        <div className="bg-black/30 rounded-lg p-3 max-h-32 overflow-auto">
          <code className="text-xs text-cyan-300 font-mono break-all leading-relaxed">
            {encoded.slice(0, 500)}
            {encoded.length > 500 && "..."}
          </code>
        </div>

        <div className="mt-2 text-xs text-gray-500">
          {encoded.length} bits ({(encoded.length / 8).toFixed(1)} bytes)
        </div>
      </div>

      {/* Decoded Output */}
      <div className="bg-gradient-to-br from-[#12121f] to-[#0f0f1a] border border-emerald-900/30 rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm text-emerald-400 tracking-wider">TEXTO DECODIFICADO</h3>
          <button
            onClick={() => handleCopy(decoded, "decoded")}
            className="p-1.5 hover:bg-emerald-500/10 rounded transition-colors"
          >
            {copiedDecoded ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>

        <div className="bg-black/30 rounded-lg p-3 max-h-32 overflow-auto">
          <div className="text-xs text-white leading-relaxed">
            {decoded}
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2">
          {decoded === originalText ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-xs text-emerald-400">Decodificación correcta</span>
            </>
          ) : (
            <span className="text-xs text-red-400">Error en decodificación</span>
          )}
        </div>
      </div>
    </div>
  );
}
