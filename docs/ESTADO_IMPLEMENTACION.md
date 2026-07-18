# Estado de implementación

Fecha: 2026-07-17

## Implementado

- Persistencia completa de alineaciones: titulares, posiciones libres, suplentes, capitán y kit.
- Reapertura y duplicación de equipos.
- Edición ampliada de jugadores con posición secundaria y pierna hábil.
- Asignación rápida con toque/click como alternativa al drag and drop.
- Backup JSON versionado, importación y carga rápida de planteles pegando texto.
- Enlaces de alineación autocontenidos mediante snapshots codificados en la URL.
- Sorteo Fisher–Yates y verificación de balance sin duplicados.
- Perfil de uso: Amigos, Entrenador o Liga amateur.
- Modo Entrenador: ficha, sesiones, asistencia, evaluaciones, fortalezas, mejoras y objetivos.
- Modo Liga: calendario, resultados y tabla calculada con desempate por diferencia de gol.
- Cuenta y datos: Google Login opcional, modo invitado y sincronización de backup entre dispositivos.
- Esquema Supabase con tablas normalizadas, backup de cuenta y políticas RLS.
- Navegación con historial/hash, foco visible y reducción de movimiento.
- Suite Playwright ampliada: 18 pruebas aprobadas.
- React Doctor sobre los archivos cambiados: sin hallazgos (`--scope changed`); conserva la limitación conocida de detección por React UMD/Babel Standalone.

## Configuración externa pendiente

Para activar login y sincronización real hace falta crear un proyecto Supabase, ejecutar `supabase/schema.sql`, habilitar Google en Authentication y copiar `src/local-config.example.js` como `src/local-config.js` con URL y anon key.

No se guardan secretos ni credenciales en el repositorio. Sin esa configuración la aplicación continúa funcionando como invitado local.

## Próximas iteraciones recomendadas

El alcance funcional del roadmap está representado, pero estas mejoras requieren validación de producto o una infraestructura real:

- Invitaciones multiusuario y roles administrables desde UI.
- Sincronización fila por fila en lugar de backup completo.
- Evaluaciones con permisos para familia/jugador y consentimiento para menores.
- Equipos oficiales de liga y fixture por rondas en lugar de nombres libres.
- Notificaciones y colaboración en tiempo real.
- Historial de auditoría para resultados oficiales.
- Planes comerciales y métricas, únicamente después de validar uso recurrente.

Estas tareas no pueden cerrarse responsablemente sin proyecto Supabase, usuarios reales y decisiones de privacidad/operación.