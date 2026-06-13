'use client';

import { useState, useEffect } from 'react';
import { ImageWithSkeleton } from './ImageWithSkeleton';

interface ImageSliderProps {
  images: string[];
  interval?: number;
  className?: string;
  imageClassName?: string;
  alt?: string;
}

export function ImageSlider({ images, interval = 8000, className = '', imageClassName = 'object-cover', alt = 'Imagem' }: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

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
      {images.map((src, index) => {
        // Only render the first image immediately. Render the rest after 2 seconds to save initial bandwidth.
        if (index > 0 && !hasStarted && index !== currentIndex) return null;

        const isActive = index === currentIndex;
        return (
          <div
            key={src}
            className={`absolute inset-0 transition-opacity duration-[2000ms] ease-in-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <ImageWithSkeleton
              src={src}
              alt={`${alt} ${index + 1}`}
              fill
              quality={85}
              className={`${imageClassName} transition-transform duration-[12000ms] ease-out ${
                isActive ? 'scale-110 translate-x-[-1%] translate-y-[-1%]' : 'scale-100 translate-x-0 translate-y-0'
              }`}
              referrerPolicy="no-referrer"
              priority={index === 0}
              sizes="100vw"
            />
          </div>
        );
      })}
    </div>
  );
}
