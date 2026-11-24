import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="fade-in"
      style={{ textAlign: "center", padding: "96px 24px", maxWidth: 640, margin: "0 auto" }}
    >
      <div
        className="pixel neon-magenta"
        style={{ fontSize: "clamp(40px, 10vw, 88px)", letterSpacing: "0.06em" }}
      >
        404
      </div>
      <h1
        className="pixel neon-cyan"
        style={{ fontSize: "clamp(14px, 2.6vw, 22px)", margin: "24px 0 0", letterSpacing: "0.12em" }}
      >
        NIVEL NO ENCONTRADO
      </h1>
      <p style={{ color: "var(--ink-dim)", margin: "20px 0 32px", lineHeight: 1.7 }}>
        Esta pantalla no existe o el juego que buscas no está en el Vault.
      </p>
      <Link className="btn lg" href="/biblioteca">
        VOLVER A LA BIBLIOTECA
      </Link>
    </div>
  );
}
