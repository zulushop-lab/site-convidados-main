'use client';

import { useState, useEffect } from 'react';
import { getImageProps } from 'next/image';
import { cn } from '@/lib/utils';
import { Skeleton } from './Skeleton';

export type ImageSliderImage = string | {
  src: string;
  mobileSrc?: string;
  alt?: string;
  className?: string;
};

interface ImageSliderProps {
  images: ImageSliderImage[];
  interval?: number;
  className?: string;
  imageClassName?: string;
  alt?: string;
}

function normalizeImage(image: ImageSliderImage) {
  return typeof image === 'string' ? { src: image } : image;
}

export function ImageSlider({ images, interval = 8000, className = '', imageClassName = 'object-cover', alt = 'Imagem' }: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Delay mounting non-first images to avoid simultaneous LCP competition
    const initialTimer = setTimeout(() => setHasStarted(true), 2000);
    return () => clearTimeout(initialTimer);
  }, []);

  useEffect(() => {
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval]);

  if (!images || images.length === 0) return null;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {images.map((image, index) => {
        const slide = normalizeImage(image);
        // Only render the first image immediately. Render the rest after 2 seconds to save initial bandwidth.
        if (index > 0 && !hasStarted && index !== currentIndex) return null;

        const isActive = index === currentIndex;
        const imageAlt = slide.alt ?? `${alt} ${index + 1}`;
        const imageKey = `${slide.src}:${slide.mobileSrc ?? ''}`;
        const { props: desktopProps } = getImageProps({
          src: slide.src,
          alt: imageAlt,
          fill: true,
          quality: 85,
          priority: index === 0,
          sizes: '100vw',
        });
        const mobileProps = slide.mobileSrc
          ? getImageProps({
              src: slide.mobileSrc,
              alt: imageAlt,
              fill: true,
              quality: 85,
              priority: index === 0,
              sizes: '100vw',
            }).props
          : null;

        return (
          <div
            key={imageKey}
            className={`absolute inset-0 transition-opacity duration-[2000ms] ease-in-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <div className="relative h-full w-full overflow-hidden">
              {!loadedImages[imageKey] && <Skeleton className="absolute inset-0 z-10" />}
              <picture>
                {mobileProps?.srcSet && (
                  <source media="(max-width: 767px)" srcSet={mobileProps.srcSet} sizes={mobileProps.sizes} />
                )}
                <img
                  {...desktopProps}
                  alt={imageAlt}
                  ref={(node) => {
                    if (node?.complete) {
                      setLoadedImages((loaded) => (
                        loaded[imageKey] ? loaded : { ...loaded, [imageKey]: true }
                      ));
                    }
                  }}
                  className={cn(
                    imageClassName,
                    slide.className,
                    'transition-[opacity,transform] duration-700 ease-out',
                    isActive
                      ? 'scale-[1.03] md:scale-110 md:translate-x-[-1%] md:translate-y-[-1%]'
                      : 'scale-100 translate-x-0 translate-y-0',
                    loadedImages[imageKey] ? 'opacity-100' : 'opacity-0'
                  )}
                  referrerPolicy="no-referrer"
                  onLoad={() => setLoadedImages((loaded) => ({ ...loaded, [imageKey]: true }))}
                />
              </picture>
            </div>
          </div>
        );
      })}
    </div>
  );
}
