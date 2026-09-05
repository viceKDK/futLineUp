# ADR 0001 — Feature-first con capas internas

**Estado:** aceptado.

## Decisión

Organizar producto por `features/<capability>` y, dentro de cada feature, usar solo las capas que necesite: `domain`, `application`, `infrastructure`, `presentation`. `shared` contiene únicamente conceptos realmente reutilizados y nunca depende de features. `app` es el composition root.

## Motivo

Una estructura puramente horizontal (`components/services/utils`) aumenta acoplamiento entre cambios de negocio. Una estructura feature-first mantiene juntas las razones de cambio, mientras las capas internas mantienen dirección de dependencias y testabilidad.

## Consecuencias

Mover un archivo no demuestra SRP. Una pantalla grande sigue siendo deuda aunque esté dentro de la feature correcta. La regla automática de imports evita domain -> infrastructure/presentation y ciclos. Las excepciones deben documentarse como migración temporal, no convertirse en patrón.
