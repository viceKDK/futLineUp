# Code quality policy

## Definition of Done

Un cambio de comportamiento no está terminado hasta que: la regla vive en la capa correcta; tiene una prueba que falla sin la implementación; cubre límites y error paths; no agrega dependencias invertidas ni ciclos; no aumenta un archivo legacy por encima de su techo; y conserva los contratos públicos documentados. La UI no implementa reglas que puedan expresarse sin React/DOM.

## Límites de tamaño

El objetivo de diseño es **<=500 líneas por archivo**. Los módulos de `domain`, `application` e `infrastructure` tienen un límite más estricto de **300 líneas**. Los archivos de presentación heredados que todavía superan 500 se consideran deuda de migración: pueden mantenerse temporalmente, pero no crecer por encima de su techo registrado y deben reducirse al tocarse. Un archivo nuevo de presentación no debe usar esa excepción.

`npm run test:source-budgets` aplica el límite duro. `npm run metrics:source` genera `.dist/quality/source-metrics.json` con líneas, decisiones, funciones y densidad de decisiones. La complejidad indicada es una heurística de señalización, no un reemplazo de revisión humana.

## SOLID verificable

SRP se evalúa por razones de cambio y límites de capa, no por cantidad de clases. OCP se aplica solo donde existe variación real: estrategias de importación, validadores, balanceadores, reglas de desempate y adapters. LSP se protege con contract tests compartidos. ISP usa puertos mínimos orientados al caso de uso. DIP exige que dominio/aplicación no construyan IndexedDB, Supabase, timers, DOM ni storage concreto.

## Paquetes y métricas

`npm run metrics:packages` calcula por paquete: `Ca` (dependientes), `Ce` (dependencias), `I = Ce/(Ca+Ce)`, `A` (fracción de módulos de contrato explícito, según convención `port/contract` o JSDoc de contrato) y `D = |A + I - 1|`. El reporte también marca candidatos a violar SDP cuando un paquete sustancialmente más estable depende de uno más inestable.

`ADP` es un gate: no se permiten ciclos. `SDP` es observable mediante I y el grafo. `SAP` se observa con A/I/D. `CCP`, `CRP` y `REP` no se convierten en un número inventado: se revisan con cohesión de cambio, superficie reutilizada y límites de publicación. Una métrica solo sirve si corresponde a una propiedad que realmente puede medirse en JavaScript.

## Tests

`npm test` es la suite FIRST. `npm run test:coverage` aplica umbrales del núcleo. `npm run test:mutation` muta código fuente real de reglas sensibles y exige que los invariantes detecten las alteraciones. `tests/unit/feature-domain.test.js` incluye pruebas de propiedades con múltiples tamaños/semillas para fixture, balance y transformaciones.

Coverage alto no autoriza tests triviales. No se elimina código del denominador para mejorar porcentajes. E2E comprueba journeys críticos; no debe reemplazar pruebas de reglas puras.

## Dependencias y globals

No agregar nuevas reglas bajo `window.*`. `legacy-bridge.js` es una fachada de migración y no una API arquitectónica nueva. Las features nuevas importan módulos explícitos. `domain/application` no acceden a React, DOM, Supabase, `localStorage`, `indexedDB`, timers reales ni red. Infraestructura implementa esos puertos.
