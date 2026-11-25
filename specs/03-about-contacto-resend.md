# SPEC 03 — Página "Acerca de" y formulario de contacto con Resend

> **Estado:** Implementado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-11-24
> **Objetivo:** Portar a Next.js la página "Acerca de" de `references/templates/home-about/about.jsx` como ruta `/acerca-de` y hacer que su formulario de contacto envíe un correo real mediante una Server Action y Resend.

---

## Por qué existe esta spec

La SPEC 02 dejó fuera `about.jsx` porque añade un formulario con estados propios (shake, terminal de éxito) y, ahora, un efecto real: enviar un correo. Esta spec cierra ese pendiente. Es la primera feature con código de servidor del proyecto (Server Action, variables de entorno, dependencia externa), por lo que fija las convenciones que usarán las specs de backend posteriores.

## Alcance

**Dentro:**

- Nueva ruta `/acerca-de` con el contenido de `about.jsx`, idéntico al de la plantilla:
  1. Hero `▸ ACERCA DE`, título "ACERCA DE ARCADE VAULT", párrafo de misión y 3 tarjetas destacadas con icono pixel SVG (`HEART` magenta, `BROWSER` cyan, `PLANT` verde).
  2. Banda divisoria con 24 píxeles animados (decorativa, `aria-hidden`).
  3. Sección `▸ CONTACTO`: título "CONTÁCTANOS", texto de introducción, 3 "tips" con LED ("RESPUESTA EN 24-48H", "SUGERENCIAS BIENVENIDAS", "SIN SPAM, JAMÁS") y el formulario.
- Formulario con campos NOMBRE, CORREO ELECTRÓNICO y MENSAJE, botón "▶  ENVIAR MENSAJE" y los mismos estados visuales que la plantilla: animación `shake` ante error de validación y terminal "VAULT-OS // TERMINAL" al enviar correctamente, con botón "ENVIAR OTRO MENSAJE".
- Server Action `sendContactMessage` que valida en servidor y envía el correo con el SDK `resend`.
- Estado de error de envío: si Resend falla, se muestra un mensaje de error con la estética del tema, el formulario conserva lo escrito y no se filtra el detalle del error al cliente.
- Protección anti-spam: campo honeypot oculto (`website`).
- Navbar: añadir el link "Acerca de" (`/acerca-de`) después de "Salón de la Fama", en escritorio y en el panel móvil, con link activo exclusivo en `/acerca-de`.
- Port del CSS del bloque `ABOUT PAGE` de `references/templates/home-about/styles.css` (líneas 1071–1150) a `app/globals.css`, incluidos sus `@keyframes` (`pxblink`, `shake`).
- Variables de entorno `RESEND_API_KEY`, `CONTACT_TO_EMAIL` y `CONTACT_FROM_EMAIL`, y un `.env.example` versionado.
- Reutilizar `components/reveal.tsx` de la SPEC 02 para las secciones con `reveal`.

**Fuera de alcance (para specs futuras):**

- Dominio propio verificado en Resend: se usa el remitente de pruebas `onboarding@resend.dev`.
- Rate limit por IP, CAPTCHA o cualquier protección distinta al honeypot.
- Reintentos automáticos de envío, cola de mensajes o guardar los mensajes en base de datos.
- Correo de confirmación o respuesta automática al visitante.
- Plantillas de correo con HTML/React Email: el cuerpo es texto plano.
- Adjuntos, selector de asunto o campos adicionales.
- Otros cambios en las rutas existentes, en el Home o en el footer.
- Panel "Tweaks", variantes de tema y los estilos `GAMEPAD` de la plantilla.
- Tests automatizados.

## Modelo de datos

No hay base de datos ni persistencia. Estructuras nuevas, solo en memoria:

```ts
// lib/contact.ts
export const CONTACT_LIMITS = { name: 60, email: 254, message: 2000 } as const;

export type ContactFields = { name: string; email: string; message: string };

export type ContactFieldErrors = Partial<Record<keyof ContactFields, string>>;

export type ContactState =
  | { status: "idle" }
  | { status: "success"; name: string }                       // name sin espacios sobrantes; la UI lo muestra en mayúsculas
  | { status: "invalid"; errors: ContactFieldErrors }         // validación fallida en servidor
  | { status: "error" };                                      // fallo de Resend u otra causa interna

export function validateContact(input: ContactFields): ContactFieldErrors; // pura; la usan cliente y servidor
```

```ts
// app/acerca-de/actions.ts  ("use server")
export async function sendContactMessage(
  prev: ContactState,
  formData: FormData,
): Promise<ContactState>;
```

Variables de entorno (solo servidor, nunca con prefijo `NEXT_PUBLIC_`):

| Variable | Uso | Ejemplo |
| --- | --- | --- |
| `RESEND_API_KEY` | Clave de la API de Resend | `re_xxxxxxxx` |
| `CONTACT_TO_EMAIL` | Quién recibe los mensajes. Con `onboarding@resend.dev` debe ser el correo dueño de la cuenta de Resend | `tu-correo@ejemplo.com` |
| `CONTACT_FROM_EMAIL` | Remitente. Por defecto, el de pruebas de Resend | `Arcade Vault <onboarding@resend.dev>` |

Reglas de validación (`validateContact`, idénticas en cliente y servidor):

- `name`: obligatorio tras `trim()`, máx. 60 caracteres.
- `email`: obligatorio tras `trim()`, máx. 254 caracteres y formato `algo@algo.algo` (regex simple, sin espacios).
- `message`: obligatorio tras `trim()`, máx. 2000 caracteres.

Contenido del correo enviado:

- `from`: `CONTACT_FROM_EMAIL`. `to`: `CONTACT_TO_EMAIL`. `replyTo`: el correo del visitante.
- `subject`: `[Arcade Vault] Mensaje de <nombre>`, con saltos de línea eliminados del nombre para evitar inyección de cabeceras.
- Cuerpo en texto plano (`text`): nombre, correo y mensaje. No se usa HTML, así que no hay nada que escapar.

Convenciones:

- Los textos de la UI están en español, igual que la plantilla.
- El honeypot es un `<input name="website">` fuera de pantalla (`tabIndex={-1}`, `autoComplete="off"`, `aria-hidden`). Si llega con valor, la acción devuelve `success` sin llamar a Resend, para no darle pistas al bot.
- El detalle del error de Resend se registra con `console.error` en el servidor; al cliente solo llega `{ status: "error" }`.

## Estructura de archivos

```
app/
  acerca-de/
    page.tsx                     (nuevo, server: hero, divisor y sección de contacto)
    actions.ts                   (nuevo: Server Action sendContactMessage)
  globals.css                    (modifica: añade el bloque ABOUT PAGE + estado de error del formulario)
components/
  nav.tsx                        (modifica: link "Acerca de" y link activo)
  contact-form.tsx               (nuevo, client: campos, shake, terminal de éxito, error)
  about-highlight-icon.tsx       (nuevo, server: iconos HEART, BROWSER, PLANT)
lib/
  contact.ts                     (nuevo: límites, tipos y validateContact)
.env.example                     (nuevo, versionado)
.gitignore                       (modifica: excepción !.env.example)
package.json                     (modifica: dependencia resend)
README.md                        (modifica: sección con las variables de entorno)
```

## Plan de implementación

Antes de empezar, leer en `node_modules/next/dist/docs/` las guías de Server Actions / `"use server"`, de `useActionState` y de variables de entorno, y revisar cómo interactúan con `cacheComponents`, como exige `CLAUDE.md`. Para detalles de estilo se sigue `/frontend-design` (según `CLAUDE.md`), manteniendo fidelidad con la plantilla.

1. Instalar `resend` (`npm install resend`), crear `.env.example` con las 3 variables, añadir `!.env.example` a `.gitignore` y documentar las variables en `README.md`. Crear `.env.local` (no versionado) con valores reales para probar. Verificación: `git status` muestra `.env.example` como nuevo y `.env.local` no aparece; `npx tsc --noEmit` sin errores.
2. Portar el bloque `ABOUT PAGE` de `references/templates/home-about/styles.css` (líneas 1071–1150) a `app/globals.css`. Buscar antes cada selector (`.about`, `.highlight`, `.tip`, `.contact-*`, `.terminal-success`, `.term-*`, `.dot`, `.prompt`, `.line`, `.caret`, `.shake`) para evitar colisiones con las clases existentes; en particular `@keyframes caret` ya existe en `globals.css` (línea ~788, con otro propósito), así que la animación del cursor de la terminal debe renombrarse si difiere. Añadir un estilo `.form-error` (borde y texto en `--magenta`) para el estado de error. Verificación: `npm run build` compila el CSS sin errores y `/biblioteca`, `/` y `/salon` no cambian visualmente.
3. Crear `lib/contact.ts` con `CONTACT_LIMITS`, los tipos y `validateContact`. Verificación: `npx tsc --noEmit` sin errores.
4. Crear `app/acerca-de/actions.ts`: leer `FormData`, comprobar el honeypot, validar con `validateContact`, verificar que existan las 3 variables de entorno (si falta alguna, `console.error` y `{ status: "error" }`), enviar con `new Resend(...).emails.send(...)` y devolver `success`, `invalid` o `error`. Verificación: `npx tsc --noEmit` sin errores.
5. Crear `components/about-highlight-icon.tsx` y `components/contact-form.tsx`. El formulario usa `useActionState(sendContactMessage, { status: "idle" })`, inputs controlados (para que React no los vacíe tras una acción fallida), `noValidate`, validación en cliente con `validateContact` que dispara `shake` (400 ms) sin llamar al servidor, estado `pending` que deshabilita el botón y cambia su texto a "ENVIANDO…", terminal de éxito con `GRACIAS, <NOMBRE EN MAYÚSCULAS>.` y bloque de error `[ERROR] No se pudo enviar el mensaje. Inténtalo de nuevo.` Verificación: `npx tsc --noEmit` y `npm run lint` sin errores.
6. Crear `app/acerca-de/page.tsx` con hero, divisor y sección de contacto, usando `<Reveal>` donde la plantilla usa `reveal` y la clase `fade-in` en el contenedor `about`. Verificación: `npm run dev`, `/acerca-de` se ve igual que la plantilla y el formulario envía un correo real que llega a `CONTACT_TO_EMAIL`.
7. Añadir el link "Acerca de" al navbar de escritorio y al panel móvil en `components/nav.tsx`, con link activo exclusivo en `/acerca-de`. Verificación: "Acerca de" activo en `/acerca-de` y ningún otro link activo en esa ruta.
8. Ejecutar `npm run lint` y `npm run build` y corregir lo que falle.

## Criterios de aceptación

- [ ] `npm run build` termina sin errores y `npm run lint` sin errores.
- [ ] `/acerca-de` muestra el título "ACERCA DE ARCADE VAULT", el párrafo de misión, exactamente 3 tarjetas destacadas y el título "CONTÁCTANOS".
- [ ] `/acerca-de` muestra los 3 tips ("RESPUESTA EN 24-48H", "SUGERENCIAS BIENVENIDAS", "SIN SPAM, JAMÁS") y la banda divisoria con 24 píxeles.
- [ ] El formulario tiene los campos NOMBRE, CORREO ELECTRÓNICO y MENSAJE y el botón "▶  ENVIAR MENSAJE".
- [ ] Enviar el formulario con cualquier campo vacío (o solo espacios) aplica la clase `shake` durante ~400 ms, no muestra la terminal y no se registra ninguna llamada a Resend.
- [ ] Un correo con formato inválido (p. ej. `abc`) también dispara el `shake` y no envía.
- [ ] Con datos válidos y credenciales correctas, aparece la terminal "VAULT-OS // TERMINAL" con "MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, <NOMBRE EN MAYÚSCULAS>." y llega un correo a `CONTACT_TO_EMAIL`.
- [ ] El correo recibido tiene el asunto `[Arcade Vault] Mensaje de <nombre>`, el nombre, el correo y el mensaje en el cuerpo, y al pulsar "Responder" el destinatario es el correo del visitante (`replyTo`).
- [ ] Mientras la acción está en curso el botón está deshabilitado y muestra "ENVIANDO…"; no se pueden enviar dos mensajes con doble clic.
- [ ] "ENVIAR OTRO MENSAJE" vuelve al formulario con los tres campos vacíos.
- [ ] Con una `RESEND_API_KEY` inválida o ausente se muestra el bloque `[ERROR] No se pudo enviar el mensaje. Inténtalo de nuevo.`, el formulario conserva lo escrito y no aparece la terminal de éxito.
- [ ] Ni la respuesta de la acción ni el HTML ni la consola del navegador contienen la clave de API ni el texto del error de Resend; el detalle solo aparece en el log del servidor.
- [ ] Una petición con el campo `website` relleno devuelve éxito en la UI sin llamar a Resend (sin correo recibido).
- [ ] Enviar directamente a la Server Action un nombre de 61 caracteres, un correo de 255 o un mensaje de 2001 devuelve `{ status: "invalid" }` y no envía.
- [ ] Un nombre con saltos de línea no altera las cabeceras: el asunto del correo recibido es de una sola línea.
- [ ] El navbar muestra "Inicio", "Biblioteca", "Salón de la Fama" y "Acerca de" en ese orden; "Acerca de" está activo solo en `/acerca-de` y ningún otro link lo está en esa ruta.
- [ ] El panel móvil (≤840px) incluye "Acerca de" y se cierra al pulsarlo.
- [ ] `.env.example` está versionado con las 3 variables y sin valores reales; `.env.local` no está versionado.
- [ ] `RESEND_API_KEY` no aparece en el bundle del cliente (`grep` en `.next/static` sin coincidencias).
- [ ] Las secciones con `reveal` empiezan ocultas y pasan a visibles al hacer scroll; con `prefers-reduced-motion: reduce` están visibles desde la carga.
- [ ] En 1280px, 900px, 820px y 390px de ancho no hay scroll horizontal en `/acerca-de`; `.contact-grid` pasa a 1 columna a ≤900px y `.highlight-row` a 1 columna a ≤820px.
- [ ] No hay errores de hidratación ni errores en la consola del navegador al cargar `/acerca-de`.
- [ ] `/`, `/biblioteca`, `/salon`, `/auth` y `/juegos/<id>` no cambian visualmente salvo por el nuevo link del navbar.

## Decisiones tomadas y descartadas

- **Sí:** ruta `/acerca-de`, en español como `/salon` y `/juegos`. **No:** `/about`: rompe la convención de rutas en español del proyecto.
- **Sí:** Server Action con `useActionState`. No expone un endpoint público que mantener, valida en servidor y es el patrón idiomático del App Router. **No:** Route Handler `POST /api/contacto`: añade `fetch` manual y manejo de JSON sin que haya otro cliente que lo necesite. Esta spec revierte la exclusión de Server Actions de las SPEC 01 y 02, que decía que irían en su propia spec.
- **Sí:** Resend con remitente `onboarding@resend.dev` y destinatario en variable de entorno. No exige dominio propio y deja el cambio a un dominio verificado como simple cambio de `CONTACT_FROM_EMAIL`. **No:** dominio verificado ahora: requiere configurar DNS antes de poder implementar. **Limitación conocida:** con el remitente de pruebas Resend solo entrega al correo dueño de la cuenta.
- **Sí:** destinatario en `CONTACT_TO_EMAIL` y no escrito en el código: la dirección no se versiona y se cambia por entorno.
- **Sí:** `replyTo` = correo del visitante, para poder contestar con "Responder". **No:** usar el correo del visitante como `from`: Resend lo rechaza y suplantaría un dominio ajeno.
- **Sí:** cuerpo en texto plano. Elimina el riesgo de inyección HTML y no requiere React Email. **No:** plantilla HTML: mejora visual que no aporta valor en un correo interno.
- **Sí:** validación en servidor más honeypot, con el mismo `validateContact` en cliente y servidor. Sin dependencias extra (no Zod). El cliente es solo comodidad (dispara el `shake`); el servidor es la autoridad. **No:** validar solo lo que hace la plantilla (campos vacíos): cualquier bot gastaría la cuota de Resend. **No:** rate limit ni CAPTCHA: sin Redis/KV el límite en memoria no es fiable en serverless; va en otra spec si hay abuso.
- **Sí:** el honeypot responde `success` sin enviar, para que el bot no sepa que fue descartado.
- **Sí:** `noValidate` y validación propia para conservar el `shake` de la plantilla. **No:** validación nativa del navegador: muestra burbujas que ignoran el tema.
- **Sí:** ante fallo de Resend, mensaje de error genérico, formulario con lo escrito y detalle solo en el log del servidor. **No:** reintento automático: complejidad que un MVP no necesita; el usuario puede reintentar a mano.
- **Sí:** inputs controlados. React 19 vacía los formularios no controlados tras ejecutar una acción, lo que borraría el mensaje del visitante justo cuando falla el envío.
- **Sí:** reutilizar `Reveal` de la SPEC 02. **No:** replicar el `useEffect` con `document.querySelectorAll(".reveal")` de `about.jsx`, por las mismas razones de la SPEC 02.
- **Sí:** respetar `prefers-reduced-motion` también en el `shake` (sin animación) además del `reveal`. Añadido de accesibilidad de bajo coste que no está en la plantilla.
- **Sí:** el link "Acerca de" va al final del navbar, después de "Salón de la Fama", como en la plantilla.
- **Sí:** terminal de éxito fiel a la plantilla, incluyendo las líneas `[OK]` decorativas, aunque el envío ya ocurrió (no son un progreso real). Es parte de la identidad visual.
- **No:** rediseñar la página. Se porta la plantilla; las mejoras visuales van en otra spec.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Con `onboarding@resend.dev` Resend solo entrega al correo de la cuenta; poner otro destinatario devuelve error 403 | Documentado en `README.md` y `.env.example`; el criterio de aceptación de envío se prueba con ese correo. El paso a dominio propio es solo cambiar variables. |
| Falta alguna variable de entorno en el despliegue | La acción lo detecta, registra qué variable falta (sin valores) y devuelve `{ status: "error" }`; el usuario ve el mensaje genérico. |
| Fuga de la clave de API al cliente | Solo se lee en `actions.ts` (servidor), sin prefijo `NEXT_PUBLIC_`; criterio de aceptación con `grep` sobre `.next/static`. |
| Inyección de cabeceras vía nombre con saltos de línea | El asunto elimina `\r` y `\n` del nombre; el cuerpo es texto plano. Criterio de aceptación específico. |
| Abuso del formulario (bots, spam) que agota la cuota gratuita de Resend | Honeypot y límites de longitud. Rate limit y CAPTCHA quedan fuera y se revisan si aparece abuso real. |
| `.gitignore` ya excluye `.env*`, incluido `.env.example` | El paso 1 añade la excepción `!.env.example` y lo verifica con `git status`. |
| `@keyframes caret` ya existe en `globals.css` con otro propósito y el del bloque About podría sobrescribirlo | Paso 2: comparar ambas definiciones antes de pegar y renombrar la del About si difieren. |
| `cacheComponents` y las Server Actions: una página con formulario y `Reveal` cliente podría interactuar mal con el prerender | La página es estática (el formulario es un componente cliente); se lee la guía antes del paso 4 y se verifica con `npm run build`. |
| Doble envío por doble clic o por reintento tras un error lento | El botón se deshabilita mientras `pending`. No hay idempotencia en servidor: aceptado en el MVP. |
| El correo cae en spam al usarse el remitente compartido de pruebas | Aceptado en el MVP; se resuelve con dominio verificado en una spec futura. |

## Cambios añadidos durante la implementación (fuera del alcance original)

Surgieron al verificar los criterios de aceptación y se aprobaron durante la implementación. Todos son ajustes de CSS o de `components/nav.tsx`, sin lógica nueva.

- **Link "Inicio" en el navbar** (`components/nav.tsx`): el criterio de aceptación del navbar lo exigía, pero el navbar de la SPEC 02 solo tenía el logo apuntando a `/`. Se añade "Inicio" antes de "Biblioteca", en escritorio y en el panel móvil, activo solo en `/` exacto.
- **Navbar compacto en anchos medios** (`app/globals.css`): con 4 links el navbar desbordaba entre 841 y ~1000 px y partía los textos en dos líneas. Para anchos ≤1100px se reducen separación y relleno, se aplica `white-space: nowrap` a los links y se oculta el contador "CRÉDITOS · 03". Para ≤900px el relleno se reduce algo más.
- **Navbar a ≤840px** (`app/globals.css`): el logo, "Iniciar Sesión" y la hamburguesa sumaban 403 px a 390 px de ancho y provocaban scroll horizontal en todas las rutas. Se reduce el `gap` a 12px y se quita el `margin-left` del botón de acceso.
- **Cabecera de la tabla del Salón de la Fama** (`app/globals.css`): a ≤720px la cabecera "PUNTUACIÓN" no cabía en su columna y `/salon` desbordaba 11 px a 390 px. Se reduce la fuente de la cabecera (`.hall-table .th`) a 8px con menos espaciado entre letras.

Efecto en otras pantallas: el navbar compartido cambia de aspecto en ≤1100px (sin contador de créditos) en todas las rutas, y `/salon` cambia solo en su cabecera de tabla a ≤720px.

## Qué **no** está en esta spec

- Dominio propio verificado en Resend ni configuración DNS.
- Rate limit, CAPTCHA o reintentos automáticos.
- Almacenamiento de mensajes en base de datos o panel para leerlos.
- Correo de confirmación al visitante y plantillas HTML.
- Cambios al Home, a la Biblioteca o al resto de pantallas, salvo el link del navbar.
- Sesión de usuario, autenticación real o prellenado del formulario con datos de cuenta.
- Tests automatizados.

Cada uno de estos puntos, si se aborda, va en su propia spec.
