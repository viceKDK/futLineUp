# Importar una liga por CSV

La pantalla **Liga amateur → Crear liga** permite cargar participantes manualmente o importar un archivo CSV.

## Opción 1: solo equipos

Usá una columna llamada `Equipo`:

```csv
Equipo
Los Pibes
La Banda
El Barrio
Deportivo Centro
```

También se reconocen como encabezado: `Team`, `Nombre`, `Name` y `Club`.

Al crear la competencia, todos los equipos aparecen inmediatamente en la tabla con `0 PJ` y `0 PTS`.

## Opción 2: fixture

Para importar partidos, usá como mínimo las columnas `Local` y `Visitante`:

```csv
Fecha,Local,Visitante,Goles Local,Goles Visitante
2026-08-22,Los Pibes,La Banda,2,1
2026-08-29,La Banda,El Barrio,,
```

- Si ambos goles tienen un valor, el partido se importa como **jugado** y actualiza automáticamente la tabla.
- Si los goles están vacíos, el partido se importa como **pendiente**.
- `Fecha` es opcional, pero se recomienda usar `AAAA-MM-DD`, por ejemplo `2026-08-22`.
- Los equipos encontrados en el fixture se agregan como participantes de la liga.

También se reconocen nombres equivalentes en inglés, por ejemplo `Date`, `Home`, `Away`, `Home Score` y `Away Score`.

## Separadores compatibles

El importador detecta automáticamente:

- coma `,`
- punto y coma `;`
- tabulación

También admite valores entre comillas, incluyendo nombres con comas.

Ejemplo:

```csv
Equipo
"Deportivo Centro, Senior"
La Banda
```

## Reglas

- La liga necesita al menos 2 participantes.
- No se guardan equipos duplicados por diferencia de mayúsculas/minúsculas.
- Un partido no puede enfrentar un equipo contra sí mismo.
- Local y visitante deben pertenecer a la liga activa.
- La Copa también queda limitada a los participantes de esa competencia.
- Si el archivo contiene filas incompletas o resultados inválidos, la interfaz informa cuántas fueron ignoradas.

## Editar una liga existente

Dentro de una liga ya creada, usá **Editar equipos** para:

- agregar participantes;
- quitar equipos que todavía no tengan partidos cargados;
- importar otro CSV de equipos o fixture;
- cambiar el nombre o la temporada.

Cada competencia mantiene su propia lista de equipos, fixture, tabla y copa de forma independiente.
