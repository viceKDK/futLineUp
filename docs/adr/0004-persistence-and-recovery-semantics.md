# ADR 0004 — Semántica de persistencia y recuperación

**Estado:** aceptado.

Ediciones normales pueden degradar a memoria cuando storage falla, manteniendo la sesión utilizable y emitiendo diagnóstico. Operaciones destructivas como importación usan escritura estricta y rollback best-effort.

No se llama "transacción" a una garantía que `localStorage` no ofrece frente a crash/concurrencia. Si falla el rollback, el error lo declara. Backups automáticos separan policy/scheduler de IndexedDB. Cloud sync separa caso de uso de Supabase y mantiene detección de conflictos mediante versión remota/último sync.
