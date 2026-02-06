import { useState } from "react";
import { Terminal, Trash2 } from "lucide-react";

interface ConsoleDrawerProps {
  output: string;
  lastRunTime: string | null;
  language?: string;
  cursorPosition?: { line: number; col: number };
}

export function ConsoleDrawer({ output, lastRunTime, language = "Python", cursorPosition = { line: 1, col: 1 } }: ConsoleDrawerProps) {
  const [activeTab, setActiveTab] = useState<'output' | 'errors'>('output');

  // Count errors in output
  const errorCount = (output.match(/FAILED|Error/gi) || []).length;

  const handleClear = () => {
    // This would clear the console - parent component would handle this
  };

  return (
    <div className="flex-shrink-0 bg-[#1e1e1e] border-t border-[#2d2d2d] flex flex-col h-full">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between px-4 bg-[#1e1e1e] border-b border-[#2d2d2d]">
        <div className="flex items-center">
          {/* Console Output Tab */}
          <button
            onClick={() => setActiveTab('output')}
            className={`relative px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider transition-colors ${
              activeTab === 'output'
                ? 'text-[#4a9eff]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            CONSOLE OUTPUT
            {activeTab === 'output' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4a9eff]"></div>
            )}
          </button>
          
          {/* Errors Tab */}
          <button
            onClick={() => setActiveTab('errors')}
            className={`relative px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider transition-colors ${
              activeTab === 'errors'
                ? 'text-[#4a9eff]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            ERRORS
            {errorCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-[#2d2d2d] text-gray-400 rounded text-[10px]">
                {errorCount}
              </span>
            )}
            {activeTab === 'errors' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4a9eff]"></div>
            )}
          </button>
        </div>

        {/* Clear Button */}
        {/* Accessibility: icon-only action needs a label for assistive tech. */}
        <button
          onClick={handleClear}
          aria-label="Clear console output"
          className="p-1.5 hover:bg-[#2d2d2d] rounded transition-colors"
          title="Clear console"
        >
          <Trash2 className="w-4 h-4 text-gray-500 hover:text-gray-300" strokeWidth={2} />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto relative">
        {activeTab === 'output' && (
          <>
            {output ? (
              <pre className="p-4 text-[12px] font-mono text-gray-300 leading-relaxed whitespace-pre-wrap">
                {output}
              </pre>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                <div className="w-12 h-12 rounded-lg bg-[#2d2d2d] flex items-center justify-center mb-3">
                  <Terminal className="w-6 h-6 text-[#8B7355]" strokeWidth={2} />
                </div>
                <p className="text-[12px] font-medium uppercase tracking-wider">
                  READY TO RUN TESTS
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === 'errors' && (
          <div className="p-4">
            {errorCount > 0 ? (
              <pre className="text-[12px] font-mono text-red-400 leading-relaxed whitespace-pre-wrap">
                {output.split('\n').filter(line => 
                  line.includes('FAILED') || line.includes('Error') || line.includes('Expected') || line.includes('Got')
                ).join('\n')}
              </pre>
            ) : (
              <div className="text-[12px] text-gray-500">
                No errors
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-end gap-4 px-4 py-1.5 bg-[#252526] border-t border-[#2d2d2d] text-[11px] text-gray-500">
        <span>LINE {cursorPosition.line}, COL {cursorPosition.col}</span>
        <span>UTF-8</span>
        <span className="uppercase">{language} 3.10</span>
      </div>
    </div>
  );
}
