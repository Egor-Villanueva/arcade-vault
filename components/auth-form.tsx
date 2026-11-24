"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Tab = "in" | "up";

/**
 * Solo UI: no valida, no guarda sesión ni escribe en localStorage.
 * Enviar el formulario navega a la biblioteca.
 */
export function AuthForm() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("in");

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push("/biblioteca");
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <div className="mark"></div>
        <h2 className="neon-cyan">ARCADE VAULT</h2>
        <div
          className="mono"
          style={{ fontSize: 11, color: "var(--ink-faint)", letterSpacing: "0.16em", marginTop: 6 }}
        >
          ACCESO AL SISTEMA · v2.6
        </div>
      </div>

      <div className="auth-tabs">
        <button type="button" className={tab === "in" ? "on" : ""} onClick={() => setTab("in")}>
          INICIAR SESIÓN
        </button>
        <button type="button" className={tab === "up" ? "on" : ""} onClick={() => setTab("up")}>
          CREAR CUENTA
        </button>
      </div>

      <form onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="auth-user">Usuario</label>
          <input id="auth-user" name="user" placeholder="px_kai" autoComplete="username" />
        </div>
        {tab === "up" && (
          <div className="field slide-in">
            <label htmlFor="auth-email">Correo electrónico</label>
            <input
              id="auth-email"
              name="email"
              type="email"
              placeholder="jugador@vault.gg"
              autoComplete="email"
            />
          </div>
        )}
        <div className="field">
          <label htmlFor="auth-pass">Contraseña</label>
          <input
            id="auth-pass"
            name="pass"
            type="password"
            placeholder="••••••••"
            autoComplete={tab === "in" ? "current-password" : "new-password"}
          />
        </div>

        <button className="btn lg" type="submit" style={{ width: "100%", marginTop: 8 }}>
          {tab === "in" ? "ENTRAR AL VAULT" : "CREAR Y JUGAR"}
        </button>
      </form>

      <Link className="btn ghost" href="/biblioteca" style={{ width: "100%", marginTop: 10 }}>
        JUGAR COMO INVITADO
      </Link>

      <div className="auth-divider">O CONTINÚA CON</div>
      <div className="social">
        <button className="btn ghost" type="button">
          ◆&nbsp; GOOGLE
        </button>
        <button className="btn ghost" type="button">
          ▣&nbsp; GITHUB
        </button>
      </div>

      <div
        style={{
          marginTop: 18,
          textAlign: "center",
          fontSize: 11,
          color: "var(--ink-faint)",
          letterSpacing: "0.1em",
        }}
      >
        AL ENTRAR ACEPTAS LOS TÉRMINOS DEL SALÓN ARCADE
      </div>
    </div>
  );
}
