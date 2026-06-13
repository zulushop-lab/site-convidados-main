'use client';
import { useEffect, useState, useRef } from 'react';
import { useInView } from 'motion/react';

type TextScrambleProps = {
  children: string;
  duration?: number;
  speed?: number;
  characterSet?: string;
  as?: any;
  className?: string;
  trigger?: boolean;
  onScrambleComplete?: () => void;
  [key: string]: any;
};

const defaultChars = 'abcdefghijklmnopqrstuvwxyz_---+=/*';

export function TextScramble({
  children,
  duration = 0.8,
  speed = 0.04,
  characterSet = defaultChars,
  className,
  as: Component = 'p',
  trigger = true,
  onScrambleComplete,
  ...props
}: TextScrambleProps) {
  const [displayText, setDisplayText] = useState(children);
  const [isAnimating, setIsAnimating] = useState(false);
  const text = children;
  
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });

  const scramble = async () => {
    if (isAnimating) return;
    setIsAnimating(true);

    const steps = duration / speed;
    let step = 0;

    const interval = setInterval(() => {
      let scrambled = '';
      const progress = step / steps;

      for (let i = 0; i < text.length; i++) {
        if (text[i] === ' ') {
          scrambled += ' ';
          continue;
        }

        if (progress * text.length > i) {
          scrambled += text[i];
        } else {
          scrambled += characterSet[Math.floor(Math.random() * characterSet.length)];
        }
      }

      setDisplayText(scrambled);
      step++;

      if (step > steps) {
        clearInterval(interval);
        setDisplayText(text);
        setIsAnimating(false);
        onScrambleComplete?.();
      }
    }, speed * 1000);
  };

  useEffect(() => {
    if (!trigger || !isInView) return;
    scramble();
  }, [trigger, isInView]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Component 
      ref={ref}
      className={`${className} transition-all duration-300 ease-out`}
      style={{
        filter: isAnimating ? 'blur(1px)' : 'blur(0px)',
        opacity: isAnimating ? 0.8 : 1,
      }}
      {...props}
    >
      {displayText}
    </Component>
  );
}
