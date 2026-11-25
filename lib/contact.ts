export const CONTACT_LIMITS = { name: 60, email: 254, message: 2000 } as const;

export type ContactFields = { name: string; email: string; message: string };

export type ContactFieldErrors = Partial<Record<keyof ContactFields, string>>;

export type ContactState =
  | { status: "idle" }
  | { status: "success"; name: string } // name sin espacios sobrantes; la UI lo muestra en mayúsculas
  | { status: "invalid"; errors: ContactFieldErrors } // validación fallida en servidor
  | { status: "error" }; // fallo de Resend u otra causa interna

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Pura: la usan el cliente (para el shake) y el servidor (autoridad). */
export function validateContact(input: ContactFields): ContactFieldErrors {
  const errors: ContactFieldErrors = {};
  const name = input.name.trim();
  const email = input.email.trim();
  const message = input.message.trim();

  if (!name) errors.name = "El nombre es obligatorio.";
  else if (name.length > CONTACT_LIMITS.name)
    errors.name = `Máximo ${CONTACT_LIMITS.name} caracteres.`;

  if (!email) errors.email = "El correo es obligatorio.";
  else if (email.length > CONTACT_LIMITS.email)
    errors.email = `Máximo ${CONTACT_LIMITS.email} caracteres.`;
  else if (!EMAIL_REGEX.test(email)) errors.email = "El correo no es válido.";

  if (!message) errors.message = "El mensaje es obligatorio.";
  else if (message.length > CONTACT_LIMITS.message)
    errors.message = `Máximo ${CONTACT_LIMITS.message} caracteres.`;

  return errors;
}
