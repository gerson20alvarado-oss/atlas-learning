/**
 * config/env.public.js
 *
 * Configuración pública, no-secreta, embebida en el build.
 * Software Architecture §19.2: solo valores públicos, no-secretos,
 * pueden vivir aquí — nunca una credencial de servicio ni nada capaz
 * de escribir datos como un usuario arbitrario.
 *
 * Sprint 6 (Authentication) ya consume estos dos valores
 * (auth/adapters/supabase-auth-adapter.js,
 * remote-account-snapshot/adapters/supabase-account-snapshot-adapter.js)
 * pero siguen en `null` aquí: ningún proyecto Supabase real fue
 * provisto durante este sprint, y no se inventa un valor de relleno
 * — "el silencio es una decisión de diseño válida" aplicado a
 * configuración. Completar estos dos valores con los de un proyecto
 * Supabase real es una decisión operativa/de despliegue, no de
 * código — ningún archivo de `auth/` ni de `remote-account-snapshot/`
 * necesita cambiar cuando eso ocurra.
 */

export const envPublic = Object.freeze({
  supabaseUrl: "https://malfoakgbhjmeobamhrn.supabase.co",
  supabaseAnonKey: "sb_publishable_8RiV5oThVATRDPiCncWDRw_CpQktBRg",
});
