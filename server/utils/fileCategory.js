const path = require('path');
const mime = require('mime-types');

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

// Formats the HTML5 <video>/<audio> tag can play directly in most browsers.
const NATIVE_PLAYABLE_VIDEO = ['mp4', 'webm', 'ogv'];
const NATIVE_PLAYABLE_AUDIO = ['mp3', 'wav', 'ogg', 'm4a', 'flac'];

function getExtension(filename) {
  return path.extname(filename).slice(1).toLowerCase();
}

function getFileCategory(filenameOrEntry) {
  const filename = typeof filenameOrEntry === 'string' ? filenameOrEntry : filenameOrEntry.name;
  if (typeof filenameOrEntry === 'object' && filenameOrEntry.isDirectory) return 'folder';

  const ext = getExtension(filename);
  for (const [category, exts] of Object.entries(EXT_MAP)) {
    if (exts.includes(ext)) return category;
  }
  return 'unknown';
}

function isNativelyPlayableVideo(filename) {
  return NATIVE_PLAYABLE_VIDEO.includes(getExtension(filename));
}
function isNativelyPlayableAudio(filename) {
  return NATIVE_PLAYABLE_AUDIO.includes(getExtension(filename));
}

function getMimeType(filename) {
  return mime.lookup(filename) || 'application/octet-stream';
}

module.exports = {
  getFileCategory,
  getExtension,
  getMimeType,
  isNativelyPlayableVideo,
  isNativelyPlayableAudio,
};
