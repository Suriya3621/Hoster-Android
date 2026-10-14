import {
  Folder, Film, Video, Clapperboard, Music2, Music, Headphones, Image as ImageIcon, FileImage, FileText, FileType,
  FileCode2, FileJson, FileSpreadsheet, FileArchive, FileCog, FileKey, File as FileGeneric, Presentation,
  Database, Terminal, SquareTerminal, Disc3, Package, Cog, BookOpen, Palette, Braces, Globe, Hash, Binary,
  Layers, Smartphone, Subtitles, Type, Magnet, Cpu, AppWindow, Download, Gamepad2, Code2, Coffee, Gem,
  ScrollText, Archive, Monitor, FileDigit, MonitorPlay, Camera, Mic, Brush, Boxes, Table2, Shapes,
} from 'lucide-react';

/** Literal class names (Tailwind needs to see them whole). */
export const TONES = {
  rose: { text: 'text-rose-400', bg: 'bg-rose-400/15' },
  red: { text: 'text-red-400', bg: 'bg-red-400/15' },
  orange: { text: 'text-orange-400', bg: 'bg-orange-400/15' },
  amber: { text: 'text-amber-400', bg: 'bg-amber-400/15' },
  yellow: { text: 'text-yellow-300', bg: 'bg-yellow-300/15' },
  lime: { text: 'text-lime-400', bg: 'bg-lime-400/15' },
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-400/15' },
  teal: { text: 'text-teal-400', bg: 'bg-teal-400/15' },
  cyan: { text: 'text-cyan-400', bg: 'bg-cyan-400/15' },
  sky: { text: 'text-sky-400', bg: 'bg-sky-400/15' },
  blue: { text: 'text-blue-400', bg: 'bg-blue-400/15' },
  indigo: { text: 'text-indigo-400', bg: 'bg-indigo-400/15' },
  violet: { text: 'text-violet-400', bg: 'bg-violet-400/15' },
  purple: { text: 'text-purple-400', bg: 'bg-purple-400/15' },
  fuchsia: { text: 'text-fuchsia-400', bg: 'bg-fuchsia-400/15' },
  pink: { text: 'text-pink-400', bg: 'bg-pink-400/15' },
  slate: { text: 'text-slate-400', bg: 'bg-slate-400/15' },
  accent: { text: 'text-accent', bg: 'bg-accent-soft' },
};

/** Each entry: the extensions it covers, an icon, a colour tone and a short label. */
const TYPES = [
  // Video — different containers get different looks
  { exts: ['mp4', 'm4v'], icon: Clapperboard, tone: 'rose', label: 'MP4' },
  { exts: ['mkv'], icon: Film, tone: 'fuchsia', label: 'MKV' },
  { exts: ['avi'], icon: Video, tone: 'orange', label: 'AVI' },
  { exts: ['mov'], icon: MonitorPlay, tone: 'sky', label: 'MOV' },
  { exts: ['webm'], icon: Video, tone: 'teal', label: 'WEBM' },
  { exts: ['wmv', 'flv', 'mpg', 'mpeg', '3gp', 'ts', 'm2ts', 'ogv'], icon: Video, tone: 'pink', label: 'VIDEO' },
  // Audio
  { exts: ['mp3'], icon: Music2, tone: 'amber', label: 'MP3' },
  { exts: ['wav'], icon: Headphones, tone: 'lime', label: 'WAV' },
  { exts: ['flac'], icon: Music, tone: 'emerald', label: 'FLAC' },
  { exts: ['aac', 'm4a', 'ogg', 'opus', 'wma', 'aiff'], icon: Music2, tone: 'yellow', label: 'AUDIO' },
  { exts: ['mid', 'midi'], icon: Music, tone: 'violet', label: 'MIDI' },
  { exts: ['m4b'], icon: Mic, tone: 'orange', label: 'BOOK' },
  // Images
  { exts: ['jpg', 'jpeg'], icon: ImageIcon, tone: 'emerald', label: 'JPG' },
  { exts: ['png'], icon: FileImage, tone: 'teal', label: 'PNG' },
  { exts: ['gif'], icon: ImageIcon, tone: 'pink', label: 'GIF' },
  { exts: ['webp', 'avif'], icon: ImageIcon, tone: 'cyan', label: 'WEBP' },
  { exts: ['svg'], icon: Shapes, tone: 'amber', label: 'SVG' },
  { exts: ['heic', 'heif'], icon: Camera, tone: 'sky', label: 'HEIC' },
  { exts: ['raw', 'cr2', 'nef', 'arw', 'dng'], icon: Camera, tone: 'slate', label: 'RAW' },
  { exts: ['bmp', 'tif', 'tiff', 'ico'], icon: ImageIcon, tone: 'lime', label: 'IMG' },
  { exts: ['psd', 'ai', 'xd', 'fig', 'sketch'], icon: Brush, tone: 'indigo', label: 'DESIGN' },
  // Documents
  { exts: ['pdf'], icon: FileType, tone: 'red', label: 'PDF' },
  { exts: ['doc', 'docx', 'odt', 'rtf'], icon: FileText, tone: 'blue', label: 'DOC' },
  { exts: ['xls', 'xlsx', 'ods'], icon: FileSpreadsheet, tone: 'emerald', label: 'XLS' },
  { exts: ['csv', 'tsv'], icon: Table2, tone: 'lime', label: 'CSV' },
  { exts: ['ppt', 'pptx', 'odp', 'key'], icon: Presentation, tone: 'orange', label: 'PPT' },
  { exts: ['epub', 'mobi', 'azw3'], icon: BookOpen, tone: 'amber', label: 'EBOOK' },
  { exts: ['txt', 'log'], icon: ScrollText, tone: 'slate', label: 'TXT' },
  { exts: ['md', 'markdown'], icon: Hash, tone: 'cyan', label: 'MD' },
  // Code
  { exts: ['js', 'mjs', 'cjs'], icon: FileCode2, tone: 'yellow', label: 'JS' },
  { exts: ['jsx', 'tsx'], icon: Code2, tone: 'sky', label: 'REACT' },
  { exts: ['ts'], icon: FileCode2, tone: 'blue', label: 'TS' },
  { exts: ['py', 'pyw', 'ipynb'], icon: FileCode2, tone: 'emerald', label: 'PY' },
  { exts: ['java', 'jar', 'class'], icon: Coffee, tone: 'orange', label: 'JAVA' },
  { exts: ['c', 'h'], icon: FileCode2, tone: 'indigo', label: 'C' },
  { exts: ['cpp', 'cc', 'cxx', 'hpp'], icon: FileCode2, tone: 'violet', label: 'C++' },
  { exts: ['cs'], icon: FileCode2, tone: 'purple', label: 'C#' },
  { exts: ['go'], icon: FileCode2, tone: 'cyan', label: 'GO' },
  { exts: ['rs'], icon: Cog, tone: 'orange', label: 'RUST' },
  { exts: ['php'], icon: FileCode2, tone: 'indigo', label: 'PHP' },
  { exts: ['rb'], icon: Gem, tone: 'red', label: 'RUBY' },
  { exts: ['swift', 'kt', 'dart'], icon: FileCode2, tone: 'rose', label: 'CODE' },
  { exts: ['html', 'htm'], icon: Globe, tone: 'orange', label: 'HTML' },
  { exts: ['css', 'scss', 'sass', 'less'], icon: Palette, tone: 'sky', label: 'CSS' },
  { exts: ['json'], icon: FileJson, tone: 'amber', label: 'JSON' },
  { exts: ['xml', 'yml', 'yaml', 'toml'], icon: Braces, tone: 'teal', label: 'DATA' },
  { exts: ['sh', 'bash', 'zsh', 'bat', 'cmd', 'ps1'], icon: SquareTerminal, tone: 'lime', label: 'SCRIPT' },
  { exts: ['sql'], icon: Database, tone: 'blue', label: 'SQL' },
  { exts: ['db', 'sqlite', 'sqlite3', 'mdb', 'accdb'], icon: Database, tone: 'violet', label: 'DB' },
  { exts: ['ini', 'cfg', 'conf', 'env', 'properties'], icon: FileCog, tone: 'slate', label: 'CONFIG' },
  // Archives & packages
  { exts: ['zip'], icon: FileArchive, tone: 'orange', label: 'ZIP' },
  { exts: ['rar'], icon: Archive, tone: 'purple', label: 'RAR' },
  { exts: ['7z'], icon: FileArchive, tone: 'teal', label: '7Z' },
  { exts: ['tar', 'gz', 'bz2', 'xz', 'tgz', 'zst'], icon: Package, tone: 'amber', label: 'TAR' },
  // Programs & system
  { exts: ['exe'], icon: AppWindow, tone: 'indigo', label: 'EXE' },
  { exts: ['msi', 'msix', 'deb', 'rpm', 'pkg', 'dmg', 'appimage'], icon: Boxes, tone: 'violet', label: 'INSTALL' },
  { exts: ['apk', 'aab', 'ipa'], icon: Smartphone, tone: 'lime', label: 'APP' },
  { exts: ['dll', 'sys', 'so', 'dylib'], icon: Cpu, tone: 'slate', label: 'LIB' },
  { exts: ['iso', 'img', 'vhd', 'vmdk', 'bin'], icon: Disc3, tone: 'fuchsia', label: 'DISC' },
  { exts: ['torrent'], icon: Magnet, tone: 'red', label: 'TORRENT' },
  { exts: ['lnk', 'url'], icon: Layers, tone: 'sky', label: 'LINK' },
  { exts: ['ttf', 'otf', 'woff', 'woff2'], icon: Type, tone: 'pink', label: 'FONT' },
  { exts: ['srt', 'vtt', 'ass', 'sub'], icon: Subtitles, tone: 'yellow', label: 'SUBS' },
  { exts: ['pem', 'crt', 'cer', 'pfx', 'gpg', 'pub'], icon: FileKey, tone: 'amber', label: 'KEY' },
  { exts: ['sav', 'save', 'rom'], icon: Gamepad2, tone: 'purple', label: 'GAME' },
  { exts: ['dat', 'hex'], icon: Binary, tone: 'slate', label: 'DATA' },
];

const BY_EXT = new Map();
for (const t of TYPES) for (const e of t.exts) BY_EXT.set(e, t);

const CATEGORY_FALLBACK = {
  video: { icon: Clapperboard, tone: 'rose', label: 'VIDEO' },
  audio: { icon: Music2, tone: 'amber', label: 'AUDIO' },
  image: { icon: ImageIcon, tone: 'emerald', label: 'IMAGE' },
  pdf: { icon: FileType, tone: 'red', label: 'PDF' },
  document: { icon: FileText, tone: 'blue', label: 'DOC' },
  text: { icon: ScrollText, tone: 'slate', label: 'TEXT' },
  code: { icon: FileCode2, tone: 'violet', label: 'CODE' },
  archive: { icon: FileArchive, tone: 'orange', label: 'ARCHIVE' },
  unknown: { icon: FileGeneric, tone: 'slate', label: 'FILE' },
};

/** Special folders get a small badge on the folder, so "Movies" doesn't look like "Taxes". */
const FOLDER_BADGES = [
  { match: /(movie|film|cinema)/, icon: Film, tone: 'rose' },
  { match: /(anime|series|show|season|tv)/, icon: MonitorPlay, tone: 'fuchsia' },
  { match: /(music|song|audio|album|playlist)/, icon: Music2, tone: 'amber' },
  { match: /(photo|picture|image|camera|screenshot|wallpaper)/, icon: ImageIcon, tone: 'emerald' },
  { match: /(video|clip|recording)/, icon: Video, tone: 'pink' },
  { match: /(document|doc|pdf|book|study|education|notes)/, icon: FileText, tone: 'sky' },
  { match: /(download)/, icon: Download, tone: 'teal' },
  { match: /(dev|code|project|github|repo|source|programming)/, icon: Code2, tone: 'violet' },
  { match: /(game)/, icon: Gamepad2, tone: 'purple' },
  { match: /(desktop)/, icon: Monitor, tone: 'blue' },
  { match: /(backup|archive|old)/, icon: Archive, tone: 'orange' },
  { match: /(software|program|app|tool)/, icon: Package, tone: 'indigo' },
];

export function getFolderBadge(name = '') {
  const n = String(name).toLowerCase();
  const hit = FOLDER_BADGES.find((b) => b.match.test(n));
  return hit ? { Icon: hit.icon, tone: TONES[hit.tone] } : null;
}

/** Resolve how any entry should look. */
export function getFileType({ name = '', extension, category = 'unknown', isDirectory = false } = {}) {
  if (isDirectory || category === 'folder') {
    return { Icon: Folder, tone: TONES.accent, label: 'FOLDER', isFolder: true, badge: getFolderBadge(name) };
  }
  const ext = String(extension || (name.includes('.') ? name.split('.').pop() : '')).toLowerCase();
  const hit = BY_EXT.get(ext) || CATEGORY_FALLBACK[category] || CATEGORY_FALLBACK.unknown;
  const label = hit.label === 'DATA' || hit.label === 'VIDEO' || hit.label === 'AUDIO' || hit.label === 'IMG' || hit.label === 'CODE' || hit.label === 'FILE'
    ? (ext ? ext.toUpperCase().slice(0, 5) : hit.label)
    : hit.label;
  return { Icon: hit.icon, tone: TONES[hit.tone], label, isFolder: false, badge: null };
}

export const TYPE_COUNT = TYPES.length;
// Keep unused imports referenced so tree-shaking keeps future additions easy.
export const _spare = { FileDigit, Terminal };
