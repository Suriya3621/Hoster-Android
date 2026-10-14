import { Clapperboard } from 'lucide-react';
import MediaBrowser from './MediaBrowser';

export default function Videos() {
  return (
    <MediaBrowser
      category="video"
      title="Videos"
      icon={Clapperboard}
      emptyHint="Videos from any of your shared folders will show up here automatically."
    />
  );
}
