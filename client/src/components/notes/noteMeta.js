/** Note colours — literal class names so Tailwind can see them. */
export const NOTE_COLORS = {
  none: { label: 'None', dot: 'bg-slate-500', bar: 'bg-transparent', glow: 'from-transparent', chip: 'text-text-muted' },
  rose: { label: 'Rose', dot: 'bg-rose-400', bar: 'bg-rose-400', glow: 'from-rose-400/15', chip: 'text-rose-400' },
  amber: { label: 'Amber', dot: 'bg-amber-400', bar: 'bg-amber-400', glow: 'from-amber-400/15', chip: 'text-amber-400' },
  emerald: { label: 'Green', dot: 'bg-emerald-400', bar: 'bg-emerald-400', glow: 'from-emerald-400/15', chip: 'text-emerald-400' },
  sky: { label: 'Blue', dot: 'bg-sky-400', bar: 'bg-sky-400', glow: 'from-sky-400/15', chip: 'text-sky-400' },
  violet: { label: 'Violet', dot: 'bg-violet-400', bar: 'bg-violet-400', glow: 'from-violet-400/15', chip: 'text-violet-400' },
  slate: { label: 'Slate', dot: 'bg-slate-400', bar: 'bg-slate-400', glow: 'from-slate-400/15', chip: 'text-slate-400' },
};

export const FORMATS = [
  { id: 'markdown', label: 'Markdown', short: 'MD' },
  { id: 'text', label: 'Plain text', short: 'TXT' },
  { id: 'code', label: 'Code', short: 'CODE' },
];

export const LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'csharp', 'go', 'rust', 'php', 'ruby',
  'html', 'css', 'json', 'bash', 'sql', 'yaml', 'markdown', 'text',
];

export const TEMPLATES = [
  { id: 'blank', label: 'Blank note', hint: 'Start writing', note: { format: 'markdown', title: '', body: '' } },
  {
    id: 'checklist', label: 'Checklist', hint: 'Tick things off', note: {
      format: 'markdown', title: 'To-do', color: 'emerald',
      body: '- [ ] First thing\n- [ ] Second thing\n- [ ] Third thing\n',
    },
  },
  {
    id: 'code', label: 'Code snippet', hint: 'Syntax highlighted', note: {
      format: 'code', language: 'javascript', title: 'Snippet', color: 'violet', body: '// paste your code here\n',
    },
  },
  {
    id: 'meeting', label: 'Study / meeting notes', hint: 'Structured outline', note: {
      format: 'markdown', title: 'Notes', color: 'sky',
      body: '## Topic\n\n**Date:** \n\n### Key points\n- \n\n### Formulas / details\n\n> Important idea here\n\n### Questions\n- [ ] \n',
    },
  },
];

/** Plain-text preview of a note body (strips common Markdown symbols). */
export function plainPreview(body = '', max = 140) {
  return body
    .replace(/```[\s\S]*?```/g, ' [code] ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+\[[ xX]\]\s+/gm, '☐ ')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/[*_`>~]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export function countWords(body = '') {
  const trimmed = body.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}
