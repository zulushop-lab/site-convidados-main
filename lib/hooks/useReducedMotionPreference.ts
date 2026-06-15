"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

export function useReducedMotionPreference() {
  const reducedByMotion = useReducedMotion();
  const [reducedByMedia, setReducedByMedia] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedByMedia(query.matches);

    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reducedByMotion === true || reducedByMedia;
}
