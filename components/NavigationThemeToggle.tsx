'use client';

import { useTheme } from 'next-themes';
import { ThemeToggle } from './ThemeToggle';
import { useEffect, useState } from 'react';

export function NavigationThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="fixed top-6 right-6 md:top-12 md:right-12 z-[100]">
      <ThemeToggle 
        variant="icon" 
        defaultTheme={(theme === 'dark' ? 'dark' : 'light')} 
        onThemeChange={(newTheme) => setTheme(newTheme)}
      />
    </div>
  );
}
