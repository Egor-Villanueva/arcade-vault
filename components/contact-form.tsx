"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { sendContactMessage } from "@/app/acerca-de/actions";
import { validateContact, type ContactState } from "@/lib/contact";

const INITIAL_STATE: ContactState = { status: "idle" };

export function ContactForm() {
  const [state, formAction, pending] = useActionState(sendContactMessage, INITIAL_STATE);
  const [fields, setFields] = useState({ name: "", email: "", message: "" });
  const [shake, setShake] = useState(false);
  // Estado de éxito que el visitante ya cerró con "ENVIAR OTRO MENSAJE".
  const [dismissed, setDismissed] = useState<ContactState | null>(null);
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (shakeTimer.current) clearTimeout(shakeTimer.current);
    };
  }, []);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    if (pending) {
      e.preventDefault();
      return;
    }
    if (Object.keys(validateContact(fields)).length > 0) {
      // Cancela la acción: no se llama al servidor.
      e.preventDefault();
      setShake(true);
      if (shakeTimer.current) clearTimeout(shakeTimer.current);
      shakeTimer.current = setTimeout(() => setShake(false), 400);
    }
  };

  const reset = () => {
    setDismissed(state);
    setFields({ name: "", email: "", message: "" });
  };

  const showSuccess = state.status === "success" && state !== dismissed;
  const showError = state.status === "error" && !pending;

  return (
    <form
      className={"contact-form" + (shake ? " shake" : "")}
      action={formAction}
      onSubmit={onSubmit}
      noValidate
    >
      {showSuccess ? (
        <div className="terminal-success">
          <div className="term-bar">
            <span className="dot r"></span>
            <span className="dot y"></span>
            <span className="dot g"></span>
            <span className="term-title">VAULT-OS // TERMINAL</span>
          </div>
          <div className="term-body">
            <div className="line">
              <span className="prompt">vault@arcade:~$</span> ./send_message --to=team
            </div>
            <div className="line dim">[OK] Conectando con servidor…</div>
            <div className="line dim">[OK] Validando contenido…</div>
            <div className="line dim">[OK] Transmitiendo paquete…</div>
            <div className="line success">
              &gt; MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, {state.name.toUpperCase()}.
              <span className="caret">_</span>
            </div>
            <div style={{ marginTop: 18 }}>
              <button className="btn ghost" type="button" onClick={reset}>
                ENVIAR OTRO MENSAJE
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {showError && (
            <div className="form-error" role="alert">
              <span className="prompt">[ERROR]</span>
              No se pudo enviar el mensaje. Inténtalo de nuevo.
            </div>
          )}
          <div className="field">
            <label htmlFor="contact-name">NOMBRE</label>
            <input
              id="contact-name"
              name="name"
              value={fields.name}
              onChange={(e) => setFields({ ...fields, name: e.target.value })}
              placeholder="px_kai"
              autoComplete="name"
            />
          </div>
          <div className="field">
            <label htmlFor="contact-email">CORREO ELECTRÓNICO</label>
            <input
              id="contact-email"
              name="email"
              type="email"
              value={fields.email}
              onChange={(e) => setFields({ ...fields, email: e.target.value })}
              placeholder="jugador@vault.gg"
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label htmlFor="contact-message">MENSAJE</label>
            <textarea
              id="contact-message"
              name="message"
              rows={5}
              value={fields.message}
              onChange={(e) => setFields({ ...fields, message: e.target.value })}
              placeholder="Cuéntanos qué tienes en mente…"
            />
          </div>
          {/* Honeypot: invisible para personas, los bots lo rellenan. */}
          <input
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
          />
          <button
            className="btn xl press"
            type="submit"
            style={{ width: "100%" }}
            disabled={pending}
          >
            {pending ? "ENVIANDO…" : "▶  ENVIAR MENSAJE"}
          </button>
        </>
      )}
    </form>
  );
}
