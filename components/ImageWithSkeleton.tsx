'use client';

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { Skeleton } from './Skeleton';
import { cn } from '@/lib/utils';

interface ImageWithSkeletonProps extends ImageProps {
  containerClassName?: string;
}

export function ImageWithSkeleton({ 
  src, 
  alt, 
  className, 
  containerClassName, 
  onLoad,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  ...props 
}: ImageWithSkeletonProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={cn(
      "relative overflow-hidden", 
      props.fill ? "w-full h-full" : "",
      containerClassName
    )}>
      {isLoading && <Skeleton className="absolute inset-0 z-10" />}
      <Image
        src={src}
        alt={alt}
        sizes={sizes}
        className={cn(
          className,
          "transition-opacity duration-700",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        onLoad={(e) => {
          setIsLoading(false);
          if (onLoad) onLoad(e);
        }}
        {...props}
      />
    </div>
  );
}
