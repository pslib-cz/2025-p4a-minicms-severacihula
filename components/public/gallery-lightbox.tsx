"use client";

import { useEffect, useMemo, useState } from "react";

type GalleryLightboxProps = {
  images: string[];
  title?: string;
};

const isValidImageUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export function GalleryLightbox({ images, title = "Galerie" }: GalleryLightboxProps) {
  const validImages = useMemo(() => images.filter(isValidImageUrl), [images]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const isOpen = activeIndex !== null;

  const close = () => setActiveIndex(null);

  const showNext = () => {
    if (activeIndex === null || validImages.length === 0) {
      return;
    }

    setActiveIndex((activeIndex + 1) % validImages.length);
  };

  const showPrevious = () => {
    if (activeIndex === null || validImages.length === 0) {
      return;
    }

    setActiveIndex((activeIndex - 1 + validImages.length) % validImages.length);
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }

      if (event.key === "ArrowRight") {
        showNext();
      }

      if (event.key === "ArrowLeft") {
        showPrevious();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, activeIndex, validImages.length]);

  if (validImages.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {validImages.map((imageUrl, index) => (
          <button
            key={`${imageUrl}-${index}`}
            type="button"
            className="overflow-hidden rounded-xl border border-slate-200 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-600"
            onClick={() => setActiveIndex(index)}
          >
            <img
              src={imageUrl}
              alt={`${title} ${index + 1}`}
              className="h-56 w-full object-cover transition-transform duration-200 hover:scale-105"
            />
          </button>
        ))}
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 rounded-lg bg-white/10 px-3 py-2 text-sm text-white transition-all duration-200 ease-in-out hover:bg-white/20"
          >
            X
          </button>

          <button
            type="button"
            onClick={showPrevious}
            className="absolute left-4 rounded-lg bg-white/10 px-3 py-2 text-white transition-all duration-200 ease-in-out hover:bg-white/20"
          >
            Předchozí
          </button>

          <img
            src={validImages[activeIndex]}
            alt={`${title} ${activeIndex + 1}`}
            className="max-h-[85vh] max-w-[92vw] rounded-xl object-contain"
          />

          <button
            type="button"
            onClick={showNext}
            className="absolute right-4 rounded-lg bg-white/10 px-3 py-2 text-white transition-all duration-200 ease-in-out hover:bg-white/20"
          >
            Další
          </button>
        </div>
      ) : null}
    </section>
  );
}
