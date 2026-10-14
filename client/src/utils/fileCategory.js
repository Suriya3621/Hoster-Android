const EXT_MAP = {
  video: ['mp4', 'webm', 'ogv', 'mkv', 'avi', 'mov', 'flv', 'm4v', 'wmv'],
  audio: ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'wma'],
  image: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'avif', 'svg', 'heic', 'tiff'],
  pdf: ['pdf'],
  document: ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'rtf'],
  text: ['txt', 'md', 'markdown', 'csv', 'log'],
  code: ['js', 'jsx', 'ts', 'tsx', 'json', 'css', 'html', 'xml', 'py', 'java', 'c', 'cpp', 'h', 'sh', 'yml', 'yaml', 'go', 'rs', 'rb', 'php'],
  archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'],
};

const NATIVE_PLAYABLE_VIDEO = ['mp4', 'webm', 'ogv'];
const NATIVE_PLAYABLE_AUDIO = ['mp3', 'wav', 'ogg', 'm4a', 'flac'];

export function getExtension(filename = '') {
  const idx = filename.lastIndexOf('.');
  return idx === -1 ? '' : filename.slice(idx + 1).toLowerCase();
}

export function getFileCategory(entry) {
  if (!entry) return 'unknown';
  if (entry.isDirectory) return 'folder';
  const ext = getExtension(entry.name || entry);
  for (const [category, exts] of Object.entries(EXT_MAP)) {
    if (exts.includes(ext)) return category;
  }
  return 'unknown';
}

export function isNativelyPlayableVideo(filename) {
  return NATIVE_PLAYABLE_VIDEO.includes(getExtension(filename));
}
export function isNativelyPlayableAudio(filename) {
  return NATIVE_PLAYABLE_AUDIO.includes(getExtension(filename));
}
