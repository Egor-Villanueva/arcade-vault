"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type Section = "inicio" | "biblioteca" | "salon" | "acerca-de" | "auth";

function sectionOf(pathname: string): Section | null {
  if (pathname === "/") return "inicio";
  if (pathname.startsWith("/biblioteca") || pathname.startsWith("/juegos")) return "biblioteca";
  if (pathname.startsWith("/salon")) return "salon";
  if (pathname.startsWith("/acerca-de")) return "acerca-de";
  if (pathname.startsWith("/auth")) return "auth";
  return null;
}

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = sectionOf(pathname);
  const cls = (s: Section) => (current === s ? "active" : undefined);
  const close = () => setOpen(false);

  return (
    <>
      <nav className="av-nav">
        <Link className="logo" href="/">
          <div className="logo-mark"></div>
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </Link>
        <div className="links">
          <Link className={cls("inicio")} href="/">
            Inicio
          </Link>
          <Link className={cls("biblioteca")} href="/biblioteca">
            Biblioteca
          </Link>
          <Link className={cls("salon")} href="/salon">
            Salón de la Fama
          </Link>
          <Link className={cls("acerca-de")} href="/acerca-de">
            Acerca de
          </Link>
        </div>
        <div className="spacer"></div>
        <div className="coin-counter">
          <span className="coin"></span>
          <span>CRÉDITOS · 03</span>
        </div>
        <Link className="btn auth-btn" href="/auth">
          Iniciar Sesión
        </Link>
        <button
          type="button"
          className="btn ghost hamburger"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={open}
        >
          ≡
        </button>
      </nav>

      <div className={"av-mobile-backdrop" + (open ? " open" : "")} onClick={close}></div>
      {/* inert: con el panel cerrado, sus enlaces no reciben foco */}
      <aside className={"av-mobile-panel" + (open ? " open" : "")} inert={!open}>
        <div className="pixel neon-cyan" style={{ fontSize: 11, marginBottom: 16 }}>
          MENÚ
        </div>
        <Link className={cls("inicio")} href="/" onClick={close}>
          Inicio
        </Link>
        <Link className={cls("biblioteca")} href="/biblioteca" onClick={close}>
          Biblioteca
        </Link>
        <Link className={cls("salon")} href="/salon" onClick={close}>
          Salón de la Fama
        </Link>
        <Link className={cls("acerca-de")} href="/acerca-de" onClick={close}>
          Acerca de
        </Link>
        <Link className={cls("auth")} href="/auth" onClick={close}>
          Iniciar Sesión
        </Link>
        <div style={{ flex: 1 }}></div>
        <div className="pixel" style={{ fontSize: 9, color: "var(--ink-faint)", letterSpacing: "0.16em" }}>
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}
