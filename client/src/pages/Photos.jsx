import { Image } from 'lucide-react';
import MediaBrowser from './MediaBrowser';

export default function Photos() {
  return (
    <MediaBrowser
      category="image"
      title="Photos"
      icon={Image}
      emptyHint="Photos from any of your shared folders will show up here automatically."
    />
  );
}
