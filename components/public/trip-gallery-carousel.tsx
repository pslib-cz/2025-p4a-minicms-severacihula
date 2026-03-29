"use client";

import Image from "next/image";
import { Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

type TripGalleryCarouselProps = {
  images: string[];
  tripTitle: string;
};

const isValidImageUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export function TripGalleryCarousel({ images, tripTitle }: TripGalleryCarouselProps) {
  const validImages = images.filter(isValidImageUrl);

  if (validImages.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold">Galerie</h2>
      <Swiper
        modules={[Navigation, Pagination]}
        navigation
        pagination={{ clickable: true }}
        spaceBetween={16}
        slidesPerView={1}
        className="rounded-2xl border border-slate-200 bg-slate-50 p-2"
      >
        {validImages.map((url, index) => (
          <SwiperSlide key={`${url}-${index}`}>
            <div className="relative h-[380px] w-full overflow-hidden rounded-xl sm:h-[480px]">
              <Image
                src={url}
                alt={`${tripTitle} - galerie ${index + 1}`}
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, 960px"
                className="object-cover"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
