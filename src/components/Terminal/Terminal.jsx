import { useEffect, useRef, useState } from 'react';

export default function Terminal({ output, isRunning, onClear }) {
  const terminalRef = useRef(null);
  const [input, setInput] = useState('');

  useEffect(() => {
    // Auto-scroll to bottom when new output arrives
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-green-400 font-mono text-sm">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="ml-2 text-gray-400">Terminal</span>
        </div>
        <button
          onClick={onClear}
          className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-700"
        >
          Clear
        </button>
      </div>

      {/* Terminal Output */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-4 space-y-1"
      >
        {output.length === 0 ? (
          <div className="text-gray-500">
            $ Ready to run your code...
          </div>
        ) : (
          output.map((line, index) => (
            <div key={index} className={line.type === 'error' ? 'text-red-400' : 'text-green-400'}>
              {line.text}
            </div>
          ))
        )}
        {isRunning && (
          <div className="flex items-center space-x-2 text-yellow-400">
            <div className="animate-spin">⟳</div>
            <span>Running...</span>
          </div>
        )}
      </div>

      {/* Terminal Input (optional) */}
      <div className="border-t border-gray-700 p-2 flex items-center space-x-2">
        <span className="text-gray-500">$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter input (if needed)..."
          className="flex-1 bg-transparent outline-none text-green-400 placeholder-gray-600"
          disabled={isRunning}
        />
      </div>
    </div>
  );
}
