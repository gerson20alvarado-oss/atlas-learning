/**
 * config/env.public.js
 *
 * Configuración pública, no-secreta, embebida en el build.
 * Software Architecture §19.2: solo valores públicos, no-secretos,
 * pueden vivir aquí — nunca una credencial de servicio ni nada capaz
 * de escribir datos como un usuario arbitrario.
 *
 * En Sprint 1 no existe Auth ni Sync (llegan en Sprint 6), así que
 * los valores de Supabase quedan como placeholders explícitos. No se
 * inventa una forma "por si acaso" — Wireframe Review: "el silencio
 * es una decisión de diseño válida", aplicado aquí a configuración.
 */

export const envPublic = Object.freeze({
  // Placeholder — se completa en Sprint 6 (Authentication).
  // Cuando exista, será la clave pública "anon" de Supabase, segura
  // para exponerse en un build estático — nunca una service key.
  supabaseUrl: null,
  supabaseAnonKey: null,
});
