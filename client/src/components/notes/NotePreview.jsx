import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CODE_STYLE = { margin: 0, borderRadius: 12, fontSize: 13, background: '#0f1218' };

/** Toggle the nth "- [ ]" in the source when its checkbox is clicked in the preview. */
function toggleNthTask(body, n) {
  let i = -1;
  return body.replace(/^(\s*[-*+]\s+)\[( |x|X)\]/gm, (m, lead, mark) => {
    i += 1;
    if (i !== n) return m;
    return `${lead}[${mark === ' ' ? 'x' : ' '}]`;
  });
}

function NotePreview({ body, format, language, onBodyChange }) {
  if (format === 'code') {
    return (
      <SyntaxHighlighter language={language && language !== 'text' ? language : 'text'} style={oneDark} customStyle={CODE_STYLE} showLineNumbers wrapLongLines>
        {body || ' '}
      </SyntaxHighlighter>
    );
  }
  if (format === 'text') {
    return <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed">{body}</pre>;
  }

  let taskIndex = -1; // reset every render; inputs render in document order
  return (
    <div className="note-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, ...p }) => <a {...p} target="_blank" rel="noopener noreferrer" />,
          input: ({ node, type, checked }) => {
            if (type !== 'checkbox') return null;
            taskIndex += 1;
            const n = taskIndex;
            return (
              <input
                type="checkbox"
                checked={Boolean(checked)}
                onChange={() => onBodyChange && onBodyChange(toggleNthTask(body, n))}
                className="task-check"
              />
            );
          },
          code: ({ node, inline, className, children, ...p }) => {
            const match = /language-(\w+)/.exec(className || '');
            const text = String(children).replace(/\n$/, '');
            if (!match && !String(children).includes('\n')) return <code className="inline-code" {...p}>{children}</code>;
            return (
              <SyntaxHighlighter language={match ? match[1] : 'text'} style={oneDark} customStyle={CODE_STYLE} wrapLongLines>
                {text}
              </SyntaxHighlighter>
            );
          },
          pre: ({ children }) => <>{children}</>,
          table: ({ node, ...p }) => <div className="overflow-x-auto"><table {...p} /></div>,
        }}
      >
        {body || '*Nothing to preview yet.*'}
      </ReactMarkdown>
    </div>
  );
}

export default memo(NotePreview);
