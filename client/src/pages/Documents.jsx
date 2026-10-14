import { FileText } from 'lucide-react';
import MediaBrowser from './MediaBrowser';

export default function Documents() {
  return (
    <MediaBrowser
      category="document"
      title="Documents"
      icon={FileText}
      emptyHint="Word, Excel, PowerPoint and other document files will show up here."
      defaultView="list"
    />
  );
}
