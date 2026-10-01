import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import c from 'react-syntax-highlighter/dist/esm/languages/prism/c';
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp';
import csharp from 'react-syntax-highlighter/dist/esm/languages/prism/csharp';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import markup from 'react-syntax-highlighter/dist/esm/languages/prism/markup';
import php from 'react-syntax-highlighter/dist/esm/languages/prism/php';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Registro explícito: solo empaquetamos los lenguajes del ciclo (bundle más ligero)
Object.entries({ bash, c, cpp, csharp, css, java, javascript, json, markup, php, python, sql, typescript, yaml }).forEach(
  ([name, lang]) => SyntaxHighlighter.registerLanguage(name, lang),
);

const customStyle = {
  margin: 0,
  padding: '1rem 1.25rem',
  background: 'transparent',
  fontSize: '0.875rem',
  lineHeight: 1.6,
};

export default function CodeBlock({ code, language = 'text', maxHeight = '28rem', showLineNumbers = true }) {
  return (
    <div className="scroll-thin overflow-auto bg-[#1e222a]" style={{ maxHeight }}>
      <SyntaxHighlighter
        language={language === 'text' ? undefined : language}
        style={oneDark}
        customStyle={customStyle}
        codeTagProps={{ style: { fontFamily: '"JetBrains Mono", ui-monospace, monospace' } }}
        showLineNumbers={showLineNumbers && code.split('\n').length > 1}
        lineNumberStyle={{ color: '#4b5263', minWidth: '2.25em' }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
