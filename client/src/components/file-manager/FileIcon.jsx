import { memo } from 'react';
import { getFileType } from '../../utils/fileTypes';

/**
 * One icon for every kind of entry.
 *
 *  <FileIcon entry={entry} size={32} tile />       // from a listing entry
 *  <FileIcon category="video" extension="mkv" />   // or by hand
 *
 * `tile` draws the icon on a tinted rounded square (extension-specific colour)
 * and folders get a filled folder look with a small badge for special folders
 * (Movies, Music, Photos, Downloads…). Without `tile` it's just the coloured icon.
 */
function FileIcon({ entry, category, extension, name, isDirectory, size = 20, tile = false, className = '' }) {
  const info = getFileType({
    name: entry?.name ?? name,
    extension: entry?.extension ?? extension,
    category: entry?.category ?? category,
    isDirectory: entry?.isDirectory ?? isDirectory,
  });
  const { Icon, tone, isFolder, badge } = info;
  const folderProps = isFolder ? { fill: 'currentColor', fillOpacity: 0.28 } : {};

  if (!tile) {
    return <Icon size={size} className={`${tone.text} ${className}`} {...folderProps} />;
  }

  const box = Math.round(size * 1.7);
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-xl ${tone.bg} ${className}`}
      style={{ width: box, height: box }}
      title={info.label}
    >
      <Icon size={size} className={tone.text} strokeWidth={1.8} {...folderProps} />
      {badge && (
        <span
          className={`absolute -bottom-1 -right-1 flex items-center justify-center rounded-full border border-surface-raised bg-surface-alt ${badge.tone.text}`}
          style={{ width: Math.round(size * 0.78), height: Math.round(size * 0.78) }}
        >
          <badge.Icon size={Math.round(size * 0.46)} strokeWidth={2.4} />
        </span>
      )}
    </span>
  );
}

export default memo(FileIcon);
