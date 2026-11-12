# VIH en Guatemala | Fase 1

Los archivos consolidados están en `Data/observaciones.csv` y `Data/vih_guatemala.sqlite`. Después de la revisión de fuentes contienen 5,176 observaciones de Guatemala.

| Fuente | Filas |
| --- | ---: |
| Banco Mundial | 35 |
| MSPAS | 4,826 |
| ONUSIDA | 315 |

El [indicador SH.HIV.INCD.TL](https://data.worldbank.org/indicator/SH.HIV.INCD.TL?locations=GT) del Banco Mundial contiene 35 estimaciones de nuevas infecciones en personas entre 1990 y 2024, incluida la estimación de 1,400 para 2024. El histórico se extrajo del RTF que contiene la respuesta de la API y se conservó como JSON en `Recursos/`. Un valor vacío en `preliminar` equivale a NULL en SQLite.

## Carpetas del proyecto

- `Data/` contiene el CSV consolidado y la base SQLite para consultas.
- `Recursos/` contiene los archivos de origen y las salidas de la primera fase. Se conserva localmente y está excluida de Git.
- `Frontend/` es la carpeta del dashboard.
- `MiniBackend/` contiene el importador del Banco Mundial y es la carpeta del futuro servicio.

## Importar el histórico del Banco Mundial por separado

Requiere Python 3. Desde esta carpeta, descarga la respuesta original e impórtala con:

```sh
mkdir -p Recursos
curl --fail --location --silent --show-error \
  'https://api.worldbank.org/v2/country/GTM/indicator/SH.HIV.INCD.TL?format=json&per_page=100' \
  -o Recursos/banco_mundial.json
python3 MiniBackend/preparar_datos.py Recursos/banco_mundial.json
```

El importador comprueba país, indicador, paginación, años duplicados y conteos. Omite los valores nulos y reporta cuántos encontró. Conserva el JSON original en `Recursos/` con su hash SHA-256. Registra `lastupdated` como versión de la respuesta de la API. Una reimportación reemplaza las observaciones de ese indicador y país para el Banco Mundial. El CSV se exporta desde las observaciones de SQLite.

El comando anterior escribe las salidas independientes del Banco Mundial en `Recursos/Prototipo/`. El consolidado de las tres fuentes se consulta en `Data/`.

## Cobertura MSPAS 2025–2026 en Data

- Períodos principales: enero–diciembre de 2025 y enero–septiembre de 2026. El informe de 2026 también publica la comparación de notificaciones de enero a septiembre de ambos años.
- Las categorías de escolaridad, estado civil, pueblo y orientación conservan las etiquetas de la fuente en `cobertura`. Los trimestres de embarazo son trimestres de gestación. La frecuencia de pruebas en embarazadas cuenta personas, mientras que el tamizaje general cuenta pruebas.
- Los mapas municipales (2025, pp. 8–9; 2026, p. 10) solo muestran rangos por color. Se cargó el agregado publicado de 260 municipios (76%) en 2025. Para obtener cifras exactas por municipio hace falta la tabla de origen.
- Orientación de 2026 (p. 20): la tabla suma 1,835 y el gráfico suma 1,377 sin precisar el universo. La base usa la tabla y conserva sus categorías como aparecen en el informe. El cuadro departamental de 2025 y el de orientación de 2025 coinciden en 2,061 casos, con repartos diferentes entre VIH y VIH avanzado (1,160/901 y 1,163/898, respectivamente).
- Años de vida potencialmente perdidos (AVPP): se incorporó el cuadro general de 2025 para edades de 0 a 64 años, publicado en la p. 15 del informe de 2026. Los cuadros por sexo usan un supuesto diferente para mujeres de 45 a 54 años. El cuadro general de la p. 16 rotula «enero a diciembre 2026*» dentro del informe de enero a septiembre. Su período necesita confirmación antes de cargarlo como observación.
- El tamizaje general de enero a septiembre de 2025 sigue sin una cifra confirmada. El lote histórico incorpora valores seleccionados de las gráficas retrospectivas.

## Histórico MSPAS 2017–2024

- El CSV y SQLite incluyen los ocho cierres anuales originales, los cortes enero–octubre de 2022, enero–mayo de 2023 y enero–septiembre de 2024, y el agregado 2014–2019 de adolescentes de 10 a 17 años. El agregado adolescente se consulta por separado para evitar solaparlo con la población general.
- Se incorporaron notificaciones, tasas y los desgloses territoriales, de sexo, clasificación y edad que se pudieron verificar, junto con series seleccionadas de tamizaje, embarazo, vinculación e inicio de tratamiento. La selección no transcribe todas las gráficas y cuadros secundarios de los PDFs históricos.
- El cierre original de 2024 publica 2,264 notificaciones. El informe de 2025 cita 2,284 para 2024. Ambas cifras conservan su procedencia y cobertura, y no se deben sumar. Para enero–septiembre de 2024, el cuadro de tratamiento reporta 1,485 inicios (p. 12) y el cuadro de tiempos presenta 1,484 registros (p. 13). Cada cifra tiene su propio indicador.
- Totonicapán (cierre 2022), Sololá y Huehuetenango (enero–mayo 2023) y Baja Verapaz (cierre 2023) se recuperaron del cuadro de totales por residencia de la p. 5. Sus celdas de sexo y clasificación están incompletas en el cuadro de la p. 4. Con los totales territoriales recuperados, las sumas coinciden con los cierres respectivos.
- El tamizaje de 2019 conserva 344,659 pruebas, cifra que coincide con la suma de los 12 meses de la p. 4. La p. 8 indica 344,652. Para 2020, se usó el cuadro detallado de la p. 12 (386,831), que cuadra por sexo. El texto de conclusiones de la p. 15 indica 304,644. La serie de tamizaje 2022–2024 proviene de la gráfica retrospectiva de 2025 y cuenta pruebas. El cuadro original de 2023 que informa 406,807 cuenta personas.


## Cierre de la limpieza

### ONUSIDA 2026

- `Estimates_2026_en.csv` contiene 11,357 filas para Guatemala (GTM) en 50 indicadores. Se incorporaron los 315 valores numéricos disponibles, correspondientes a 14 indicadores. Las 11,042 filas con valor numérico vacío quedaron fuera del consolidado. Nuevas infecciones, incidencia, prevalencia y muertes por sida carecen de valores numéricos para Guatemala en este archivo.
- De las 315 filas incorporadas, 130 corresponden a estimaciones, 103 a datos reportados y 82 a metas. Las metas se identifican con `tipo = meta`. Algunas tienen un valor en `Data value` y muestran `...` en `Formatted`. El consolidado usa el campo numérico.
- Las series disponibles incluyen prevención de transmisión maternoinfantil, tamizaje prenatal, diagnóstico infantil temprano, diagnóstico tardío e inicio de tratamiento. Cada fila conserva el código del indicador, el código y nombre del subgrupo, la línea del CSV, la unidad, el período y la fuente original. Los límites inferior y superior se identifican en `clasificacion` para evitar agregarlos a la estimación central.
- El archivo se distribuye como edición 2026 y conserva series de distintas ediciones y sistemas. Por ejemplo, algunas filas indican que provienen de estimaciones epidemiológicas ONUSIDA 2025. Los años de observación se guardan independientemente de la edición del archivo.

### Cuadros adicionales del MSPAS

- Se añadieron 194 filas verificables de los cortes 2022–2024. Incluyen orientación según el informe, escolaridad, estado civil, pueblo, embarazo por trimestre y departamento, y vinculación por Unidad de Atención Integral.
- En el informe anual de 2023 (p. 8), el desglose cruzado de edad y trimestre muestra 43 casos en el tercer trimestre, mientras el cuadro de totales por trimestre muestra 24. Se usó el cuadro cuyos totales suman 64 y se dejó fuera el cruce inconsistente.
- Los mapas que solo muestran rangos, los cuadros con discrepancias sin resolver y las gráficas secundarias no transcritas quedan en sus PDFs originales. El consolidado contiene las series y los desgloses verificados durante esta fase.

## Dashboard local

Desde la carpeta `vih-guatemala`, ejecutá:

```sh
python3 MiniBackend/servidor.py
```

Abrí [http://127.0.0.1:8765](http://127.0.0.1:8765). El servidor usa Python sin dependencias externas y escucha solo en el equipo local. Si el puerto está ocupado, podés elegir otro con `--port 8766`.

También podés abrir `Frontend/index.html` en el navegador y seleccionar `Data/observaciones.csv` desde el formulario. Las vistas, gráficas y filtros funcionan con el mismo CSV en ambos modos. Los filtros muestran los desgloses disponibles para cada combinación.

El mapa de calor aparece al seleccionar el nivel **Departamento de residencia**. Usa el corte seleccionado o el más reciente de la selección, y muestra una escala de color basada en los valores de ese corte. Los límites geográficos simplificados de geoBoundaries se cargan desde internet. Si no están disponibles, se muestra una cuadrícula esquemática de los 22 departamentos con los mismos datos. La leyenda diferencia cero de ausencia de datos.

### Abrir desde un iPhone en la misma red Wi-Fi

Desde la carpeta del proyecto, ejecutá `python3 MiniBackend/servidor.py --host 0.0.0.0`. En Safari del iPhone abrí `http://IP-DE-TU-MAC:8765`, usando la dirección IP que aparece en Configuración del Sistema → Red → Wi-Fi → Detalles → TCP/IP. Usá una red de confianza. El modo predeterminado del servidor sigue escuchando solo en la Mac.


## Desplegar en Netlify

Importá el repositorio en Netlify y usá la rama `main`. La configuración de `netlify.toml` copia el frontend y el CSV consolidado a `dist/`. El navegador carga el CSV en `/datos.csv` y ejecuta los filtros. El servidor de Python y SQLite siguen disponibles para trabajo local.

Para actualizar el sitio, actualizá `Data/observaciones.csv` y subí el cambio al repositorio. El mapa puede solicitar los límites geográficos a geoBoundaries desde el navegador y tiene una cuadrícula de respaldo.
