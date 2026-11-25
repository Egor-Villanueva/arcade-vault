"use server";

import { Resend } from "resend";
import {
  validateContact,
  type ContactFields,
  type ContactState,
} from "@/lib/contact";

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function sendContactMessage(
  prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const input: ContactFields = {
    name: field(formData, "name"),
    email: field(formData, "email"),
    message: field(formData, "message"),
  };
  const name = input.name.trim();

  // Honeypot: un bot lo rellena. Se responde éxito sin enviar, sin dar pistas.
  if (field(formData, "website") !== "") {
    return { status: "success", name };
  }

  const errors = validateContact(input);
  if (Object.keys(errors).length > 0) {
    return { status: "invalid", errors };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;
  const missing = [
    !apiKey && "RESEND_API_KEY",
    !to && "CONTACT_TO_EMAIL",
    !from && "CONTACT_FROM_EMAIL",
  ].filter(Boolean);
  if (!apiKey || !to || !from) {
    console.error(
      `[contacto] Faltan variables de entorno: ${missing.join(", ")}`,
    );
    return { status: "error" };
  }

  const email = input.email.trim();
  const message = input.message.trim();
  // Sin saltos de línea en el asunto para evitar inyección de cabeceras.
  const safeName = name.replace(/[\r\n]+/g, " ");

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from,
      to,
      replyTo: email,
      subject: `[Arcade Vault] Mensaje de ${safeName}`,
      text: `Nombre: ${name}\nCorreo: ${email}\n\nMensaje:\n${message}`,
    });
    if (error) {
      console.error("[contacto] Resend devolvió un error:", error);
      return { status: "error" };
    }
  } catch (err) {
    console.error("[contacto] Fallo al enviar con Resend:", err);
    return { status: "error" };
  }

  return { status: "success", name };
}
