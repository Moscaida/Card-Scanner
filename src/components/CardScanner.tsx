'use client';

import { useRef, useState, useCallback } from 'react';
import { Camera, Square, Scan, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { TCGProduct } from '@/types';
import GameBadge from './GameBadge';

interface ScanResult {
  product: TCGProduct;
  confidence: number;
}

export default function CardScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [ocrText, setOcrText] = useState('');
  const [error, setError] = useState('');
  const [scanStatus, setScanStatus] = useState('');

  const startCamera = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (err) {
      const e = err as Error;
      if (e.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access and try again.');
      } else {
        setError('Could not access camera. Please ensure a camera is connected.');
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsStreaming(false);
    setScanResult(null);
    setOcrText('');
  }, []);

  const captureAndScan = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsScanning(true);
    setScanResult(null);
    setOcrText('');

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);

    try {
      setScanStatus('Loading OCR engine...');
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');

      setScanStatus('Scanning card text...');
      const { data } = await worker.recognize(canvas);
      await worker.terminate();

      const text = data.text.trim();
      setOcrText(text);
      setScanStatus('Matching card...');

      // Extract potential card name from OCR text (first meaningful line)
      const lines = text
        .split('\n')
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 2 && l.length < 60);

      let matched: TCGProduct | null = null;
      let bestConfidence = 0;

      for (const line of lines.slice(0, 5)) {
        const res = await fetch(`/api/tcgplayer/search?q=${encodeURIComponent(line)}&limit=1`);
        const data = await res.json();
        if (data.results?.length > 0) {
          const confidence = Math.min(100, Math.round((line.length / 20) * 80 + 20));
          if (confidence > bestConfidence) {
            matched = data.results[0];
            bestConfidence = confidence;
          }
        }
      }

      if (matched) {
        setScanResult({ product: matched, confidence: bestConfidence });
        setScanStatus('');
      } else {
        setScanStatus('No card matched. Try adjusting lighting or angle.');
      }
    } catch (err) {
      console.error(err);
      setScanStatus('Scan failed. Please try again.');
    } finally {
      setIsScanning(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Camera viewport */}
      <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-700 aspect-video max-w-2xl mx-auto">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
        />
        <canvas ref={canvasRef} className="hidden" />

        {!isStreaming && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-500">
            <Camera className="w-16 h-16" />
            <p className="text-sm">Camera not started</p>
          </div>
        )}

        {isStreaming && (
          <>
            {/* Corner bracket overlay */}
            <div className="absolute inset-8 pointer-events-none">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-sky-400 rounded-tl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-sky-400 rounded-tr" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-sky-400 rounded-bl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-sky-400 rounded-br" />
            </div>

            {isScanning && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
                <p className="text-sky-300 text-sm font-medium">{scanStatus || 'Scanning...'}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        {!isStreaming ? (
          <button
            onClick={startCamera}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            <Camera className="w-5 h-5" />
            Start Camera
          </button>
        ) : (
          <>
            <button
              onClick={stopCamera}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium py-3 px-5 rounded-lg transition-colors"
            >
              <Square className="w-5 h-5" />
              Stop
            </button>
            <button
              onClick={captureAndScan}
              disabled={isScanning}
              className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-lg transition-colors text-lg"
            >
              {isScanning ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Scan className="w-5 h-5" />
              )}
              Scan Card
            </button>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-900/40 border border-red-800 text-red-300 rounded-lg p-4 max-w-2xl mx-auto">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Status */}
      {!isScanning && scanStatus && !scanResult && (
        <p className="text-center text-slate-400 text-sm">{scanStatus}</p>
      )}

      {/* Scan Result */}
      {scanResult && (
        <div className="max-w-2xl mx-auto bg-slate-800 border border-emerald-700 rounded-xl p-4">
          <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wide mb-3">
            Card Identified
          </p>
          <div className="flex items-center gap-4">
            <img
              src={scanResult.product.imageUrl}
              alt={scanResult.product.name}
              className="w-16 rounded-lg border border-slate-700"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-slate-100 font-semibold truncate">{scanResult.product.name}</h3>
              <GameBadge categoryId={scanResult.product.categoryId} className="mt-1" />
            </div>
            <Link
              href={`/card/${scanResult.product.productId}`}
              className="flex-shrink-0 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
            >
              View
            </Link>
          </div>
          {ocrText && (
            <details className="mt-3">
              <summary className="text-xs text-slate-500 cursor-pointer">Show OCR text</summary>
              <pre className="text-xs text-slate-400 mt-2 bg-slate-900 p-2 rounded overflow-auto max-h-24">
                {ocrText}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* Manual search fallback */}
      <p className="text-center text-slate-500 text-sm">
        Can&apos;t scan?{' '}
        <Link href="/search" className="text-sky-400 hover:text-sky-300 underline underline-offset-2">
          Search manually
        </Link>
      </p>
    </div>
  );
}
