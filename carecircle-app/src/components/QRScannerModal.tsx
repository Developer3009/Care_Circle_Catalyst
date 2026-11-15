'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export default function QRScannerModal({ onScanSuccess, onClose }: QRScannerProps) {
  const [scanError, setScanError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    try {
      const scanner = new Html5QrcodeScanner(
        'qr-reader-container',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false
      );

      scannerRef.current = scanner;

      scanner.render(
        (decodedText) => {
          scanner.clear().catch(console.error);
          onScanSuccess(decodedText);
        },
        (error) => {
          // Ignored per-frame scan errors
        }
      );
    } catch (e: any) {
      setScanError(e?.message || 'Camera permission required to scan QR code.');
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="bg-rose-100 text-rose-700 p-2 rounded-xl">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Scan Emergency QR</h3>
              <p className="text-xs text-slate-500">Point your camera at any CareCircle QR code</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {scanError ? (
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{scanError}</span>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
            <div id="qr-reader-container" className="w-full" />
          </div>
        )}

        <div className="text-center pt-2">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl w-full">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
