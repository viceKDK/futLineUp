# Arquitectura y decisiones

## Alcance real

La extracción de `data.jsx` crea un núcleo ES Modules sin React ni estado global en dominio/aplicación. Las pantallas JSX existentes se organizan por funcionalidad, pero **moverlas no elimina automáticamente su deuda de diseño**. `src/app/legacy-bridge.js` mantiene temporalmente las APIs `window.db`, backups, snapshots, hooks y utilidades que esas pantallas consumen.

No se introduce un contenedor de inyección, una jerarquía artificial de clases ni dependencias de producción nuevas. Las fábricas reciben objetos con contratos pequeños y devuelven APIs explícitas.

## Organización

```text
src/
  app/                         # Composición, puente temporal y montaje
  features/
    backup/{domain,application}/
    sharing/{application,presentation}/
    draw/{domain,presentation}/
    lineup/{domain,presentation}/
    auth/{infrastructure,presentation}/
    teams/presentation/
    kits/presentation/
    crests/presentation/
    rival/presentation/
    settings/presentation/
    coach/presentation/
    league/presentation/
  shared/
    domain/                    # JSON seguro, registro, formato puro
    application/               # Store observable y escritura estricta
    infrastructure/            # Storage local/memoria, codec Base64URL
    presentation/              # Hooks, archivos del navegador, UI común
```

`bootstrap.js`, `observability.js`, `auto-backup.js` y la configuración local conservan sus URLs actuales. Los archivos promocionales aún son scripts heredados. No deben convertirse en destino de nuevas reglas de negocio.

## Dependencias permitidas

Dominio solo importa dominio. Aplicación importa dominio/aplicación, nunca adaptadores ni UI. Infraestructura implementa puertos y puede importar esas capas internas. Presentación consume aplicación/dominio/presentación. Solo `app` conecta implementaciones concretas. `shared` no depende de funcionalidades. El control automático analiza imports estáticos reales y detecta ciclos, módulos inexistentes y dependencias externas en el núcleo.

La comprobación estructural no demuestra toda la semántica de SOLID. Las reglas ESLint complementan el grafo prohibiendo APIs del navegador en dominio/aplicación. Evitar imports dinámicos o accesos indirectos que eludan estas fronteras.

## SOLID aplicado

| Principio | Aplicación concreta |
|---|---|
| SRP | Validación, almacenamiento, importación, codec, catálogo y React están separados por razones de cambio. |
| OCP | Validadores de campos y estrategias de importación se agregan al componer el caso de uso, no ampliando cadenas de condiciones. |
| LSP | Memoria y adaptador local ejecutan el mismo contrato de lectura, escritura, eliminación y claves. |
| ISP | El servicio de backup recibe puertos separados `reader` y `writer`; exportar no necesita conocer React, Supabase ni eventos. |
| DIP | `createRuntime` conecta los puertos. Los casos de uso no construyen almacenamiento concreto. Reloj, codec y política de modos son inyectables. |

Patrones utilizados: **Strategy** para políticas de importación; **Adapter** para almacenamiento y codec; **Observer** para suscripciones; **Composition Root** para inyección explícita; **Facade temporal** para compatibilidad con las pantallas existentes. No agregar patrones solo para aumentar su cantidad.

## Extender sin modificar el importador

```js
const runtime = createRuntime({
  storage,
  codec,
  supportsMode: (mode) => Object.hasOwn(formations, mode),
  fieldValidators: {
    tactics(value) {
      if (!Array.isArray(value)) throw new Error("Tácticas inválidas");
    },
  },
  strategies: {
    appendMissing: ({ data, existingKeys }) => ({
      set: Object.fromEntries(Object.entries(data)
        .filter(([key]) => !existingKeys.includes(key))),
      remove: [],
    }),
  },
});
```

Las extensiones se registran con nombres nuevos: no pueden reemplazar silenciosamente validadores o estrategias incorporadas. Una estrategia devuelve un plan sin efectos; el escritor realiza y valida la operación. Cada extensión necesita pruebas propias, no solo el ejemplo de documentación.

## Persistencia y recuperación

La clave local `fc.v1.` y el formato de backup v1/v2 se conservan. La edición normal puede continuar en memoria cuando el navegador bloquea almacenamiento; se publica `fc:storage-error`. Esto **no equivale a haber guardado duraderamente**.

La importación usa `store.commit`: serializa y obtiene el estado previo antes de escribir; publica a los observadores después de completar todas las escrituras; ante un fallo intenta revertir las escrituras efectuadas. `localStorage` no ofrece transacciones nativas: no hay garantía de atomicidad frente al cierre del proceso, fallos persistentes o escrituras simultáneas de otra pestaña. Si el rollback falla, el error lo indica expresamente.

`replace` reemplaza los datos reconocidos de la aplicación y preserva claves ajenas como preferencias o flags de inicio. `merge` sustituye los campos presentes sin eliminar otros; no fusiona individualmente jugadores. Los eventos entre pestañas invalidan snapshots, incluido `localStorage.clear()`.

## Build, carga y offline

`scripts/client-entries.mjs` es el mapa de nombres de salida a fuentes. Las URLs `compiled/page-*.js` siguen estables. `compiled/data.js` es un módulo nativo y los scripts consumidores posteriores usan `defer`, por lo que no deben volver a convertirse en scripts síncronos ni `async`.

El build genera `compiled/module-precache.js` a partir de las fuentes nativas, y el service worker incluye esos módulos. No editar a mano el inventario al agregar una dependencia. Publicar siempre fuentes `src/`, archivos compilados y el nuevo service worker juntos; no desplegar únicamente `compiled/`.

## Deuda pendiente explícita

Extraer sucesivamente reglas de fixture/clasificación, entrenamiento, edición de alineaciones y sorteos balanceados desde los componentes grandes. Separar autenticación/sincronización Supabase de `window`. Migrar el scheduler de backups automáticos a puertos de temporizador/IndexedDB. Sustituir el montaje global por presentación modular al completar los consumidores. Añadir pruebas de componentes, accesibilidad y concurrencia real entre pestañas; medir esas capas por separado. No describir esta primera extracción como cobertura total ni como migración completa.
