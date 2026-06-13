"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface CardTeaserProps {
  id: string; // The layoutId for framer-motion unique transition
  title: string;
  description: string;
  imageSrc: string;
  href: string;
  className?: string;
}

export const CardTeaser = ({ id, title, description, imageSrc, href, className }: CardTeaserProps) => {
  const router = useRouter();
  const [isExpanding, setIsExpanding] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExpanding(true);

    // After animation expands to screen, push route.
    // The next page can theoretically use the same layoutId if AnimatePresence wrapped the root,
    // but in pure Next App router, masking the load is very effective.
    setTimeout(() => {
      router.push(href);
    }, 700); // 700ms matches the layout expansion spring
  };

  return (
    <>
      <motion.div
        layoutId={`card-container-${id}`}
        onClick={handleClick}
        className={cn(
          "relative overflow-hidden rounded-3xl cursor-pointer group h-[400px] shadow-lg",
          className
        )}
      >
        <motion.div layoutId={`card-image-${id}`} className="absolute inset-0 w-full h-full">
          <Image
            src={imageSrc}
            alt={title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-500" />
        </motion.div>

        <motion.div layoutId={`card-content-${id}`} className="absolute inset-x-0 bottom-0 p-6 sm:p-8 z-10 flex flex-col justify-end">
          <h3 className="font-headline italic text-3xl text-white mb-2">{title}</h3>
          <p className="font-body text-white/80 line-clamp-2">{description}</p>
        </motion.div>
      </motion.div>

      {/* The Expanding Overlay - Renders globally when clicked to fill screen */}
      <AnimatePresence>
        {isExpanding && (
          <motion.div
            layoutId={`card-container-${id}`}
            style={{ borderRadius: 0 }}
            className="fixed inset-0 z-[100] bg-black cursor-default overflow-hidden"
          >
            <motion.div layoutId={`card-image-${id}`} className="absolute inset-0 w-full h-full">
              <Image
                src={imageSrc}
                alt={title}
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/60" />
            </motion.div>

            <motion.div 
              layoutId={`card-content-${id}`} 
              className="absolute inset-x-0 bottom-40 p-8 z-10 flex flex-col justify-end items-center text-center"
            >
              <h3 className="font-headline italic text-5xl md:text-6xl text-white mb-4 drop-shadow-lg">{title}</h3>
              <p className="font-body text-white/90 text-lg max-w-lg drop-shadow-md">{description}</p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-12 flex space-x-2"
              >
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
