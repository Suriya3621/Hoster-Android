import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, WrapText, Hash, Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../services/api';
import { getExtension } from '../../utils/fileCategory';

const LANG_MAP = {
  js: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  tsx: 'tsx',
  py: 'python',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  sh: 'bash',
  css: 'css',
  html: 'markup',
  xml: 'markup',
  json: 'json',
  yml: 'yaml',
  yaml: 'yaml',
  go: 'go',
  rs: 'rust',
  rb: 'ruby',
  php: 'php',
};

export default function TextViewer({ entry }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [wrap, setWrap] = useState(true);
  const [lineNumbers, setLineNumbers] = useState(true);

  const ext = getExtension(entry.name);
  const isMarkdown = ext === 'md' || ext === 'markdown';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch(api.streamUrl(entry.virtualPath))
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load');
        return res.text();
      })
      .then((text) => {
        if (!cancelled) setContent(text);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [entry.virtualPath]);

  function copyAll() {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted">
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2 text-text-muted text-sm">
        <AlertTriangle className="text-amber-400" size={24} />
        Couldn't load this file.
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-surface-alt">
        <span className="text-xs text-text-muted uppercase">{ext || 'text'}</span>
        <div className="flex items-center gap-1">
          {!isMarkdown && (
            <>
              <button
                className={`btn-ghost p-1.5 ${lineNumbers ? 'text-accent' : ''}`}
                onClick={() => setLineNumbers((v) => !v)}
                title="Toggle line numbers"
              >
                <Hash size={14} />
              </button>
              <button
                className={`btn-ghost p-1.5 ${wrap ? 'text-accent' : ''}`}
                onClick={() => setWrap((v) => !v)}
                title="Toggle word wrap"
              >
                <WrapText size={14} />
              </button>
            </>
          )}
          <button className="btn-ghost p-1.5" onClick={copyAll} title="Copy all">
            <Copy size={14} />
          </button>
        </div>
      </div>

      <div className="max-h-[70vh] overflow-auto text-sm">
        {isMarkdown ? (
          <div className="prose prose-invert max-w-none p-4">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          <SyntaxHighlighter
            language={LANG_MAP[ext] || 'text'}
            style={oneDark}
            showLineNumbers={lineNumbers}
            wrapLongLines={wrap}
            customStyle={{ margin: 0, background: 'transparent', fontSize: '13px' }}
          >
            {content}
          </SyntaxHighlighter>
        )}
      </div>
    </div>
  );
}
