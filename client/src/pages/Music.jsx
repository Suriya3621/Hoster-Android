import { Music2 } from 'lucide-react';
import MediaBrowser from './MediaBrowser';

export default function Music() {
  return (
    <MediaBrowser
      category="audio"
      title="Music"
      icon={Music2}
      emptyHint="Music from any of your shared folders will show up here automatically."
      defaultView="list"
    />
  );
}
