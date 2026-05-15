interface TreeNode {
  char: string | null;
  freq: number;
  left: TreeNode | null;
  right: TreeNode | null;
}

interface HuffmanTreeProps {
  tree: TreeNode;
}

function TreeVisualization({ node, x = 400, y = 40, level = 0, parentX, parentY }: any) {
  if (!node) return null;

  const horizontalSpacing = 400 / Math.pow(2, level);
  const verticalSpacing = 80;

  const leftX = x - horizontalSpacing;
  const leftY = y + verticalSpacing;
  const rightX = x + horizontalSpacing;
  const rightY = y + verticalSpacing;

  return (
    <g>
      {/* Lines to children */}
      {node.left && (
        <>
          <line
            x1={x}
            y1={y}
            x2={leftX}
            y2={leftY}
            stroke="#06b6d4"
            strokeWidth="2"
            opacity="0.3"
          />
          <text
            x={(x + leftX) / 2 - 10}
            y={(y + leftY) / 2}
            fill="#06b6d4"
            fontSize="12"
            fontFamily="monospace"
          >
            0
          </text>
        </>
      )}
      {node.right && (
        <>
          <line
            x1={x}
            y1={y}
            x2={rightX}
            y2={rightY}
            stroke="#8b5cf6"
            strokeWidth="2"
            opacity="0.3"
          />
          <text
            x={(x + rightX) / 2 + 10}
            y={(y + rightY) / 2}
            fill="#8b5cf6"
            fontSize="12"
            fontFamily="monospace"
          >
            1
          </text>
        </>
      )}

      {/* Current node */}
      <circle
        cx={x}
        cy={y}
        r="20"
        fill={node.char ? "#8b5cf6" : "#1a1a2e"}
        stroke={node.char ? "#a78bfa" : "#06b6d4"}
        strokeWidth="2"
      />
      <text
        x={x}
        y={y + 5}
        textAnchor="middle"
        fill="white"
        fontSize="12"
        fontFamily="monospace"
      >
        {node.char || node.freq}
      </text>

      {/* Recursive rendering */}
      {node.left && (
        <TreeVisualization
          node={node.left}
          x={leftX}
          y={leftY}
          level={level + 1}
          parentX={x}
          parentY={y}
        />
      )}
      {node.right && (
        <TreeVisualization
          node={node.right}
          x={rightX}
          y={rightY}
          level={level + 1}
          parentX={x}
          parentY={y}
        />
      )}
    </g>
  );
}

export default function HuffmanTree({ tree }: HuffmanTreeProps) {
  return (
    <div className="bg-gradient-to-br from-[#12121f] to-[#0f0f1a] border border-cyan-900/30 rounded-xl p-5 shadow-xl">
      <h3 className="text-sm text-cyan-400 mb-3 tracking-wider">ÁRBOL DE HUFFMAN</h3>

      <div className="bg-black/20 rounded-lg p-4 overflow-auto">
        <svg width="800" height="400" className="mx-auto">
          <TreeVisualization node={tree} />
        </svg>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border-2 border-cyan-400 rounded-full" />
          <span className="text-gray-400">Nodo interno</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-violet-500 rounded-full" />
          <span className="text-gray-400">Nodo hoja (símbolo)</span>
        </div>
      </div>
    </div>
  );
}
