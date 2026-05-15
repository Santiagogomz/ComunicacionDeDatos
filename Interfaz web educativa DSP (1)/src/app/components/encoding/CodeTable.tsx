interface CodeTableProps {
  codes: Record<string, string>;
  algorithm: string;
}

export default function CodeTable({ codes, algorithm }: CodeTableProps) {
  const sortedEntries = Object.entries(codes).sort((a, b) => a[1].length - b[1].length);

  return (
    <div className="bg-gradient-to-br from-[#12121f] to-[#0f0f1a] border border-violet-900/30 rounded-xl p-5 shadow-xl">
      <h3 className="text-sm text-violet-400 mb-3 tracking-wider">
        CÓDIGOS {algorithm.toUpperCase()}
      </h3>

      <div className="max-h-64 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[#12121f] border-b border-violet-900/30">
            <tr>
              <th className="text-left py-2 text-gray-400">Símbolo</th>
              <th className="text-left py-2 text-gray-400">Código</th>
              <th className="text-right py-2 text-gray-400">Bits</th>
            </tr>
          </thead>
          <tbody>
            {sortedEntries.map(([char, code]) => (
              <tr key={char} className="border-b border-gray-800/30 hover:bg-violet-500/5">
                <td className="py-2 text-violet-300 font-mono">
                  {char === " " ? "⎵" : char === "\n" ? "↵" : char}
                </td>
                <td className="text-left text-cyan-400 font-mono">{code}</td>
                <td className="text-right text-gray-400">{code.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
