## Arcade Vault

Es una plataforma para jugar online y competir por la mayor cantidad de puntos.

## Usa Spec Driven Design

Basado en /spec y /spec-impl

Siguiendo las buenas practicas recomendadas aquí:
https://github.com/Klerith/fernando-skills

## Skills usadas

```bash
npx skills@latest add Klerith/fernando-skills
```

## Commands

```bash
npm run dev     # next dev
npm run build   # next build
npm run start   # next start
npm run lint    # eslint (flat config, eslint.config.mjs)
```

## Variables de entorno

Copia `.env.example` a `.env.local` y rellena los valores. Son solo de servidor (nunca uses el prefijo `NEXT_PUBLIC_`).

| Variable | Uso |
| --- | --- |
| `RESEND_API_KEY` | Clave de la API de [Resend](https://resend.com/api-keys). |
| `CONTACT_TO_EMAIL` | Quién recibe los mensajes del formulario de `/acerca-de`. |
| `CONTACT_FROM_EMAIL` | Remitente. Por defecto `Arcade Vault <onboarding@resend.dev>`. |

> **Limitación:** con el remitente de pruebas `onboarding@resend.dev`, Resend solo entrega al correo dueño de la cuenta. Cualquier otro destinatario devuelve error 403. Para enviar a otros correos hay que verificar un dominio propio y cambiar `CONTACT_FROM_EMAIL`.
