# Releases y rollback

## Versionado

Se usa SemVer en `package.json`: `MAJOR.MINOR.PATCH`. Cada build genera
`compiled/release.js` con versión, commit y fecha. Un tag de release debe coincidir
con la versión: por ejemplo, versión `1.2.3` → tag `v1.2.3`.

Procedimiento:

1. Confirmar que el árbol de trabajo contiene únicamente los cambios deseados.
2. Ejecutar `npm version patch`, `minor` o `major`, según compatibilidad.
3. Ejecutar `npm run quality`.
4. Ejecutar `npm run release:manifest && npm run release:verify`.
5. Revisar y crear el tag `vX.Y.Z`; al enviarlo, CI repite lint, auditoría e
   integridad y publica el manifiesto como artefacto. No realiza despliegues.
6. Publicar usando el procedimiento de despliegue ya existente.

El manifiesto contiene SHA-256 y tamaño de cada archivo ejecutable de la versión,
lo que permite demostrar exactamente qué artefactos se validaron.

## Rollback seguro

Primero generar un plan, sin cambiar archivos ni desplegar:

```powershell
git fetch --tags
npm run rollback:plan -- v1.2.3
```

El plan crea una rama nueva desde el tag, reinstala dependencias, ejecuta calidad y
verifica el manifiesto antes de usar el procedimiento de publicación existente.
Las migraciones de datos son _forward-only_: no se revierte una base de datos a
ciegas; se prepara una migración correctiva compatible con los datos actuales.
