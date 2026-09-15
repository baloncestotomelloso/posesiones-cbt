# Posesiones CB Tomelloso — app instalable (PWA) v2.0.0

App de registro en vivo de partidos por posesiones, reconstruida como aplicación web
instalable. Mismo flujo de registro que la versión anterior, pero pensada para
sobrevivir a un partido entero en el móvil.

---

## 1. El problema que resuelve

La versión anterior se abría con un atajo de iOS ("Mostrar vista web"). Esa ventana la
aloja la app Atajos, no Safari: al bloquear la pantalla o pasar a segundo plano, iOS
mataba la sesión y había que volver a elegir el archivo en pleno partido.

La causa de fondo era la que sospechabas: **Safari no ofrece "Añadir a pantalla de
inicio" para archivos locales (`file://`), solo para páginas servidas desde una URL.**
Por eso había que pasar por Atajos.

La solución es alojar la app en una URL real y convertirla en PWA. Con eso:

- **Icono propio en la pantalla de inicio**, sin pasar por Atajos ni por Safari.
- Se abre **a pantalla completa**, sin barra de navegación.
- **Funciona sin cobertura**: un *service worker* guarda la app entera en el móvil.
  Verificado apagando el servidor: arranca igual, con el partido intacto.
- **La pantalla no se apaga** mientras registras (Wake Lock), así que el escenario que
  rompió la app el otro día ya no se da.
- Si aun así iOS descarga la app de memoria, al volver **recupera el partido tal cual
  estaba**, incluso a mitad de una secuencia de tiros libres.

---

## 2. Poner la app online (una sola vez)

Necesitas una URL HTTPS. Las dos vías más simples:

### Opción A — GitHub Pages (recomendada: gratis y permanente)

1. Crea un repositorio nuevo en GitHub, público, por ejemplo `posesiones-cbt`.
2. Sube **el contenido de esta carpeta** (`index.html`, `manifest.webmanifest`,
   `sw.js` y la carpeta `icons/`) a la raíz del repositorio.
3. En el repo: **Settings › Pages**. En "Source" elige `Deploy from a branch`,
   rama `main`, carpeta `/ (root)`. Guarda.
4. Al cabo de un minuto tendrás la URL:
   `https://<tu-usuario>.github.io/posesiones-cbt/`

### Opción B — Netlify Drop (más rápido, sin cuenta para empezar)

1. Entra en `https://app.netlify.com/drop`.
2. Arrastra la carpeta entera a la página.
3. Te da una URL al momento. Si quieres que sea permanente y poder actualizarla,
   crea cuenta y reclama el sitio.

> Cualquier hosting estático sirve. Lo único imprescindible es **HTTPS**: sin él, el
> navegador no permite service workers y la app no funcionaría sin conexión.

---

## 3. Instalarla en el iPhone

1. Abre la URL **en Safari** (no en Chrome ni dentro de otra app).
2. Botón **Compartir** → **Añadir a pantalla de inicio** → Añadir.
3. **Abre la app una vez desde el icono, con wifi o datos.** Esa primera apertura es
   la que descarga y guarda todo en el móvil.
4. Comprobación: pon el móvil en **modo avión** y ábrela desde el icono. Debe abrirse
   entera. Si es así, ya está lista para el pabellón.

**Muy importante:** a partir de ahí, entra **siempre desde el icono**. La app abierta
en Safari y la app abierta desde el icono pueden guardar los datos en sitios distintos,
y un partido registrado en una no aparece en la otra.

---

## 4. Rutina antes de cada partido

1. Abre la app desde el icono (mejor con wifi, por si hay actualización).
2. Comprueba arriba que pone **"Pantalla ON"**. Si pone "auto", púlsalo para activarlo.
3. Escribe el rival y confirma la fecha.
4. Si quedaba un partido anterior sin archivar: *Partidos guardados* → **Guardar este
   partido y empezar uno nuevo**.
5. Al acabar: exporta los CSV y, si quieres red de seguridad extra,
   *Copia de seguridad y datos* → **Exportar copia de seguridad (JSON)**.

---

## 5. Qué es nuevo respecto a la versión anterior

### Estabilidad en vivo
- Instalable como app real (PWA) con icono propio y arranque a pantalla completa.
- Funciona al 100 % sin conexión.
- La pantalla se mantiene encendida mientras la app está abierta.
- Guardado en **tres capas**: `localStorage` en cada acción, espejo en IndexedDB
  (aguanta mejor las limpiezas de iOS) y copia de seguridad periódica. Además fuerza
  un guardado inmediato justo cuando iOS se lleva la app a segundo plano.
- Indicador permanente arriba con la hora del último guardado. Si el guardado fallase,
  se pone en rojo y avisa, en vez de fallar en silencio.
- Pide al navegador **almacenamiento persistente**, para que no borre los datos.

### Correcciones de cálculo
- **Puntos que antes se perdían.** Si en un "y uno" fallabas el tiro libre adicional y
  capturabas el rebote ofensivo, los 2 o 3 puntos de la canasta no se contaban al
  cerrar la posesión. Lo mismo con tiros libres anotados antes de un último TL fallado
  con rebote ofensivo. Ahora los puntos se apuntan en cuanto se producen y el banner
  te enseña en todo momento cuántos lleva la posesión.
- **El teclado de dorsal en "Datos administrativos" no funcionaba**: al pulsar los
  números no se veía lo que escribías, porque repintaba el panel equivocado.
- **La marca "tras pérdida" se perdía** al cerrar y reabrir la app, porque ese dato no
  se guardaba. Ahora sí.

### Otras mejoras
- **Deshacer** rehecho con instantáneas del estado: deshace cualquier acción, incluidas
  faltas personales y tiempos muertos, sin dejar la posesión en un estado raro. Una
  acción de deshacer sobrevive incluso a cerrar la app.
- **Exportar CSV desde el móvil** usa la hoja de compartir de iOS (Archivos, Mail,
  AirDrop), que es lo que funciona de forma fiable en una app instalada. Si no está
  disponible, descarga normal y, en último caso, copia al portapapeles.
- **Copia de seguridad completa en JSON**, con importación, para pasar datos de un
  móvil a otro o rescatar un partido.
- El historial pinta solo las últimas 120 posesiones, para que los botones no vayan a
  tirones al final de un partido largo.
- Los paneles que dejes abiertos siguen abiertos al reabrir la app.
- Pantalla de emergencia mejorada: antes de borrar nada te deja **descargar los datos
  en bruto**, por si se pueden rescatar.
- Los partidos ya archivados en la versión anterior **se conservan**: la app lee la
  misma clave de almacenamiento.

---

## 6. Actualizar la app más adelante

1. Cambia los archivos y vuelve a subirlos al hosting.
2. En `sw.js`, sube el número de `VERSION` (por ejemplo a `1.0.1`). Ese número es lo
   que fuerza a los móviles a descargar la versión nueva.
3. En el móvil, abre la app con conexión. Se descarga en segundo plano y se aplica la
   siguiente vez que la abras.

La app **nunca se recarga sola**: recargar en mitad de un partido sería peor que
quedarse con la versión antigua. Solo avisa de que hay una versión nueva.

---

## 7. Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | La app entera: interfaz, lógica y estilos. Sin dependencias externas. |
| `manifest.webmanifest` | Nombre, icono, colores y modo pantalla completa. |
| `sw.js` | Service worker: caché offline y control de versión. |
| `icons/` | Iconos de la app (incluido el de iOS, 180 px). |

Sigue siendo JavaScript plano, sin frameworks ni compilación: se edita y se sube tal
cual, igual que antes.

---

## 8. Notas técnicas (para el anexo del manual)

- **Estado**: objeto `state` (rival, fecha, cuarto, posesiones, posesión activa, faltas
  personales, tiempos muertos, `afterTurnoverTeam`, estado de la interfaz).
- **Puntos en curso**: cada posesión lleva `carry`, los puntos ya consolidados dentro
  de la posesión (canasta de un "y uno", tiros libres anotados). Al cerrarla se suman a
  los puntos de la acción final. Es lo que arregla el error de conteo.
- **Claves de almacenamiento**:
  - `cbt_posesiones_state_v2` — partido en curso
  - `cbt_posesiones_prev_v2` — estado anterior (un deshacer que sobrevive al cierre)
  - `cbt_posesiones_backup_v2` — copia cada 20 acciones
  - `cbt_partidos_guardados_v1` — archivo de partidos (misma clave que la v1)
  - IndexedDB `cbt-posesiones`, almacén `kv`, claves `state`, `backup`, `matches`
- **`normalizeState()`** sanea cualquier dato guardado con forma inesperada antes de
  pintar, y todo el arranque va dentro de un `try/catch` que cae en la pantalla de
  recuperación.
- **Ciclo de vida**: `visibilitychange`, `pagehide`, `blur`, `freeze` y `beforeunload`
  fuerzan guardado inmediato. Un latido cada 30 s reasegura el guardado y vuelve a
  pedir el bloqueo de pantalla si iOS lo soltó.
- **Métricas**: sin cambios respecto a la v1 (eFG%, TOV% por posesiones del equipo,
  ORB% sobre ORB propios + DRB rivales, FT Rate, puntos de 2ª oportunidad por posesión
  con rebote ofensivo, puntos tras pérdida por posesión encadenada).
