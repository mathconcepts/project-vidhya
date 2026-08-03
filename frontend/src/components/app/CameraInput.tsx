/**
 * CameraInput — Camera capture + gallery upload for math problem images.
 * Resizes images client-side to max 1024px for efficient base64 transmission.
 */

import { useRef, useState, useCallback } from 'react';
import { Camera, Image, X } from 'lucide-react';

interface CameraInputProps {
  onCapture: (base64: string, mimeType: string) => void;
  onClear: () => void;
  preview?: string | null;
  compact?: boolean;
}

const MAX_SIZE = 1024;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function resizeImage(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          } else {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const base64 = dataUrl.split(',')[1];
        resolve({ base64, mimeType: 'image/jpeg' });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function CameraInput({ onCapture, onClear, preview, compact }: CameraInputProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    if (file.size > MAX_FILE_SIZE) {
      setError('Image too large (max 5MB)');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    setLoading(true);
    try {
      const { base64, mimeType } = await resizeImage(file);
      onCapture(base64, mimeType);
    } catch {
      setError('Failed to process image');
    } finally {
      setLoading(false);
    }
  }, [onCapture]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }, [handleFile]);

  if (preview) {
    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <img
          src={`data:image/jpeg;base64,${preview}`}
          alt="Captured problem"
          style={compact
            ? { width: 48, height: 48, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }
            : { maxHeight: 192, borderRadius: 'var(--radius-lg)', objectFit: 'contain', border: 'var(--hairline) solid var(--separator)' }
          }
        />
        <button
          onClick={onClear}
          style={{
            position: 'absolute',
            top: -8,
            right: -8,
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: 'var(--red)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-raise)',
          }}
        >
          <X size={12} style={{ color: 'var(--text-on-accent)' }} />
        </button>
      </div>
    );
  }

  return (
    <div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleChange} style={{ display: 'none' }} />
      <input ref={galleryRef} type="file" accept="image/*" onChange={handleChange} style={{ display: 'none' }} />

      <div style={{ display: 'flex', gap: compact ? 4 : 12 }}>
        <button
          onClick={() => cameraRef.current?.click()}
          disabled={loading}
          style={compact ? {
            padding: 10,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-fill)',
            border: 'none',
            color: 'var(--green-ink)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          } : {
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '16px 0',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--surface-fill)',
            border: 'var(--hairline) solid var(--separator)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-footnote)',
            fontWeight: 'var(--weight-medium)',
          }}
        >
          <Camera size={compact ? 18 : 24} />
          {!compact && <span>Take Photo</span>}
        </button>
        {!compact && (
          <button
            onClick={() => galleryRef.current?.click()}
            disabled={loading}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '16px 0',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--surface-fill)',
              border: 'var(--hairline) solid var(--separator)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-footnote)',
              fontWeight: 'var(--weight-medium)',
            }}
          >
            <Image size={24} />
            <span>From Gallery</span>
          </button>
        )}
      </div>

      {loading && (
        <p style={{ margin: '8px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
          Processing image…
        </p>
      )}
      {error && (
        <p style={{ margin: '8px 0 0', fontSize: 'var(--text-caption)', color: 'var(--red)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
