# Plan de producto e implementación de futbolClub

## 1. Propósito de este documento

Este documento define la evolución de futbolClub desde una aplicación local para armar alineaciones hacia una plataforma que pueda atender tres tipos de uso sin perder simplicidad:

1. Amigos que juegan partidos informales de Fut 5, 6, 7, 8 u 11.
2. Entrenadores de fútbol formativo o divisiones chicas.
3. Equipos y ligas amateur que necesitan calendario, resultados y seguimiento.

También documenta los cambios técnicos necesarios, la incorporación futura de Supabase y Google Login, la estrategia de migración desde `localStorage`, los hallazgos de React Doctor y un roadmap ejecutable por fases.

> Estado del plan: implementación funcional integrada en `develop` en el commit `40a694a`. La activación real de Supabase depende de configurar el proyecto externo.

## 2. Decisiones acordadas

- Mantener futbolClub como una sola aplicación y una sola marca.
- Ofrecer experiencias diferentes según el perfil de uso, evitando mostrar todas las herramientas a todos los usuarios.
- Mantener el stack actual mientras siga siendo suficiente para una aplicación simple.
- No migrar React ni introducir un bundler solamente por moda o por anticipación.
- Incorporar Supabase cuando se implemente cuenta, sincronización entre dispositivos, datos compartidos, roles o ligas.
- Ofrecer Google Login como acceso principal, con una alternativa futura por email si fuera necesaria.
- Conservar un modo local o invitado para quien solo quiera armar una formación rápidamente.
- Implementar los cambios en ramas nuevas y PRs pequeños; no trabajar directamente sobre `main`.
- Resolver primero los problemas de persistencia y confiabilidad de la experiencia actual.

## 3. Visión de producto

futbolClub debe permitir empezar de forma inmediata y crecer con las necesidades del usuario.

La promesa central es:

> Armá, organizá y seguí tu equipo desde un solo lugar.

El producto no debe obligar a un grupo de amigos a completar datos propios de un entrenador, ni obligar a un entrenador a usar una interfaz limitada al sorteo casual. La complejidad se habilita progresivamente.

## 4. Perfiles de uso

### 4.1. Amigos / partido informal

Objetivo: preparar un partido en pocos minutos.

Funciones principales:

- Crear un equipo o grupo.
- Elegir Fut 5, 6, 7, 8 u 11.
- Agregar jugadores rápidamente.
- Armar una formación.
- Sortear dos, tres o cuatro equipos.
- Fijar jugadores antes del sorteo.
- Diseñar una camiseta.
- Armar ambos equipos cuando sea necesario.
- Compartir formación, convocatoria o equipos por WhatsApp.
- Guardar resultado de manera opcional.

Principio de UX: el flujo principal debe funcionar sin login y sin formularios largos.

### 4.2. Entrenador / divisiones chicas

Objetivo: registrar el proceso del jugador y tomar mejores decisiones deportivas.

Funciones principales:

- Plantel con fichas individuales.
- Fecha de nacimiento o categoría, posición, pierna hábil y dorsal.
- Contacto del adulto responsable, únicamente si el caso de uso y la política de privacidad lo permiten.
- Asistencia a entrenamientos y partidos.
- Convocatorias, titulares, suplentes y minutos jugados.
- Evaluación posterior a partido.
- Evaluación de entrenamientos.
- Fortalezas observadas.
- Aspectos por mejorar.
- Objetivos individuales.
- Evolución histórica del jugador.
- Notas privadas del cuerpo técnico.
- Resumen del plantel por período.

La evaluación no debería depender solo de una nota numérica. Se propone una combinación de:

- Nota general opcional.
- Etiquetas estructuradas: técnica, táctica, físico, actitud y toma de decisiones.
- Texto breve: “qué hizo bien”.
- Texto breve: “qué debe mejorar”.
- Objetivo para el próximo entrenamiento o partido.

### 4.3. Equipo o liga amateur

Objetivo: organizar la competencia y mantener una fuente confiable de calendario y resultados.

Funciones principales:

- Competencias y temporadas.
- Equipos participantes.
- Fixture.
- Próximos partidos.
- Resultados.
- Tabla de posiciones.
- Goles a favor y en contra.
- Convocados y formación por fecha.
- Estadísticas básicas por jugador.
- Cancha, horario, rival y observaciones.
- Compartir previa y resultado.
- Roles para organizador, delegado, entrenador, jugador y espectador.

Este perfil sí requiere datos online y una fuente compartida. No debería implementarse completamente sobre `localStorage`.

## 5. Selección y cambio de experiencia

En el primer uso se preguntará:

> ¿Para qué vas a usar futbolClub?

Opciones:

- Jugar con amigos.
- Dirigir un equipo.
- Organizar o seguir una liga.

La selección define navegación, textos, panel inicial y funciones visibles. El usuario podrá cambiarla desde Configuración sin perder datos.

No se crearán tres aplicaciones separadas. Internamente habrá capacidades compartidas y módulos habilitados por perfil.

## 6. Núcleo compartido

Los tres perfiles comparten estas entidades:

- Usuario.
- Organización o espacio de trabajo.
- Equipo.
- Jugador.
- Membresía del jugador en un equipo.
- Formación.
- Partido.
- Convocatoria.
- Resultado.

Los módulos especializados agregan:

- Entrenador: entrenamiento, asistencia, evaluación y objetivo individual.
- Liga: competencia, temporada, fecha, fixture y tabla.

Esta separación evita duplicar datos y permite que un equipo informal se convierta luego en un equipo competitivo.

## 7. Cambios prioritarios sobre la aplicación actual

### 7.1. Persistencia completa de equipos

Problema actual: al guardar un equipo se almacenan metadatos, pero no se persiste de forma completa la alineación. Al abrirlo desde “Mis equipos”, se reinician `assignedIds` y `freePositions`.

Debe guardarse:

- IDs de jugadores asignados por posición.
- Posiciones del modo libre.
- Formación seleccionada.
- Titulares y suplentes.
- Kit completo.
- Capitán.
- Fecha de última modificación.

Criterio de aceptación: guardar, recargar la página y volver a abrir un equipo debe reproducir exactamente la alineación anterior.

### 7.2. Enlaces compartibles reales

Problema actual: el enlace compartido contiene solamente un slug en el hash y no transporta la alineación. Otro usuario ve sus propios datos locales.

Etapas propuestas:

1. Sin cuenta: enlace con snapshot comprimido y de solo lectura, si el tamaño lo permite.
2. Con Supabase: snapshot público con identificador no predecible y expiración/configuración de privacidad.
3. Equipos colaborativos: enlace de invitación separado del enlace público.

Criterio de aceptación: abrir el enlace en incógnito o en otro dispositivo debe mostrar la misma formación sin depender del `localStorage` del receptor.

### 7.3. Backup e importación

- Exportar datos locales a JSON versionado.
- Importar y validar un backup.
- Mostrar resumen antes de sobrescribir o fusionar.
- Mantener copias de seguridad previas a una migración.
- Informar errores de cuota o escritura; actualmente algunos errores se silencian.

### 7.4. Editor táctil y accesible

- Implementar Pointer Events para mouse, táctil y lápiz.
- Permitir seleccionar jugador y luego posición como alternativa al drag and drop.
- Agregar deshacer y rehacer.
- Añadir foco visible y operación por teclado.
- Incorporar etiquetas accesibles y anuncios de cambios importantes.
- Cerrar modales con Escape y devolver el foco al control de origen.
- Respetar `prefers-reduced-motion`.

### 7.5. Gestión de jugadores

- Editar nombre, dorsal y posición.
- Detectar dorsales duplicados sin bloquear los casos válidos.
- Agregar foto, pierna hábil y posiciones secundarias.
- Archivar en lugar de borrar cuando el jugador tenga historial.
- Incorporar suplentes y ausencias.

## 8. Contenido y navegación

### 8.1. Contenido dinámico

Reemplazar textos fijos como “Temporada 26 · Otoño”, el perfil “Martín S.” y “12 partidos” por datos configurables o estados de demostración claramente identificados.

### 8.2. Estados vacíos

Cada módulo debe explicar el siguiente paso:

- Sin equipos: crear equipo o cargar ejemplo.
- Sin jugadores: agregar manualmente, pegar una lista o importar.
- Sin partidos: programar partido o registrar resultado.
- Sin evaluaciones: explicar que son privadas y crear la primera.

### 8.3. Navegación progresiva

Navegación común:

- Inicio.
- Equipos.
- Jugadores.
- Configuración.

Amigos:

- Formación.
- Sorteo.
- Camisetas.
- Compartir.

Entrenador:

- Plantel.
- Entrenamientos.
- Partidos.
- Evaluaciones.
- Evolución.

Liga:

- Calendario.
- Resultados.
- Tabla.
- Equipos.
- Estadísticas.

## 9. Animaciones y feedback

Las animaciones deben comunicar estado, no decorar todas las acciones.

Prioridades:

- Confirmación visual al guardar.
- Resaltado claro del destino durante drag and drop.
- Transición al cambiar formación.
- Entrada/salida de jugadores de la cancha.
- Resultado del sorteo con posibilidad de saltar la animación.
- Skeletons o estados de sincronización cuando se use Supabase.
- Indicador de datos guardados, sincronizando o sin conexión.
- Variante sin movimiento mediante `prefers-reduced-motion`.

La promo puede conservar un lenguaje más cinematográfico porque no forma parte del flujo operativo principal.

## 10. Decisión sobre el stack

### 10.1. Decisión actual

Se mantiene el stack actual:

- React 18 por UMD.
- Babel Standalone.
- JavaScript/JSX.
- CSS y SVG propios.
- `localStorage` para el modo local.

Justificación:

- La aplicación actual es pequeña y client-side.
- No existe una necesidad funcional inmediata que obligue a migrar.
- Una migración prematura consumiría tiempo sin mejorar directamente la experiencia del usuario.
- Supabase puede integrarse desde el navegador sin reemplazar React.

### 10.2. Condiciones para reconsiderar el setup

Evaluar Vite u otro build moderno cuando ocurra al menos una de estas condiciones:

- El código modular y las dependencias hacen difícil mantener scripts globales.
- Se requiere TypeScript.
- Se necesita code splitting o control estricto de bundles.
- Los tests y herramientas no detectan adecuadamente el proyecto.
- Se necesita una política CSP que desaconseje Babel en runtime.
- Aumentan los módulos, colaboradores o despliegues.

No será una reescritura de producto. Deberá ser una migración técnica aislada y medible.

## 11. Supabase y Google Login

### 11.1. Servicios a utilizar

- Supabase Auth: Google Login y sesiones.
- PostgreSQL: equipos, jugadores, partidos, evaluaciones y ligas.
- Supabase Storage: fotos, escudos y assets generados.
- Row Level Security (RLS): aislamiento y permisos por organización/equipo.
- Realtime: únicamente donde aporte valor, por ejemplo cambios colaborativos o resultados de liga.

### 11.2. Modos de identidad

- Invitado local: no requiere cuenta y guarda en el dispositivo.
- Usuario autenticado: sincroniza sus espacios autorizados.
- Miembro invitado: accede mediante membresía y rol.
- Vista pública: solo lectura mediante snapshot o publicación explícita.

El login no debe bloquear el primer uso. Se solicitará cuando el usuario quiera sincronizar, respaldar, colaborar o acceder desde otro dispositivo.

### 11.3. Estrategia de sincronización

Crear una interfaz de persistencia independiente de la UI:

```js
dataStore.load(resource)
dataStore.save(resource, value)
dataStore.remove(resource, id)
dataStore.subscribe(resource, callback)
dataStore.sync()
```

Implementaciones:

- `LocalDataStore` para invitado.
- `SupabaseDataStore` para cuenta autenticada.

Al iniciar sesión por primera vez con datos locales:

1. Detectar datos locales.
2. Mostrar cantidad de equipos, jugadores y partidos.
3. Permitir importarlos a la cuenta o mantenerlos separados.
4. Evitar duplicados mediante IDs estables.
5. Conservar backup local hasta confirmar la migración.

### 11.4. Modelo de datos inicial

Tablas sugeridas:

- `profiles`: perfil público básico del usuario.
- `workspaces`: grupo, club u organización.
- `workspace_members`: usuario, rol y estado de invitación.
- `teams`: equipo, modalidad, categoría y configuración.
- `players`: identidad deportiva y datos permitidos.
- `team_players`: relación jugador-equipo, dorsal, posiciones y estado.
- `formations`: formación guardada y posiciones.
- `formation_slots`: orden, coordenadas y jugador asignado.
- `matches`: rival, fecha, cancha, estado y resultado.
- `callups`: convocatoria por partido.
- `callup_players`: titular, suplente, ausencia y minutos.
- `training_sessions`: entrenamiento y objetivos.
- `attendance`: asistencia por sesión.
- `player_evaluations`: evaluación, observaciones y visibilidad.
- `competitions`: liga o torneo.
- `seasons`: temporada de una competencia.
- `fixtures`: fecha, local, visitante y resultado oficial.

### 11.5. Roles y permisos

- Propietario: administra espacio, facturación futura y miembros.
- Entrenador: gestiona plantel, formación, asistencia y evaluaciones.
- Ayudante: permisos configurables.
- Delegado: gestiona calendario, convocatoria y resultados.
- Jugador/familia: ve únicamente información habilitada.
- Organizador de liga: administra competencia, fixture y resultados.
- Espectador: vista pública de solo lectura.

Las notas privadas y evaluaciones de menores requieren especial cuidado. Deben ser privadas por defecto, con políticas de retención y eliminación claras.

### 11.6. RLS mínima

- Ninguna tabla privada debe depender solo de filtros del frontend.
- Cada lectura/escritura debe validarse por membresía y rol.
- Los snapshots públicos deben exponer campos explícitos, no filas privadas completas.
- Los objetos de Storage deben organizarse por workspace y protegerse con políticas equivalentes.

## 12. Roadmap de implementación

### Fase 0 — Estabilización de la versión actual

Entregables:

- Persistencia completa de alineaciones.
- Reapertura fiel de equipos.
- Edición completa de jugadores.
- Backup/importación JSON.
- Enlace compartible funcional sin cuenta.
- Mejor manejo de errores de almacenamiento y exportación.
- Tests E2E de estos flujos.

Salida: el modo amigos es confiable aunque siga siendo local.

### Fase 1 — Experiencia y accesibilidad

Entregables:

- Onboarding por perfil.
- Navegación adaptada al perfil.
- Interacción táctil alternativa.
- Deshacer/rehacer.
- Estados vacíos y contenido dinámico.
- Accesibilidad básica y reducción de movimiento.
- Pruebas en viewport móvil.

Salida: la aplicación se puede usar cómodamente con mouse, teclado y celular.

### Fase 2 — Cuenta y sincronización

Entregables:

- Proyecto Supabase por ambiente.
- Esquema y migraciones SQL versionadas.
- Google Login.
- Perfil y sesión.
- `LocalDataStore` y `SupabaseDataStore`.
- Importación segura de datos locales.
- Equipos, jugadores, formaciones, kits y partidos sincronizados.
- Storage para imágenes.
- RLS automatizada y probada.

Salida: el usuario accede a sus datos desde múltiples dispositivos.

### Fase 3 — Modo entrenador

Entregables:

- Ficha del jugador.
- Convocatorias, suplentes y minutos.
- Entrenamientos y asistencia.
- Evaluaciones y objetivos.
- Historial y evolución.
- Exportación de resumen del jugador/equipo.
- Roles de cuerpo técnico.

Salida: un entrenador puede seguir el proceso del plantel durante una temporada.

### Fase 4 — Modo liga amateur

Entregables:

- Competencias y temporadas.
- Equipos participantes.
- Fixture y fechas.
- Registro/validación de resultados.
- Tabla de posiciones calculada.
- Calendario público.
- Roles de organizador y delegado.
- Historial de cambios de resultados.

Salida: una liga pequeña puede gestionar y publicar su competencia.

### Fase 5 — Colaboración y producto comercial

Posibles entregables:

- Invitaciones por enlace/email.
- Notificaciones.
- Comentarios o tareas del cuerpo técnico.
- Plan gratuito y planes pagos según límites.
- Métricas de adopción respetuosas de la privacidad.
- Auditoría y recuperación de cambios.

Esta fase depende de validación real con usuarios y no debe construirse por anticipación.

## 13. Hallazgos de React Doctor

Comando ejecutado:

```powershell
npx.cmd react-doctor@latest . --verbose
```

Versión: React Doctor `0.7.8`.

Resultado reportado:

- 27 advertencias totales.
- 6 de categoría Bugs.
- 4 de Performance.
- 3 de Accessibility.
- 14 de Maintainability.
- El score remoto no estuvo disponible.

Limitación del análisis:

React Doctor indicó `No React project detected`. El proyecto usa React por UMD y Babel Standalone, sin `react` como dependencia npm ni módulos React convencionales. Por ese motivo las reglas específicas de React fueron desactivadas. El resultado no equivale a un escaneo React completo ni a un proyecto libre de problemas.

### 13.1. Hallazgos y clasificación

| Hallazgo | Ubicaciones | Evaluación | Acción propuesta |
|---|---|---|---|
| Funciones puras reconstruidas por render | `animations.jsx`, `page-editor.jsx`, `page-share.jsx`, `promo-app.jsx` | Verdadero, impacto bajo | Mover helpers sin dependencias a scope de módulo cuando se toque cada archivo. |
| Valores estáticos reconstruidos por render | `page-draw.jsx`, `page-kits.jsx`, `page-mode.jsx`, promo | Verdadero, impacto bajo | Extraer presets, colores, nombres y tamaños constantes fuera de componentes. |
| Iteraciones encadenadas | `src/data.jsx` | Verdadero, impacto insignificante porque ocurre durante reset | Simplificar con un único loop por claridad, no por urgencia. |
| Copia con spread antes de `sort()` | `src/page-draw.jsx` | Verdadero, impacto bajo | Evaluar `toSorted()` según compatibilidad objetivo; un Fisher–Yates sería mejor para sorteo real. |
| `find()` dentro de loops | editor y compartir | Verdadero, impacto bajo con planteles pequeños | Construir un `Map` por ID para mejorar claridad y escalabilidad. |
| Índice de array como key | kits y escenas promo | Verdadero técnicamente; riesgo bajo en listas estáticas | Usar `name`, identificador de jugador/equipo o clave semántica estable. |
| Texto de 10–11 px | promo | Verdadero | Subir a 12 px cuando sea interfaz operativa; revisar visualmente porque parte corresponde a overlays cinematográficos de la promo. |

### 13.2. Priorización de correcciones

Alta:

- Cambiar keys por identificadores estables donde representen datos editables.
- Evitar que la futura expansión copie los patrones globales actuales sin límites de módulo.
- Añadir análisis accesible manual y pruebas, ya que Doctor no ejecutó reglas React completas.

Media:

- Crear mapas de jugadores por ID en editor y compartir.
- Extraer constantes estáticas.
- Extraer helpers puros.
- Revisar texto pequeño fuera de la promo.

Baja:

- Microoptimización del reset de `localStorage`.
- Reemplazo automático por `toSorted()`; requiere decidir compatibilidad y no mejora la aleatoriedad.

### 13.3. Recomendación adicional para el sorteo

El sorteo actual usa:

```js
[...unassigned].sort(() => Math.random() - 0.5)
```

Aunque React Doctor solo señala la copia previa, `sort(() => Math.random() - 0.5)` no produce una distribución uniforme. Se recomienda implementar Fisher–Yates y agregar un test que compruebe conservación de jugadores, ausencia de duplicados y diferencia máxima de un jugador entre equipos.

### 13.4. Integración futura de React Doctor

No se instaló React Doctor como dependencia porque el pedido fue ejecutar y registrar el diagnóstico. Si se adopta un setup npm más convencional, evaluar:

```powershell
npx react-doctor install --yes
```

Antes y después de cada lote técnico:

```powershell
npx react-doctor@latest --verbose --scope changed
```

No conviene migrar el stack únicamente para obtener un score de la herramienta.

## 14. Estrategia de pruebas

### 14.1. E2E

- Crear equipo, asignar jugadores, guardar, recargar y reabrir.
- Cambiar formación conservando asignaciones válidas.
- Modo libre con posiciones persistidas.
- Sortear todos sin duplicados y con balance de cantidad.
- Exportar PNG, PDF e ICS.
- Abrir enlace compartido en un contexto limpio.
- Importar backup válido y rechazar uno inválido.
- Login, logout y restauración de sesión.
- Migración local a Supabase.
- Verificar permisos entre dos usuarios distintos.

### 14.2. Unitarias

- Balanceo y aleatorización del sorteo.
- Cálculo de tabla de posiciones.
- Serialización/versionado de backups.
- Conflictos de sincronización.
- Cálculo de estadísticas y asistencia.

### 14.3. Calidad manual

- Android Chrome.
- iOS Safari.
- Desktop Chrome, Firefox y Edge.
- Teclado sin mouse.
- Zoom al 200%.
- Movimiento reducido.
- Conexión lenta y modo offline.

Nota de entorno resuelta: Playwright usa el canal de Chrome instalado en el sistema. La suite ampliada finaliza con 18/18 pruebas y la regeneración documental de capturas también está automatizada.

## 15. Estrategia de ramas

La implementación se integró en:

```text
develop · 40a694a
```

La rama temporal `docs/roadmap-product-modes-supabase` fue eliminada localmente y del remoto después del merge. La rama activa y publicada es `develop`.

Flujo vigente:

```text
rama funcional → develop → main
```

`main` queda reservada para versiones estables o publicables.

Reglas sugeridas:

- No implementar directamente en `main`.
- Mantener `develop` actualizada con la base elegida antes de empezar cambios funcionales.
- Crear ramas funcionales desde `develop` una vez que se sincronice con el remoto.
- Integrar ramas funcionales hacia `develop` mediante PR o merge revisado.
- Integrar `develop` hacia `main` únicamente para una versión estable.
- Usar una rama por fase o cambio coherente.
- Evitar una única rama que mezcle Supabase, rediseño, entrenador y liga.
- Mantener PRs revisables y con criterios de aceptación.

Ejemplos:

```text
fix/persist-lineups
feat/local-backup-import
feat/shareable-lineup-snapshot
feat/touch-lineup-editor
feat/onboarding-profiles
feat/supabase-auth-sync
feat/coach-player-evaluations
feat/amateur-league-calendar
```

## 16. Sugerencias adicionales

### 16.1. Validar primero con usuarios reales

Antes de construir el modo entrenador completo, entrevistar al menos a entrenadores de dos contextos distintos. Confirmar:

- Qué registran hoy.
- Cuánto tiempo tienen después de cada práctica.
- Qué información necesitan revisar semanalmente.
- Qué datos son sensibles o no quieren guardar.
- Quién debe poder ver cada evaluación.

### 16.2. Entrada rápida de planteles

Permitir pegar una lista como:

```text
Martín, 10, MED
Nahuel, 1, ARQ
Facu, 4, DEF
```

Esto reduce mucho el costo de adopción para amigos y entrenadores.

### 16.3. Privacidad desde el diseño

El modo de divisiones chicas puede manejar datos de menores. Antes de almacenar contactos, fotos o evaluaciones:

- Minimizar datos.
- Definir consentimiento y visibilidad.
- Mantener notas privadas por defecto.
- Permitir exportación y eliminación.
- Registrar quién puede acceder.
- Revisar requisitos legales según los países donde se ofrezca.

### 16.4. No construir facturación todavía

Primero validar uso recurrente. Señales útiles:

- Equipos que vuelven semanalmente.
- Entrenadores que completan asistencia y evaluaciones.
- Ligas que cargan resultados durante varias fechas.
- Usuarios que necesitan colaboración o más almacenamiento.

### 16.5. Métricas de producto futuras

- Tiempo hasta crear la primera formación.
- Porcentaje que comparte una alineación.
- Equipos activos por semana.
- Partidos registrados por equipo.
- Retención semanal de entrenadores.
- Porcentaje de usuarios que activa sincronización.

## 17. Definición de éxito

Modo amigos:

- Crear y compartir una formación en menos de tres minutos.
- Reabrirla sin pérdida de datos.

Modo entrenador:

- Registrar asistencia y evaluación breve sin convertirlo en una tarea administrativa pesada.
- Ver la evolución de un jugador durante la temporada.

Modo liga:

- Publicar fixture, resultado y tabla desde una fuente compartida y con permisos claros.

Plataforma:

- Funcionar localmente sin cuenta para casos simples.
- Sincronizar de manera segura al iniciar sesión.
- Mantener una interfaz diferente y enfocada para cada perfil de uso.
