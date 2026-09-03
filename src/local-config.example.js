// Copiá este archivo como src/local-config.js (está ignorado por Git).
window.RESET_ON_BOOT = false;
window.SUPABASE_CONFIG = {
  url: "https://TU-PROYECTO.supabase.co",
  anonKey: "TU_ANON_KEY_PUBLICA",
};
// Endpoint opcional same-origin o de una Edge Function de Supabase.
// No incluyas secretos: el navegador envía eventos directamente.
window.OBSERVABILITY_CONFIG = {
  endpoint: "",
  sampleRate: 1,
  heartbeatMs: 300000,
};
