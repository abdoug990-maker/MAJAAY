'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, X, Loader2, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImageUpload({ images, onChange, maxImages = 5 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (files: FileList) => {
    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      toast.error(`Maximum ${maxImages} photos atteint`);
      return;
    }

    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    let nextImages = [...images];

    for (const file of toUpload) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} trop volumineux (max 5 Mo)`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        nextImages = [...nextImages, data.url];
        onChange(nextImages);
      } catch (err: any) {
        toast.error(err.message);
      }
    }
    setUploading(false);
  }, [images, maxImages, onChange]);

  const removeImage = async (index: number) => {
    const url = images[index];
    onChange(images.filter((_, i) => i !== index));
    const marker = '/listing-images/';
    const path = url.includes(marker) ? decodeURIComponent(url.split(marker)[1].split('?')[0]) : null;
    if (path) {
      try { await fetch('/api/upload', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path }) }); } catch { /* l’aperçu local est déjà retiré */ }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {images.map((url, i) => (
          <div key={url} className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 group shadow-sm border border-border">
            <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
            >
              <div className="w-6 h-6 rounded-full bg-destructive/90 text-white flex items-center justify-center">
                <X className="w-3.5 h-3.5" />
              </div>
            </button>
            {i === 0 && (
              <span className="absolute bottom-0.5 left-0.5 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded font-medium">Principale</span>
            )}
          </div>
        ))}
        {images.length < maxImages && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-24 h-24 rounded-xl border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-terracotta/50 hover:bg-terracotta/5 transition-all flex-shrink-0 group disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 text-terracotta animate-spin" />
            ) : (
              <>
                <div className="w-9 h-9 rounded-lg bg-terracotta/10 flex items-center justify-center mb-1 group-hover:bg-terracotta/20 transition-colors">
                  <ImagePlus className="w-5 h-5 text-terracotta" />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">Ajouter</span>
              </>
            )}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) void handleUpload(e.target.files);
          e.currentTarget.value = '';
        }}
      />
      <p className="text-[11px] text-muted-foreground">
        {images.length}/{maxImages} photos · JPG, PNG, WebP · Max 5 Mo chacune
      </p>
    </div>
  );
}
