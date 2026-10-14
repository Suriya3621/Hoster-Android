import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

/** Renders a QR code encoding `value` onto a canvas. Lightweight, no network calls. */
export default function QRCodeCanvas({ value, size = 128 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!value || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, value, {
      width: size,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    }).catch(() => {
      /* fail silently — QR is a nice-to-have, not critical path */
    });
  }, [value, size]);

  return <canvas ref={canvasRef} className="rounded-lg" width={size} height={size} />;
}
