"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type RevealProps = {
  /** Etiqueta del contenedor; por defecto <section>. */
  as?: "section" | "div";
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

/**
 * Envoltorio que añade la clase `in` a su propio nodo al entrar en el viewport
 * (umbral 0.12) y deja de observarlo. Con `prefers-reduced-motion: reduce`
 * la añade de inmediato.
 */
export function Reveal({ as: Tag = "section", className, style, children }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("in");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement>}
      className={"reveal" + (className ? " " + className : "")}
      style={style}
    >
      {children}
    </Tag>
  );
}
