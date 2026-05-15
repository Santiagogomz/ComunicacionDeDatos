interface FrequencyTableProps {
  frequencies: Record<string, number>;
}

export default function FrequencyTable({ frequencies }: FrequencyTableProps) {
  const total = Object.values(frequencies).reduce((sum, freq) => sum + freq, 0);
  const sortedEntries = Object.entries(frequencies).sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-gradient-to-br from-[#12121f] to-[#0f0f1a] border border-cyan-900/30 rounded-xl p-5 shadow-xl">
      <h3 className="text-sm text-cyan-400 mb-3 tracking-wider">TABLA DE FRECUENCIAS</h3>

      <div className="max-h-64 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[#12121f] border-b border-cyan-900/30">
            <tr>
              <th className="text-left py-2 text-gray-400">Símbolo</th>
              <th className="text-right py-2 text-gray-400">Frecuencia</th>
              <th className="text-right py-2 text-gray-400">%</th>
            </tr>
          </thead>
          <tbody>
            {sortedEntries.map(([char, freq]) => (
              <tr key={char} className="border-b border-gray-800/30 hover:bg-cyan-500/5">
                <td className="py-2 text-cyan-300 font-mono">
                  {char === " " ? "⎵" : char === "\n" ? "↵" : char}
                </td>
                <td className="text-right text-white">{freq}</td>
                <td className="text-right text-gray-400">
                  {((freq / total) * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
