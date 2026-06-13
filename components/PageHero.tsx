'use client';

import { ImageWithSkeleton } from './ImageWithSkeleton';
import { motion } from 'motion/react';
import { ImageSlider } from './ImageSlider';
import { NoiseOverlay } from './NoiseOverlay';

interface PageHeroProps {
  title: string;
  subtitle?: string;
  imageSrc?: string;
  images?: string[];
  imageClassName?: string;
  containerClassName?: string;
  imageAlt: string;
  objectPosition?: string;
}

export function PageHero({ title, subtitle, imageSrc, images, imageClassName, containerClassName = '', imageAlt, objectPosition = 'center 20%' }: PageHeroProps) {
  return (
    <section className={`relative w-full h-[60vh] md:h-[70vh] flex flex-col mb-20 overflow-hidden ${containerClassName}`}>
      <div className="absolute inset-0 w-full h-full">
        {images && images.length > 0 ? (
          <ImageSlider 
            images={images} 
            className="w-full h-full grayscale-[5%]" 
            imageClassName={imageClassName}
            alt={imageAlt}
            interval={5000}
          />
        ) : imageSrc ? (
          <ImageWithSkeleton
            src={imageSrc}
            alt={imageAlt}
            fill
            priority
            quality={85}
            className={`${imageClassName || 'object-cover'} grayscale-[5%]`}
            style={{ objectPosition }}
            sizes="100vw"
            referrerPolicy="no-referrer"
          />
        ) : null}
        {/* Overlays for contrast */}
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 z-10"></div>
        <NoiseOverlay />
      </div>

      <div className="absolute inset-0 z-20 flex items-center justify-center px-6 text-center pointer-events-none pt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl text-white"
        >
          {subtitle && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="font-label text-[10px] uppercase tracking-[0.4rem] text-white/70 block mb-4"
            >
              {subtitle}
            </motion.span>
          )}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-5xl md:text-7xl font-headline italic font-extralight text-white leading-tight tracking-tighter"
          >
            {title}
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="h-px w-24 bg-white/30 mx-auto mt-8"
          />
        </motion.div>
      </div>
    </section>
  );
}
