'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function Countdown({ targetDate }: { targetDate: string }) {
  const calculateTimeLeft = () => {
    const difference = +new Date(targetDate) - +new Date();
    if (difference <= 0) return null;

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    // Only set if we don't have a value yet to prevent redundant updates
    const initial = calculateTimeLeft();
    if (initial) setTimeLeft(initial);

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDate]);

  if (!timeLeft) return null;

  const items = [
    { label: 'Dias', value: timeLeft.days },
    { label: 'Horas', value: timeLeft.hours },
    { label: 'Minutos', value: timeLeft.minutes },
    { label: 'Segundos', value: timeLeft.seconds },
  ];

  return (
    <div className="flex bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 md:p-6 shadow-2xl gap-4 md:gap-8 justify-center">
      {items.map((item, index) => (
        <motion.div 
          key={item.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex flex-col items-center min-w-[60px] md:min-w-[80px]"
        >
          <span className="text-4xl md:text-5xl font-headline italic font-bold bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent drop-shadow-sm mb-1">
            {item.value.toString().padStart(2, '0')}
          </span>
          <span className="font-label text-[9px] md:text-[10px] uppercase tracking-[0.2rem] text-gold/80 font-medium">
            {item.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
