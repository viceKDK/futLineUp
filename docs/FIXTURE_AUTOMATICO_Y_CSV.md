# Fixture automático, importación y exportación CSV

Cada competencia de **Liga amateur** tiene su propio padrón de equipos y su propio fixture.

## Generar fixture automáticamente

Dentro de una liga creada, usar **Generar fixture**.

Se puede elegir:

- **Solo ida**: cada pareja de equipos juega una sola vez.
- **Ida y vuelta**: cada pareja juega dos veces, invirtiendo local y visitante en la segunda rueda.
- **Primera fecha**.
- **Días entre fechas**.
- Si ya existen partidos: **Agregar** el nuevo fixture o **Reemplazar** el actual.

Ejemplo con 4 equipos:

- Solo ida: 3 fechas, 6 partidos.
- Ida y vuelta: 6 fechas, 12 partidos.

Con una cantidad impar de equipos, el generador asigna automáticamente un equipo libre por fecha.

Los partidos generados quedan en la pestaña **Fixture** y funcionan igual que los cargados manualmente: se pueden completar resultados, eliminar y usar para calcular la tabla.

## Importar por CSV

Usar **Importar / editar**.

### Solo participantes

```csv
Equipo
Los Pibes
La Banda
El Barrio
Deportivo Centro
```

### Fixture y resultados

```csv
Fecha,Local,Visitante,Goles Local,Goles Visitante
2026-09-01,Los Pibes,La Banda,2,1
2026-09-08,El Barrio,Deportivo Centro,,
```

- Con ambos goles completos, el partido entra como jugado.
- Con los goles vacíos, entra como pendiente.
- Se aceptan coma, punto y coma o tabulación como separador.
- También se aceptan campos CSV entre comillas.

## Exportar equipos

Usar **Equipos CSV ↓**.

La descarga contiene una columna `Equipo` con todos los participantes de la liga activa.

Ejemplo:

```csv
Equipo
Los Pibes
La Banda
El Barrio
```

## Exportar fixture

Usar **Fixture CSV ↓**.

La descarga contiene:

```text
Ronda,Ida/Vuelta,Fecha,Local,Visitante,Goles Local,Goles Visitante
```

Los resultados pendientes quedan con las columnas de goles vacías. Los resultados ya jugados salen con sus goles.

El archivo exportado es compatible con el mismo importador de futbolClub, por lo que se puede hacer este flujo:

1. Generar el fixture en futbolClub.
2. Exportar `fixture.csv`.
3. Abrirlo en Excel, Google Sheets o LibreOffice Calc.
4. Modificar fechas o completar resultados.
5. Guardarlo otra vez como CSV.
6. Volver a **Importar / editar** y cargarlo.

Las columnas extra `Ronda` e `Ida/Vuelta` no impiden la reimportación. La aplicación recupera los equipos, fechas y resultados del archivo.

## Seguridad al reemplazar

Si una liga ya tiene resultados jugados y se elige **Reemplazar** al generar un nuevo fixture, futbolClub solicita confirmación antes de borrar el calendario existente.
