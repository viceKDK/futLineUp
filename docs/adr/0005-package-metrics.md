# ADR 0005 — Métricas de paquetes como fitness functions

**Estado:** aceptado.

Se miden Ca, Ce, I, A y D desde el grafo real de imports. ADP se aplica como prohibición de ciclos. SDP se inspecciona comparando inestabilidad de dependiente/dependencia. SAP se observa con la distancia a la secuencia principal.

JavaScript no posee clases abstractas obligatorias, por lo que A usa una convención explícita de módulos de contrato (`port`, `contract` o JSDoc de contrato). No se inventan valores para CCP/CRP/REP: esos principios se revisan como cohesión de cambios/reuso/release surface y deben apoyarse en evidencia de evolución cuando exista historial suficiente.

Las métricas disparan investigación; no sustituyen diseño. Optimizar números a costa de wrappers vacíos o interfaces sin consumidores es una violación de esta decisión.
