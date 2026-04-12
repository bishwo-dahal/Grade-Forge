import type { EditorCodeExamples } from "../../../types/assignment";

interface EditorMockProps {
  // NOTE: Code examples are injected to keep this editor display-only.
  codeExamples: EditorCodeExamples;
  language: string;
}

export function EditorMock({ codeExamples, language }: EditorMockProps) {
  const code = codeExamples[language] || codeExamples.Python || "";
  const lines = code.split('\n');

  return (
    <div className="h-full overflow-auto font-mono text-[13px] leading-relaxed">
      <div className="min-h-full">
        {lines.map((line, index) => (
          <div key={index} className="flex hover:bg-[#2d2d2d] transition-colors">
            {/* Line Numbers */}
            <div className="flex-shrink-0 w-12 text-right pr-4 text-gray-500 select-none bg-[#1e1e1e] sticky left-0">
              {index + 1}
            </div>
            
            {/* Code Line */}
            <div className="flex-1 pr-4">
              <pre className="text-gray-300">
                <code dangerouslySetInnerHTML={{ __html: highlightSyntax(line, language) }} />
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Simple syntax highlighting
function highlightSyntax(line: string, language: string): string {
  const keywords: Record<string, string[]> = {
    Python: ['class', 'def', 'if', 'else', 'return', 'None', 'self', 'pass', 'import', 'from'],
    Java: ['public', 'private', 'class', 'void', 'int', 'if', 'else', 'return', 'null', 'new', 'this'],
  };

  let highlighted = line;
  const langKeywords = keywords[language] || keywords.Python;

  // Highlight keywords
  langKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'g');
    highlighted = highlighted.replace(regex, `<span style="color: #c586c0">${keyword}</span>`);
  });

  // Highlight strings
  highlighted = highlighted.replace(/"([^"]*)"/g, '<span style="color: #ce9178">"$1"</span>');
  highlighted = highlighted.replace(/'([^']*)'/g, '<span style="color: #ce9178">\'$1\'</span>');

  // Highlight comments
  highlighted = highlighted.replace(/(#.*)$/, '<span style="color: #6a9955">$1</span>');
  highlighted = highlighted.replace(/(\/\/.*)$/, '<span style="color: #6a9955">$1</span>');

  // Highlight function names
  highlighted = highlighted.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, '<span style="color: #dcdcaa">$1</span>(');

  return highlighted;
}
