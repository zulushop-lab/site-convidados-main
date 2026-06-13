'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'motion/react';

interface AnimatedTextProps {
  text: string;
  className?: string;
  align?: "left" | "center" | "right";
}

interface CharProps {
  char: string;
  progress: MotionValue<number>;
  range: [number, number];
}

function AnimatedChar({ char, progress, range }: CharProps) {
  const opacity = useTransform(progress, range, [0.2, 1]);
  return <motion.span style={{ opacity }} className={char === " " ? "w-[0.25em]" : ""}>{char}</motion.span>;
}

export function AnimatedText({ text, className = "", align = "center" }: AnimatedTextProps) {
  const textRef = useRef<HTMLParagraphElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: textRef,
    offset: ["start 0.8", "end 0.3"]
  });

  // Split by words first, then characters, to allow proper word-wrapping
  const words = text.split(" ");
  
  let globalCharIndex = 0;
  const totalChars = text.length;

  const justifyContent = align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start";

  return (
    <p ref={textRef} className={`relative m-0 p-0 flex flex-wrap ${justifyContent} ${className}`}>
      {words.map((word, wordIndex) => {
        return (
          <span key={wordIndex} className="inline-flex mr-[0.25em] mb-1">
            {word.split("").map((char, charIndex) => {
               const start = globalCharIndex / totalChars;
               const end = start + (1 / totalChars);
               globalCharIndex++;
               return (
                  <AnimatedChar 
                    key={charIndex} 
                    char={char} 
                    progress={scrollYProgress} 
                    range={[start, end]} 
                  />
               );
            })}
          </span>
        );
      })}
    </p>
  );
}
