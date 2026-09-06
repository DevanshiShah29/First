"use client";

// External dependencies
import { useEffect, useState } from "react";

// Application services & types
import { useReducedMotion } from "@/hooks/reduced-motion";

function TypewriterLive({ words }: { words: readonly string[] }) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState(words[0] ?? "");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[index] ?? "";
    const delay = deleting ? 40 : text === word ? 1600 : 70;
    const id = window.setTimeout(() => {
      if (!deleting) {
        const next = word.slice(0, text.length + 1);
        setText(next);
        if (next === word) setDeleting(true);
      } else {
        const next = word.slice(0, Math.max(0, text.length - 1));
        setText(next);
        if (next.length === 0) {
          setDeleting(false);
          setIndex((i) => (i + 1) % Math.max(words.length, 1));
        }
      }
    }, delay);
    return () => window.clearTimeout(id);
  }, [deleting, index, text, words]);

  return (
    <p className="inline-block text-xl font-medium text-accent-text sm:text-2xl" aria-hidden="true">
      {text}
      <span className="typewriter-cursor motion-safe:animate-pulse" />
    </p>
  );
}

export function Typewriter({ words }: { words: readonly string[] }) {
  const reduce = useReducedMotion();
  const list = words.filter(Boolean);
  const spoken = list.join(". ");

  if (reduce) {
    return (
      <>
        <span className="sr-only">{spoken}</span>
        <p className="inline-block text-xl font-medium text-accent-text sm:text-2xl" aria-hidden="true">
          {list.join(" · ")}
        </p>
      </>
    );
  }

  return (
    <>
      <span className="sr-only">{spoken}</span>
      <TypewriterLive words={list} />
    </>
  );
}
