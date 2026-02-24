import { ImagePlus, Loader2, X, CheckCircle2 } from "lucide-react";
import { useRef } from "react";
import { UploadedImage } from "..";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const ImageUploadZone = ({
  images,
  onAdd,
  onRemove,
  onError
}: {
  images: UploadedImage[];
  onAdd: (files: File[]) => void;
  onRemove: (key: string) => void;
  onError: (error: string) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-2 
          rounded-xl border-2 border-dashed cursor-pointer transition-all py-5 
          border-white/[0.07] bg-white/2 hover:border-white/[0.14] hover:bg-white/4`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const all   = Array.from(e.target.files ?? []);
            const valid = all.filter((f) => ALLOWED_TYPES.includes(f.type));

            if (valid.length < all.length) {
              onError("Only JPG, PNG, WebP and GIF images are allowed.");
            }


            if (valid.length) {
              onError('');
              onAdd(valid);
              e.target.value = "";
            }
          }}
        />
        <div className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors bg-white/4">
          <ImagePlus size={16} className="text-neutral-500" />
        </div>
        <div className="text-center">
          <p className="text-[12px] text-neutral-400">
            Add design references here
          </p>
          <p className="text-[11px] text-neutral-600 mt-0.5">
            PNG, JPG, WEBP — uploaded to S3
          </p>
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img) => (
            <div
              key={img.s3Key || img.name}
              className="relative group w-16 h-16 rounded-lg overflow-hidden border border-white/10 bg-white/3"
            >
              <img
                src={img.previewUrl}
                alt={img.name}
                className="w-full h-full object-cover"
              />

              {/* Uploading overlay */}
              {img.uploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 size={14} className="text-amber-400 animate-spin" />
                </div>
              )}

              {/* Error overlay */}
              {img.error && (
                <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center">
                  <span className="text-[9px] text-red-300 text-center px-1 leading-tight">{img.error}</span>
                </div>
              )}

              {/* Remove button */}
              {!img.uploading && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(img.s3Key || img.name); }}
                  className="absolute top-0.5 cursor-pointer right-0.5 w-4 h-4 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                >
                  <X size={8} className="text-white" />
                </button>
              )}

              {/* Success tick */}
              {!img.uploading && !img.error && img.s3Key && (
                <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-emerald-500/80 flex items-center justify-center">
                  <CheckCircle2 size={9} className="text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
