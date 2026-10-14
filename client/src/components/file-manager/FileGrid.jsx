import { motion } from 'framer-motion';
import FileIcon from './FileIcon';
import { formatBytes } from '../../utils/formatters';
import { api } from '../../services/api';

export default function FileGrid({ entries, onOpen, selectedPath }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 p-4 md:p-6">
      {entries.map((entry) => (
        <motion.button
          key={entry.virtualPath}
          onClick={() => onOpen(entry)}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className={`card flex flex-col items-center justify-center gap-2 aspect-square p-3 hover:border-accent/50 hover:bg-surface-alt transition-colors text-left ${
            selectedPath === entry.virtualPath ? 'border-accent' : ''
          }`}
        >
          {entry.category === 'image' && !entry.isDirectory ? (
            <img
              src={api.streamUrl(entry.virtualPath)}
              alt={entry.name}
              loading="lazy"
              className="w-full h-16 object-cover rounded-lg"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <FileIcon entry={entry} size={30} tile />
          )}
          <span className="text-xs text-center line-clamp-2 break-all w-full">{entry.name}</span>
          {!entry.isDirectory && (
            <span className="text-[10px] text-text-muted">{formatBytes(entry.size)}</span>
          )}
        </motion.button>
      ))}
    </div>
  );
}
