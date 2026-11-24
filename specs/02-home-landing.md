# SPEC 02 — Home (landing) de Arcade Vault

> **Estado:** Implementado
> **Depende de:** SPEC 01
> **Fecha:** 2026-11-23
> **Objetivo:** Portar a Next.js la página Home de `references/templates/home-about/` como nueva ruta `/`, moviendo la Biblioteca a `/biblioteca`.

---

## Por qué existe esta spec

La SPEC 01 dejó la Biblioteca en `/`, que es lo único que ve quien llega al sitio. La plantilla `home-about` define una landing completa (hero, propuesta de valor, juegos destacados, estadísticas, actividad, precios y CTA final) y separa `home` de `biblioteca`. Esta spec añade esa landing como raíz del sitio y reubica la Biblioteca, lo que obliga a revisar todos los enlaces y el link activo del navbar que hoy apuntan a `/`.

## Alcance

**Dentro:**

- Nueva ruta `/` con el Home, compuesto por 7 bloques de la plantilla:
  1. Hero: eyebrow "INSERTA UNA MONEDA_", título en 3 líneas, subtítulo, CTAs "EXPLORAR JUEGOS" y "CREAR CUENTA", indicador "DESLIZA" y 8 siluetas pixel flotantes decorativas.
  2. `// 01 ¿POR QUÉ ARCADE VAULT?`: 4 tarjetas de características con icono pixel SVG.
  3. `// 02 JUEGOS DISPONIBLES AHORA`: carrusel de 6 mini-tarjetas (primeros 6 de `GAMES`) y botón "VER TODOS LOS JUEGOS →".
  4. Banda de estadísticas: "12+ JUEGOS", "MILES DE PARTIDAS", "GLOBAL RANKING".
  5. `// 03 ACTIVIDAD EN VIVO`: ticker "ÚLTIMAS PUNTUACIONES" (7 filas) y "TOP JUGADORES · HOY" (5 filas) con enlace "VER SALÓN →".
  6. `// 04 PRECIOS`: tarjeta "JUGADOR VAULT $0 / SIEMPRE" y 3 preguntas frecuentes en texto plano.
  7. CTA final "¿LISTO PARA JUGAR?" con botón "INSERTAR MONEDA →".
- Nueva ruta `/biblioteca` con el contenido que hoy tiene `/` (hero `av-hero` + `<Library />`), sin cambios funcionales.
- Animación "reveal" al hacer scroll con `IntersectionObserver`, desactivada con `prefers-reduced-motion`.
- Navbar: añadir el link "Inicio" (`/`) antes de "Biblioteca" (`/biblioteca`), en el menú de escritorio y en el panel móvil. El logo sigue apuntando a `/`.
- Actualizar los enlaces existentes que apuntaban a la Biblioteca en `/` para que apunten a `/biblioteca`.
- Port del CSS del Home desde `references/templates/home-about/styles.css` a `app/globals.css`.
- Datos mock tipados en `lib/home.ts`; los juegos del carrusel salen de `GAMES`.

**Fuera de alcance (para specs futuras):**

- Página "Acerca de" y formulario de contacto (`about.jsx`): irá en su propia spec; el navbar no tendrá link "Acerca de".
- Datos reales: la actividad y el top "hoy" son constantes, no cambian ni se actualizan en vivo.
- Leer las puntuaciones guardadas en `localStorage` (`av:scores:v1`) para mostrarlas en el Home.
- Estado de sesión en el navbar (el botón sigue siendo "Iniciar Sesión").
- Acordeón en las FAQ, pasarela de pago o planes distintos al "Plan único".
- Metadatos SEO avanzados (Open Graph, sitemap, JSON-LD).
- Panel "Tweaks", variantes de tema (`styles.css` líneas "Theme variants") y los estilos `GAMEPAD` de la plantilla: no se portan.
- Tests automatizados.

## Modelo de datos

Estructuras nuevas, solo constantes en memoria. No hay persistencia.

```ts
// lib/home.ts
import type { GameColor } from "@/lib/games";

export type HomeFeature = {
  icon: "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET";
  title: string;        // "JUEGOS CLÁSICOS"
  description: string;
  color: GameColor;     // clase de color de la tarjeta: cyan | yellow | magenta | green
};

export type HomeStat = { value: string; unit: string; sub: string }; // "12+", "JUEGOS", "Y CONTANDO"

export type RecentScore = {
  player: string;       // "NEONFOX"
  game: string;         // "Caída" (texto libre, igual que la plantilla)
  score: number;        // 184220
  ago: string;          // "hace 2 min"
  color: GameColor;     // color del nombre del jugador
};

export type TopPlayer = { rank: number; player: string; score: number };

export type FaqItem = { question: string; answer: string };

export const HOME_FEATURES: HomeFeature[];      // 4 elementos
export const HOME_STATS: HomeStat[];            // 3 elementos
export const RECENT_SCORES: RecentScore[];      // 7 elementos
export const TOP_PLAYERS_TODAY: TopPlayer[];    // 5 elementos
export const PRICING_PERKS: string[];           // 6 elementos de la lista ✔
export const HOME_FAQ: FaqItem[];               // 3 elementos
```

Convenciones:

- El contenido es la copia literal de los arrays de `home.jsx` (mismos textos, nombres y puntuaciones), con tipos.
- Las puntuaciones se formatean con `formatNumber` de `lib/format.ts` (no con `toLocaleString`), para evitar diferencias servidor/cliente.
- El carrusel usa `GAMES.slice(0, 6)` de `lib/games.ts`; no se duplican datos de juegos.
- Los textos de la UI están en español, igual que la plantilla.

## Estructura de archivos

```
app/
  page.tsx                       (reemplaza: ahora es el Home)
  biblioteca/page.tsx            (nuevo: hero + <Library />, contenido que tenía app/page.tsx)
  globals.css                    (modifica: añade estilos del Home)
  juegos/[id]/page.tsx           (modifica: "VOLVER AL VAULT" → /biblioteca)
  salon/page.tsx                 (modifica: botón que apunta a "/" → /biblioteca)
  not-found.tsx                  (modifica: botón que apunta a "/" → /biblioteca)
components/
  nav.tsx                        (modifica: link "Inicio", rutas y link activo)
  auth-form.tsx                  (modifica: redirecciones y botón de invitado → /biblioteca)
  game-player.tsx                (modifica: enlace a "/" → /biblioteca)
  reveal.tsx                     (nuevo, client: envoltorio con IntersectionObserver)
  home-silhouettes.tsx           (nuevo, server: 8 SVG decorativos)
  home-feature-icon.tsx          (nuevo, server: 4 iconos pixel)
  home-mini-card.tsx             (nuevo, server: mini-tarjeta con <Link>)
lib/
  home.ts                        (nuevo)
```

## Plan de implementación

Antes de empezar, leer en `node_modules/next/dist/docs/` la guía de `cacheComponents` y la de `Link`/navegación, como exige `CLAUDE.md`. Para detalles de estilo se sigue `/frontend-design` (según `CLAUDE.md`), manteniendo fidelidad con la plantilla.

1. Mover la Biblioteca: crear `app/biblioteca/page.tsx` con el contenido actual de `app/page.tsx`. Actualizar `components/nav.tsx` (`sectionOf` y hrefs de "Biblioteca" a `/biblioteca`) y los enlaces de `app/juegos/[id]/page.tsx`, `app/salon/page.tsx`, `app/not-found.tsx`, `components/auth-form.tsx` y `components/game-player.tsx` a `/biblioteca`. `/` sigue mostrando la Biblioteca temporalmente. Verificación: `npm run dev`, `/biblioteca` funciona igual que antes y todos los enlaces del paso llevan a `/biblioteca`.
2. Portar el CSS del Home a `app/globals.css`: bloques "HOME PAGE" (con `.reveal`), "ACTIVITY (leaderboard + ticker)" y "PRICING" de `references/templates/home-about/styles.css`, sin los bloques About, GAMEPAD ni Theme variants. Verificar que `@keyframes` usados (`float`, etc.) existan y que no haya colisión con clases ya definidas (`.final-title`, `.stat-*`, `.kicker`). Verificación: `npm run build` compila el CSS sin errores y `/biblioteca` no cambia visualmente.
3. Crear `lib/home.ts` con tipos y constantes del modelo de datos. Verificación: `npx tsc --noEmit` sin errores.
4. Crear `components/reveal.tsx` (client; añade la clase `in` al entrar en viewport con umbral 0.12 y desobserva; si `prefers-reduced-motion: reduce`, la añade de inmediato). Crear `components/home-silhouettes.tsx`, `components/home-feature-icon.tsx` y `components/home-mini-card.tsx` portando el JSX de la plantilla a TypeScript. Verificación: `npx tsc --noEmit` sin errores.
5. Reemplazar `app/page.tsx` por el Home con los 7 bloques, usando `<Link className="btn ...">` en vez de `<button onClick>` y `<Reveal>` en las secciones con `reveal`. Verificación: `npm run dev`, `/` muestra los 7 bloques y los CTAs navegan a `/biblioteca`, `/auth`, `/juegos/<id>` y `/salon`.
6. Añadir el link "Inicio" (`/`) al navbar de escritorio y al panel móvil en `components/nav.tsx`, con link activo exclusivo en `/`. Verificación: "Inicio" activo en `/`, "Biblioteca" activo en `/biblioteca`, `/juegos/<id>` y `/juegos/<id>/jugar`.

## Criterios de aceptación

- [ ] `npm run build` termina sin errores y `npm run lint` sin errores.
- [ ] `/` muestra el hero con el título "EL ARCADE / CLÁSICO ESTÁ / DE VUELTA" y los botones "EXPLORAR JUEGOS" y "CREAR CUENTA".
- [ ] `/` no muestra el buscador, los chips de categoría ni la grilla de la Biblioteca.
- [ ] `/` contiene exactamente 4 tarjetas de características, 6 mini-tarjetas de juego, 3 bloques de estadísticas, 7 filas de "ÚLTIMAS PUNTUACIONES", 5 filas de "TOP JUGADORES · HOY" y 3 preguntas frecuentes.
- [ ] Las 6 mini-tarjetas son los 6 primeros juegos de `GAMES` y hacer clic en cada una navega a `/juegos/<id>`.
- [ ] "EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS →" e "INSERTAR MONEDA →" navegan a `/biblioteca`.
- [ ] "CREAR CUENTA" y "EMPEZAR GRATIS →" navegan a `/auth`; "VER SALÓN →" navega a `/salon`.
- [ ] Las puntuaciones del ticker y del top se muestran con separador de miles en español (p. ej. `+184.220` y `312.840`).
- [ ] La fila #1 del top tiene la clase `top1`, la #2 `top2` y la #3 `top3`.
- [ ] `/biblioteca` muestra el hero "ARCADE VAULT", el buscador, los chips y exactamente 8 tarjetas, con el mismo comportamiento de filtros que la SPEC 01.
- [ ] El navbar muestra "Inicio", "Biblioteca" y "Salón de la Fama" en ese orden; "Inicio" está activo solo en `/`, "Biblioteca" en `/biblioteca`, `/juegos/<id>` y `/juegos/<id>/jugar`, y ninguno de los dos está activo en `/salon`.
- [ ] El logo del navbar navega a `/`.
- [ ] El panel móvil (≤840px) incluye "Inicio" y se cierra al pulsarlo.
- [ ] "VOLVER AL VAULT" en `/juegos/<id>`, el botón de `/salon`, el del 404 y el enlace de `game-player.tsx` navegan a `/biblioteca`.
- [ ] Enviar el formulario de `/auth` y pulsar "JUGAR COMO INVITADO" navegan a `/biblioteca`.
- [ ] Las secciones con `reveal` empiezan ocultas y pasan a visibles (`.reveal.in`) al hacerse visibles con scroll; con `prefers-reduced-motion: reduce` están visibles desde la carga.
- [ ] En 1280px, 840px y 390px de ancho no hay scroll horizontal en `/` y las grillas colapsan según los `@media` de la plantilla (4 → 2 → 1 columnas en características; 6 → 3 → 2 en el carrusel).
- [ ] No hay errores de hidratación ni errores en la consola del navegador al cargar `/` y `/biblioteca`.
- [ ] No quedan referencias a `href="/"` ni `router.push("/")` que pretendan llevar a la Biblioteca (solo el logo y "Inicio" apuntan a `/`).

## Decisiones tomadas y descartadas

- **Sí:** Home en `/` y Biblioteca en `/biblioteca`. Es lo que hace la plantilla (rutas `home` y `biblioteca`) y deja la raíz como landing. **No:** Home en `/inicio` con la Biblioteca en `/`: evita tocar enlaces pero la landing no sería la raíz del sitio.
- **Sí:** solo Home en esta spec. El pedido dice "home page" y "Acerca de" + contacto añade un formulario con estados propios (shake, terminal de éxito). **No:** incluir `/acerca-de` aquí; va en otra spec.
- **Sí:** constantes mock tipadas en `lib/home.ts` con el contenido literal de la plantilla. Conserva nombres y tiempos y no exige inventar reglas. **No:** derivar actividad y top de `GAMES` y `seededScores`.
- **Sí:** el carrusel reutiliza `GAMES.slice(0, 6)` en lugar de duplicar datos de juegos.
- **Sí:** reveal fiel a la plantilla con `IntersectionObserver`, encapsulado en un componente `Reveal` cliente que observa su propio nodo. **No:** replicar `useReveal` con `document.querySelectorAll(".reveal")`, que en React rompe con la navegación cliente y observa nodos que no le pertenecen.
- **Sí:** respetar `prefers-reduced-motion` mostrando todo de inmediato (la plantilla no lo hace; es un añadido de accesibilidad de bajo coste).
- **Sí:** FAQ y precios estáticos, sin acordeón, como en la plantilla.
- **Sí:** los botones que navegan son `<Link className="btn ...">` en vez de `<button onClick>`, igual que ya hace la SPEC 01. Mantiene HTML semántico y prefetch.
- **Sí:** tras enviar `/auth` o pulsar "JUGAR COMO INVITADO", se navega a `/biblioteca` en vez de `/`. Quien acaba de entrar quiere jugar, no volver a la landing. **No:** dejar `/` (sería un cambio de comportamiento accidental respecto a la SPEC 01, que decía "navega a la Biblioteca").
- **Sí:** el Home es un Server Component; `"use client"` solo en `reveal.tsx`. Los datos son constantes de módulo, sin APIs dinámicas, así que encajan con `cacheComponents` sin Suspense.
- **No:** portar los bloques About, GAMEPAD, Theme variants ni `.tw-*` del CSS de la plantilla.
- **No:** rediseñar secciones. Se porta la plantilla; las mejoras visuales van en otra spec.
- **Sí:** esta spec supersede los criterios de la SPEC 01 que decían que `/` es la Biblioteca y que "Biblioteca" está activo en `/`. La SPEC 01 conserva el estado "Implementado" porque describe lo que se entregó en su momento.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Colisión de nombres de clase CSS al portar (`.final-title`, `.stat-*`, `.kicker`, `.ticker`) con las ya existentes en `globals.css` | Paso 2: buscar cada selector antes de pegar; verificar que `/biblioteca`, `/juegos/<id>`, `/salon` y el reproductor no cambian visualmente. |
| Las secciones `.reveal` parten de `opacity: 0`; sin JS o antes de hidratar el contenido queda oculto en el HTML inicial | Aceptado para el MVP; el hero no usa `reveal`, así que lo primero visible siempre se ve. Con `prefers-reduced-motion` se muestra todo. |
| `@keyframes float` u otros usados por las siluetas no existen en `globals.css` | Paso 2: comprobar los keyframes referenciados y portarlos si faltan. |
| Enlaces a `/` olvidados tras mover la Biblioteca | Paso 1 enumera los 5 archivos conocidos y un criterio de aceptación exige que solo el logo e "Inicio" apunten a `/`. |
| Rutas guardadas o compartidas hacia `/` como Biblioteca dejan de abrirla | Aceptado: el proyecto está en MVP sin tráfico real; no se añade redirección. |
| El hero con título grande y siluetas absolutas desborda en móvil | Criterio de aceptación de no-scroll horizontal en 390px; los `@media` de la plantilla se portan sin cambios. |

## Qué **no** está en esta spec

- Página "Acerca de" y formulario de contacto.
- Datos reales o en vivo para actividad, top y estadísticas.
- Sesión de usuario o créditos dinámicos en el navbar.
- Lectura de las puntuaciones guardadas en `localStorage`.
- Backend, `/api`, Server Actions o base de datos.
- Panel "Tweaks", variantes de tema, i18n, modo claro.
- Tests automatizados.

Cada uno de estos puntos, si se aborda, va en su propia spec.
