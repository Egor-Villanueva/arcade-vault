# SPEC 01 — MVP visual de Arcade Vault (todas las pantallas)

> **Estado:** Aprobado
> **Depende de:** Ninguna
> **Fecha:** 2026-11-22
> **Objetivo:** Portar a Next.js (App Router, TypeScript) las 5 pantallas de `references/templates/` (biblioteca, detalle, reproductor, auth y salón de la fama) como UI navegable con datos mock, sin implementar ningún juego real.

---

## Por qué existe esta spec

Las plantillas de `references/templates/` son un prototipo React con estado + hash (un solo HTML con Babel en el navegador). El proyecto es Next.js 16 con App Router y `cacheComponents`, y el CSS del tema ya está portado en `app/globals.css`. Esta spec fija cómo se traduce el prototipo a rutas reales y componentes tipados, para que los specs siguientes (juegos reales, auth real, backend) tengan una base estable.

## Alcance

**Dentro:**

- 5 rutas reales del App Router:
  - `/` → Biblioteca (hero, buscador, chips de categoría, grilla de tarjetas con efecto tilt).
  - `/juegos/[id]` → Detalle del juego (portada, tags, descripción, stats, top 10 de puntuaciones).
  - `/juegos/[id]/jugar` → Reproductor (HUD, marco CRT con arena CSS decorativa, pausa, FIN, modal de fin de juego).
  - `/auth` → Pantalla de acceso (pestañas "Iniciar sesión" / "Crear cuenta", invitado, botones sociales).
  - `/salon` → Salón de la Fama (pestañas por juego, podio top 3, tabla top 12).
- Navbar compartido en el layout (logo, links, contador de créditos estático, botón "Iniciar Sesión", menú móvil con panel lateral) y footer compartido.
- Datos mock tipados: 8 juegos y ranking determinístico (`seededScores`).
- Reproductor "placeholder": puntuación simulada que sube sola, vidas fijas, nivel derivado de la puntuación, pausa, FIN, modal de game over con "Guardar puntuación" a `localStorage`.
- Página 404 con estética del tema para ids de juego inexistentes.
- Diseño responsive según los breakpoints ya definidos en `globals.css` (840px, 900px, 720px).

**Fuera de alcance (para specs futuras):**

- Cualquier juego jugable real (Bloque Buster, Caída, etc.). El reproductor solo muestra un placeholder animado.
- Autenticación real o sesión: no hay `localStorage`/cookie de usuario, no hay validación de campos, el Nav nunca muestra un usuario logueado.
- Backend, base de datos, route handlers (`/api`) o Server Actions.
- Leer o mostrar en alguna pantalla las puntuaciones guardadas desde el reproductor.
- Fila "TU MEJOR MARCA" del Salón (depende de tener usuario).
- Login social funcional (Google / GitHub): los botones son decorativos.
- Panel "Tweaks" de las plantillas (estilos `.tw-*` quedan sin uso).
- Créditos dinámicos: el contador muestra `CRÉDITOS · 03` fijo.
- Tests automatizados (el proyecto no tiene runner configurado).
- Multijugador, i18n, modo claro.

## Modelo de datos

Estructuras nuevas, todas en memoria (sin persistencia salvo `av:scores:v1`).

```ts
// lib/games.ts
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type GameColor = "cyan" | "magenta" | "yellow" | "green";

export type Game = {
  id: string;            // slug: "bloque-buster", "caida", ...
  title: string;         // "BLOQUE BUSTER"
  short: string;         // descripción corta (tarjeta)
  long: string;          // descripción larga (detalle)
  cat: GameCategory;
  cover: string;         // clase CSS ya existente: "cover-bricks", "cover-tetro", ...
  color: GameColor;      // color del botón JUGAR en la tarjeta
  best: number;          // mejor puntuación global (mock)
  plays: string;         // "12.4K" (mock, ya formateado)
};

export const GAMES: Game[];                       // 8 juegos, mismo contenido que data.jsx
export const CATEGORIES: ["TODOS", ...GameCategory[]];
export function getGame(id: string): Game | undefined;

// lib/scores.ts
export type ScoreRow = { rank: number; name: string; score: number; date: string }; // date: "DD/MM/2026"
export function seededScores(seed: number, count?: number): ScoreRow[]; // determinístico, mismo algoritmo que data.jsx

// Persistencia del reproductor (solo escritura)
// localStorage["av:scores:v1"] = Array<{ game: string; score: number; name: string; at: number }>
```

Convenciones:

- `seededScores` es una función pura: misma semilla → mismo resultado en servidor y cliente (evita errores de hidratación).
- Semillas como en las plantillas: detalle `id.length * 17 + 3` con 10 filas; salón `id.length * 23 + 7` con 12 filas.
- Los números se formatean con `Intl.NumberFormat("es-ES")` desde un único helper `lib/format.ts` (`formatNumber`).
- Los textos de la UI están en español, igual que las plantillas.

## Estructura de archivos

```
app/
  layout.tsx                  (modifica: añade <Nav />, <main className="av-main">, <Footer />)
  page.tsx                    (reemplaza el scaffold: Biblioteca)
  not-found.tsx               (nuevo)
  auth/page.tsx               (nuevo)
  salon/page.tsx              (nuevo)
  juegos/[id]/page.tsx        (nuevo: detalle)
  juegos/[id]/jugar/page.tsx  (nuevo: reproductor)
components/
  nav.tsx            (client: estado del menú móvil + usePathname para link activo)
  footer.tsx         (server)
  library.tsx        (client: estado de búsqueda y categoría)
  game-card.tsx      (client: efecto tilt con mouse)
  leaderboard.tsx    (server: top 10 del detalle)
  auth-form.tsx      (client: pestañas y campos)
  hall-of-fame.tsx   (client: pestaña activa, podio y tabla)
  game-player.tsx    (client: HUD, simulación, pausa, modal)
lib/
  games.ts
  scores.ts
  format.ts
```

## Plan de implementación

Antes de empezar, leer en `node_modules/next/dist/docs/` las guías de `cacheComponents`, `generateStaticParams` y `notFound`, como exige `CLAUDE.md`.

1. Crear `lib/games.ts`, `lib/scores.ts` y `lib/format.ts` con los tipos y mocks del modelo de datos. Verificación: `npx tsc --noEmit` sin errores.
2. Crear `components/game-card.tsx` y `components/library.tsx` y reemplazar `app/page.tsx` por la Biblioteca. Verificación: `npm run dev`, abrir `/`, ver hero, 8 tarjetas, filtrar por texto y por categoría, estado vacío "NO HAY RESULTADOS".
3. Crear `components/leaderboard.tsx` y `app/juegos/[id]/page.tsx` con `generateStaticParams` para los 8 ids y `notFound()` para ids inválidos. Verificación: clic en una tarjeta abre `/juegos/<id>` con detalle y top 10.
4. Crear `components/hall-of-fame.tsx` y `app/salon/page.tsx`. Verificación: `/salon` muestra podio y 12 filas, cambiar de pestaña cambia los datos.
5. Crear `components/auth-form.tsx` y `app/auth/page.tsx`. Verificación: `/auth` alterna pestañas (el campo de correo aparece solo en "Crear cuenta"); enviar el formulario o pulsar "Jugar como invitado" navega a `/` sin guardar nada.
6. Crear `components/game-player.tsx` y `app/juegos/[id]/jugar/page.tsx`. Verificación: `/juegos/caida/jugar` muestra HUD con puntuación subiendo, PAUSA/REANUDAR, FIN abre el modal, "Guardar puntuación" escribe en `av:scores:v1`, "Jugar de nuevo" reinicia.
7. Crear `components/nav.tsx` y `components/footer.tsx` y montarlos en `app/layout.tsx`. Verificación: navbar visible en todas las rutas, link activo correcto (Biblioteca activo también en detalle y reproductor), menú móvil funciona a ≤840px.
8. Crear `app/not-found.tsx` con la estética del tema. Verificación: `/juegos/no-existe` muestra el 404 temático.
9. Ejecutar `npm run lint` y `npm run build` y corregir lo que falle.

## Criterios de aceptación

- [ ] `npm run build` termina sin errores y `npm run lint` sin errores.
- [ ] `/` muestra el hero "ARCADE VAULT" y exactamente 8 tarjetas de juego.
- [ ] En `/`, escribir "caí" en el buscador deja solo la tarjeta CAÍDA; escribir "zzz" muestra "NO HAY RESULTADOS".
- [ ] En `/`, el chip "SHOOTER" muestra exactamente INVASORES y ROCAS; "TODOS" vuelve a mostrar los 8.
- [ ] Hacer clic en una tarjeta o en su botón JUGAR navega a `/juegos/<id>`.
- [ ] `/juegos/<id>` muestra título, descripción larga, 3 stats (Partidas, Mejor global, Dificultad) y 10 filas de puntuaciones con las 3 primeras en dorado, plata y bronce.
- [ ] "▶ JUGAR AHORA" navega a `/juegos/<id>/jugar` y "VOLVER AL VAULT" navega a `/`.
- [ ] `/juegos/no-existe` y `/juegos/no-existe/jugar` muestran la página 404.
- [ ] En `/juegos/<id>/jugar` la puntuación aumenta sola; pulsar PAUSA la detiene y muestra "EN PAUSA"; REANUDAR la reanuda.
- [ ] Pulsar FIN abre el modal "FIN DEL JUEGO" con la puntuación final; el campo de iniciales acepta máx. 10 caracteres en mayúsculas y su valor inicial es "INVITADO".
- [ ] "GUARDAR PUNTUACIÓN" añade una entrada a `localStorage["av:scores:v1"]`, muestra "PUNTUACIÓN GUARDADA_" y oculta el formulario.
- [ ] "JUGAR DE NUEVO" cierra el modal y reinicia puntuación a 0, vidas a 3 y nivel a 01.
- [ ] SALIR en el reproductor navega a `/juegos/<id>`.
- [ ] Salir de `/juegos/<id>/jugar` (navegación) detiene el temporizador: no hay avisos de React en consola por actualizaciones tras desmontar.
- [ ] `/auth` alterna entre "INICIAR SESIÓN" y "CREAR CUENTA"; el campo "Correo electrónico" solo existe en la segunda pestaña.
- [ ] Enviar el formulario de `/auth` (incluso vacío) y pulsar "JUGAR COMO INVITADO" navegan a `/` y no escriben nada en `localStorage`.
- [ ] `/salon` muestra podio (02, 01, 03) y 12 filas; cambiar de pestaña de juego cambia los nombres y puntuaciones.
- [ ] `/salon` no muestra la fila "TU MEJOR MARCA".
- [ ] El navbar aparece en las 5 rutas con "Biblioteca" activo en `/`, `/juegos/<id>` y `/juegos/<id>/jugar`, y "Salón de la Fama" activo en `/salon`.
- [ ] El navbar siempre muestra el botón "Iniciar Sesión" que navega a `/auth`.
- [ ] A ≤840px los links y el contador de créditos se ocultan y aparece el botón ≡ que abre y cierra el panel lateral.
- [ ] El footer aparece en todas las rutas con el texto "© 2026 ARCADE VAULT · HECHO CON PIXELES Y NEÓN · v2.6.0".
- [ ] No hay errores de hidratación ni errores en la consola del navegador al cargar cada una de las 5 rutas.
- [ ] No queda ningún resto del scaffold de Create Next App en `app/page.tsx`.

## Decisiones tomadas y descartadas

- **Sí:** rutas reales del App Router (`/`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/auth`, `/salon`). URLs compartibles y idiomático en Next. **No:** una sola ruta con estado + hash (patrón del prototipo): ignora el router y rompe `cacheComponents`. **No:** slugs en español: se prioriza simplicidad y URLs estables.
- **Sí:** auth solo UI, sin sesión. El objetivo es la parte visual y una sesión falsa en `localStorage` habría que desmontarla cuando llegue la auth real. **No:** `av_user` en `localStorage` como en la plantilla. **No:** cookie (complejidad sin backend).
- **Sí:** réplica completa del reproductor placeholder, para dejar el marco CRT, HUD y modal listos cuando haya juegos reales. **No:** solo marco estático.
- **Sí:** guardar la puntuación en `localStorage` bajo `av:scores:v1` (clave versionada). Nada la lee todavía; se persiste para que la spec de ranking real pueda migrarla. **No:** clave `av_scores` sin versión de la plantilla.
- **Sí:** mocks tipados en `lib/` y Server Components por defecto; `"use client"` solo en nav, biblioteca, tarjeta, auth, salón y reproductor. **No:** port literal con todo client. **No:** `/api` simulado: añade alcance que el MVP no pide.
- **Sí:** el nivel del reproductor se deriva de la puntuación (`1 + floor(score / 2500)`). La plantilla lo incrementa con `score % 2500 < 100`, que puede dispararse varias veces seguidas o saltarse niveles. **No:** replicar esa condición.
- **Sí:** reutilizar el CSS de `app/globals.css` tal cual (clases `.av-*`, `.card`, `.btn`, etc.) en vez de reescribirlo con utilidades de Tailwind, para conservar fidelidad con el prototipo.
- **Sí:** `generateStaticParams` con los 8 ids más `notFound()` para el resto.
- **Sí:** vidas fijas en 3 en el reproductor (igual que la plantilla, nunca cambian).
- **No:** reordenar o rediseñar pantallas. Se porta el prototipo; cualquier mejora visual va en otra spec. Para detalles de estilo se sigue `/frontend-design` según `CLAUDE.md`.
- **No:** migrar las plantillas a Tailwind ni borrar `references/templates/` (se mantienen como referencia).

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| `cacheComponents` cambia la semántica de params y APIs dinámicas y puede romper `[id]` | Leer la guía en `node_modules/next/dist/docs/` antes del paso 3; usar `generateStaticParams` con los 8 ids. |
| Errores de hidratación por datos no determinísticos | `seededScores` es pura (sin `Math.random`/`Date.now`); la aleatoriedad del reproductor vive solo en un `useEffect` del cliente. |
| `Intl.NumberFormat("es-ES")` difiere entre servidor y navegador | Formatear siempre con el mismo helper `formatNumber`; si aparece una diferencia, fijar el locale y las opciones explícitamente. |
| Fuga del `setInterval` del reproductor al salir de la página | Limpiar el intervalo en el cleanup del `useEffect`; criterio de aceptación específico. |
| `localStorage` no disponible (modo privado, SSR) | Escribir solo dentro del handler de clic y con `try/catch`; si falla, se muestra igualmente "PUNTUACIÓN GUARDADA_" sin romper la UI. |
| El efecto tilt de la tarjeta no tiene sentido en táctil | Se mantiene `onMouseMove`/`onMouseLeave` (no se dispara en táctil); el clic sigue funcionando. |

## Qué **no** está en esta spec

- Ningún juego jugable real.
- Autenticación o sesión de cualquier tipo (ni `localStorage`, ni cookies, ni OAuth).
- Backend, `/api`, Server Actions o base de datos.
- Lectura/visualización de las puntuaciones guardadas, y la fila "TU MEJOR MARCA".
- Panel "Tweaks", créditos dinámicos, i18n, tema claro.
- Tests automatizados.

Cada uno de estos puntos, si se aborda, va en su propia spec.
