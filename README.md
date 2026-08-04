# ⚽ Copero Career Editor

Editor avanzado para modificar localmente una partida del **Career Simulator de Copero** desde la consola del navegador.

Permite cambiar el OVR, valor de mercado, edad, posición, equipo, estadísticas, temporadas, trofeos, premios y prácticamente cualquier dato interno de la partida.

> [!IMPORTANT]
> Los cambios solo afectan la partida abierta en la pestaña actual.
> El editor no modifica el servidor de Copero.
> Al recargar la página, normalmente se perderán los cambios.

---

## 📑 Contenido

* [¿Qué es Copero Career Editor?](#-qué-es-copero-career-editor)
* [Características](#-características)
* [Requisitos](#-requisitos)
* [Instalación](#-instalación)
* [Cómo abrir la consola](#-cómo-abrir-la-consola)
* [Primeros pasos](#-primeros-pasos)
* [Comandos sin paréntesis](#-comandos-sin-paréntesis)
* [Modificar al jugador](#-modificar-al-jugador)
* [Modificar temporadas](#-modificar-temporadas)
* [Trofeos y premios](#-trofeos-y-premios)
* [Estadísticas totales](#-estadísticas-totales)
* [Modificar cualquier propiedad](#-modificar-cualquier-propiedad)
* [Backups](#-backups)
* [Undo y redo](#-undo-y-redo)
* [Exportar e importar partidas](#-exportar-e-importar-partidas)
* [Panel visual](#-panel-visual)
* [Watcher](#-watcher)
* [Personalizar el prefijo](#-personalizar-el-prefijo)
* [Ejemplos completos](#-ejemplos-completos)
* [Solución de errores](#-solución-de-errores)
* [Seguridad](#-seguridad)
* [Limitaciones](#-limitaciones)

---

# 🎮 ¿Qué es Copero Career Editor?

Copero Career Editor es un script de JavaScript que busca la partida activa dentro del estado interno de React utilizado por la página.

Después de localizarla, crea una herramienta global llamada:

```javascript
careerEditor
```

Desde la consola puedes ejecutar comandos como:

```javascript
careerEditor.overall(99)
```

```javascript
careerEditor.price(300_000_000)
```

```javascript
careerEditor.addTrophy("world_cup")
```

```javascript
careerEditor.backup("antes-de-editar")
```

El editor crea copias del estado antes de muchos cambios, por lo que también puedes deshacer, rehacer o restaurar la partida original.

---

# ✨ Características

## Jugador

Puedes modificar:

* OVR.
* Valor de mercado.
* Edad.
* Apellido.
* Dorsal.
* Pie preferido.
* Posición.
* Equipo actual.
* Cualquier otra propiedad interna mediante rutas.

## Temporadas

Puedes modificar:

* La última temporada.
* La primera temporada.
* Una temporada específica.
* Todas las temporadas.
* OVR de una temporada.
* Valor de mercado.
* Edad.
* Equipo.
* Apariciones.
* Goles.
* Asistencias.
* Porterías a cero.
* Goles recibidos.
* Trofeos.
* Premios.

## Herramientas adicionales

También incluye:

* Backup automático de la partida original.
* Backups manuales.
* Undo.
* Redo.
* Exportación a JSON.
* Importación desde JSON.
* Descarga del estado de la partida.
* Panel visual.
* Observador de cambios.
* Diagnóstico del localizador React.
* Editor genérico por rutas.

---

# ✅ Requisitos

Necesitas:

1. Un navegador de escritorio, preferiblemente Chrome, Edge, Brave o Firefox.
2. Tener abierta la página del Career Simulator.
3. Haber iniciado o cargado una partida.
4. Tener acceso a las herramientas de desarrollador del navegador.
5. Poder pegar código en la consola.

No necesitas:

* Instalar extensiones.
* Descargar programas.
* Modificar archivos del navegador.
* Tener conocimientos avanzados de programación.

---

# 🚀 Instalación

El archivo principal se encuentra en:

```text
https://github.com/JollyJolli/copero/blob/main/main.js
```

La consola no debe cargar la vista normal de GitHub porque esa página contiene HTML. Debe cargar la versión RAW del archivo:

```text
https://raw.githubusercontent.com/JollyJolli/copero/main/main.js
```

## Loader recomendado

Abre la consola y pega:

```javascript
fetch(
  `https://raw.githubusercontent.com/JollyJolli/copero/main/main.js?t=${Date.now()}`
)
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.text();
  })
  .then(code => {
    (0, eval)(code);
  })
  .catch(error => {
    console.error("No se pudo cargar Copero Career Editor:", error);
  });
```

## Loader en una sola línea

```javascript
fetch(`https://raw.githubusercontent.com/JollyJolli/copero/main/main.js?t=${Date.now()}`).then(r=>{if(!r.ok)throw Error(`HTTP ${r.status}`);return r.text()}).then(code=>(0,eval)(code)).catch(console.error);
```

El parámetro:

```javascript
?t=${Date.now()}
```

evita que el navegador reutilice una versión antigua del archivo guardada en caché.

Cada vez que actualices `main.js` en GitHub, vuelve a ejecutar el loader para cargar la versión más reciente.

---

# 🖥️ Cómo abrir la consola

## Chrome, Edge o Brave

1. Abre el Career Simulator.
2. Inicia una partida.
3. Pulsa `F12`.
4. Abre la pestaña **Console**.
5. Pega el loader.
6. Pulsa `Enter`.

También puedes usar:

```text
Ctrl + Shift + J
```

En macOS:

```text
Command + Option + J
```

## Advertencia al pegar código

Algunos navegadores muestran una advertencia para evitar que usuarios peguen código desconocido.

Lee la advertencia del navegador y sigue sus instrucciones únicamente si entiendes y confías en el código que vas a ejecutar.

---

# 🟢 Primeros pasos

Después de ejecutar el loader, debería aparecer un mensaje parecido a:

```text
careerEditor v2.0.0 cargado correctamente
```

Para mostrar la ayuda:

```javascript
careerEditor.help
```

Para comprobar que el editor encontró la partida:

```javascript
careerEditor.status
```

Para obtener una copia completa del estado:

```javascript
careerEditor.get
```

Para cambiar el OVR:

```javascript
careerEditor.overall(99)
```

Para cambiar el valor de mercado:

```javascript
careerEditor.price(300_000_000)
```

---

# ⚠️ Comandos sin paréntesis

Algunos comandos son propiedades especiales y se ejecutan simplemente al escribir su nombre.

Estos comandos no necesitan paréntesis:

```javascript
careerEditor.help
```

```javascript
careerEditor.status
```

```javascript
careerEditor.get
```

```javascript
careerEditor.backups
```

```javascript
careerEditor.history
```

```javascript
careerEditor.examples
```

```javascript
careerEditor.known
```

```javascript
careerEditor.config
```

No escribas:

```javascript
careerEditor.help()
```

La forma correcta es:

```javascript
careerEditor.help
```

Los demás comandos sí son funciones y utilizan paréntesis:

```javascript
careerEditor.overall(99)
```

```javascript
careerEditor.backup("mi-backup")
```

```javascript
careerEditor.panel()
```

---

# 👤 Modificar al jugador

## Cambiar el OVR

```javascript
careerEditor.overall(99)
```

Esto modifica el OVR actual del jugador.

## Cambiar el OVR actual y la última temporada

```javascript
careerEditor.overall(99, {
  lastSeason: true
});
```

## Cambiar el valor de mercado

```javascript
careerEditor.price(300_000_000)
```

Los guiones bajos hacen que los números grandes sean más fáciles de leer:

```javascript
300_000_000
```

es igual a:

```javascript
300000000
```

## Cambiar la edad

```javascript
careerEditor.age(24)
```

## Cambiar el apellido

```javascript
careerEditor.name("JOLLY")
```

## Cambiar el dorsal

```javascript
careerEditor.number(10)
```

El dorsal debe encontrarse entre 1 y 99.

## Cambiar el pie preferido

```javascript
careerEditor.foot("left")
```

```javascript
careerEditor.foot("right")
```

## Cambiar la posición

```javascript
careerEditor.position("ST")
```

Posiciones conocidas:

```text
LW
ST
RW
LM
CAM
RM
LB
CM
RB
CDM
CB
GK
```

## Cambiar el equipo

Debes utilizar el identificador interno del equipo:

```javascript
careerEditor.team("barcelona")
```

```javascript
careerEditor.team("real-madrid")
```

Cambiar manualmente el equipo puede producir inconsistencias si se utiliza un identificador inexistente.

## Cambiar varios datos al mismo tiempo

```javascript
careerEditor.player({
  overall: 99,
  price: 300_000_000,
  age: 24,
  name: "JOLLY",
  number: 10,
  foot: "left",
  position: "ST"
});
```

También puedes utilizar los nombres internos:

```javascript
careerEditor.player({
  overall: 99,
  marketValue: 300_000_000,
  age: 24,
  lastName: "JOLLY",
  preferredNumber: 10,
  preferredFoot: "left",
  position: "ST"
});
```

El editor acepta varios alias:

| Alias sencillo | Propiedad interna |
| -------------- | ----------------- |
| `ovr`          | `overall`         |
| `rating`       | `overall`         |
| `price`        | `marketValue`     |
| `value`        | `marketValue`     |
| `name`         | `lastName`        |
| `surname`      | `lastName`        |
| `number`       | `preferredNumber` |
| `foot`         | `preferredFoot`   |
| `team`         | `currentTeamId`   |

Ejemplo:

```javascript
careerEditor.player({
  ovr: 99,
  value: 500_000_000,
  surname: "GOAT"
});
```

---

# 📅 Modificar temporadas

Cada temporada puede contener:

```javascript
{
  id: "...",
  index: 1,
  periodIndex: 1,
  age: 16,
  teamId: "equipo",
  overall: 70,
  marketValue: 5000000,
  stats: {
    appearances: 30,
    goals: 20,
    assists: 10,
    cleanSheets: 0,
    goalsConceded: 0
  },
  trophies: [],
  awards: []
}
```

## Última temporada

```javascript
careerEditor.lastSeason({
  overall: 99,
  price: 300_000_000
});
```

## Primera temporada

```javascript
careerEditor.season("first", {
  overall: 90
});
```

## Temporada número 3

Los números comienzan en 1:

```javascript
careerEditor.season(3, {
  overall: 95,
  price: 150_000_000
});
```

## Todas las temporadas

```javascript
careerEditor.allSeasons({
  overall: 99
});
```

## Modificar las estadísticas de una temporada

```javascript
careerEditor.lastSeason({
  stats: {
    appearances: 60,
    goals: 55,
    assists: 25,
    cleanSheets: 0,
    goalsConceded: 0
  }
});
```

No es necesario incluir todas las estadísticas.

Por ejemplo, para modificar únicamente los goles:

```javascript
careerEditor.lastSeason({
  stats: {
    goals: 80
  }
});
```

## Buscar temporadas por datos

También puedes usar un objeto como selector:

```javascript
careerEditor.season(
  {
    age: 24
  },
  {
    overall: 99
  }
);
```

Por equipo:

```javascript
careerEditor.season(
  {
    teamId: "barcelona"
  },
  {
    overall: 99
  }
);
```

Por periodo:

```javascript
careerEditor.season(
  {
    periodIndex: 3
  },
  {
    overall: 97
  }
);
```

Si varias temporadas coinciden, el editor modificará todas las coincidencias.

---

# 🏆 Trofeos y premios

## Trofeos conocidos

```text
league
cup
continental_primary
continental_secondary
club_world_cup
national_continental
world_cup
```

Significado aproximado:

| Identificador           | Significado                        |
| ----------------------- | ---------------------------------- |
| `league`                | Liga nacional                      |
| `cup`                   | Copa nacional                      |
| `continental_primary`   | Competición continental principal  |
| `continental_secondary` | Competición continental secundaria |
| `club_world_cup`        | Mundial de Clubes                  |
| `national_continental`  | Torneo continental de selecciones  |
| `world_cup`             | Mundial de selecciones             |

## Premios conocidos

```text
ballon_dor
golden_boot
golden_glove
```

| Identificador  | Significado   |
| -------------- | ------------- |
| `ballon_dor`   | Balón de Oro  |
| `golden_boot`  | Bota de Oro   |
| `golden_glove` | Guante de Oro |

## Añadir un Mundial

```javascript
careerEditor.addTrophy("world_cup")
```

Por defecto, se añade a la última temporada.

## Añadir una Champions o competición continental principal

```javascript
careerEditor.addTrophy("continental_primary")
```

## Añadir un Balón de Oro

```javascript
careerEditor.addAward("ballon_dor")
```

## Añadir una Bota de Oro

```javascript
careerEditor.addAward("golden_boot")
```

## Añadir a una temporada específica

```javascript
careerEditor.addTrophy(
  "world_cup",
  5
);
```

Añade el Mundial a la temporada número 5.

## Añadir a todas las temporadas

```javascript
careerEditor.addTrophy(
  "league",
  "all"
);
```

## Eliminar un trofeo

```javascript
careerEditor.removeTrophy("world_cup")
```

## Eliminar un premio

```javascript
careerEditor.removeAward("ballon_dor")
```

## Importante sobre trofeos repetidos

El comando:

```javascript
careerEditor.addTrophy("world_cup")
```

evita añadir dos veces el mismo trofeo dentro de una única temporada.

Esto significa que si deseas diez Mundiales mediante los comandos normales, puedes repartir uno entre diez temporadas diferentes.

Ejemplo:

```javascript
for (let temporada = 1; temporada <= 10; temporada++) {
  careerEditor.addTrophy(
    "world_cup",
    temporada
  );
}
```

Este ejemplo requiere al menos diez temporadas terminadas.

## Añadir exactamente diez Mundiales repetidos

Para añadir diez entradas de `world_cup`, incluso si están repetidas en una misma temporada:

```javascript
(() => {
  const partida = careerEditor.get;
  const ultimaTemporada = partida.seasons.at(-1);

  if (!ultimaTemporada) {
    throw new Error(
      "Todavía no tienes temporadas terminadas."
    );
  }

  ultimaTemporada.trophies ??= [];

  for (let i = 0; i < 10; i++) {
    ultimaTemporada.trophies.push("world_cup");
  }

  careerEditor.import(partida);
  careerEditor.recalculateTotals();
})();
```

Dependiendo de cómo la interfaz procese los trofeos, las entradas repetidas pueden mostrarse individualmente o producir resultados visuales inesperados.

---

# 📊 Estadísticas totales

Modificar directamente las estadísticas totales:

```javascript
careerEditor.totals({
  appearances: 500,
  goals: 400,
  assists: 200,
  cleanSheets: 50,
  goalsConceded: 100,
  trophies: 20,
  awards: 8
});
```

Puedes modificar solamente una propiedad:

```javascript
careerEditor.totals({
  goals: 1000
});
```

## Recalcular los totales

Después de modificar temporadas, puedes recalcular los totales:

```javascript
careerEditor.recalculateTotals()
```

El editor recorrerá las temporadas y los periodos de selección para sumar:

* Apariciones.
* Goles.
* Asistencias.
* Porterías a cero.
* Goles recibidos.
* Trofeos.
* Premios.

---

# 🛠️ Modificar cualquier propiedad

El editor incluye comandos avanzados para modificar propiedades mediante rutas.

## Obtener el estado completo

```javascript
careerEditor.get
```

En Chrome puedes expandir el objeto y explorar sus propiedades.

## Cambiar una ruta

```javascript
careerEditor.set(
  "player.overall",
  99
);
```

```javascript
careerEditor.set(
  "player.marketValue",
  500_000_000
);
```

```javascript
careerEditor.set(
  "seasons[0].stats.goals",
  100
);
```

```javascript
careerEditor.set(
  "seasons[2].overall",
  99
);
```

Los índices de arrays utilizados en rutas comienzan en 0:

```text
seasons[0] = primera temporada
seasons[1] = segunda temporada
seasons[2] = tercera temporada
```

## Fusionar objetos

```javascript
careerEditor.merge(
  "totals",
  {
    goals: 500,
    assists: 300
  }
);
```

## Eliminar una propiedad

```javascript
careerEditor.remove(
  "player.developmentProfile"
);
```

Usa los comandos genéricos con cuidado. Eliminar o reemplazar propiedades necesarias puede romper la partida.

El editor bloquea rutas peligrosas como:

```text
__proto__
prototype
constructor
```

---

# 💾 Backups

## Backup original

Cuando el editor se carga correctamente, crea automáticamente un backup llamado:

```text
original
```

Puedes restaurarlo con:

```javascript
careerEditor.restore("original")
```

## Crear un backup manual

```javascript
careerEditor.backup("antes-de-modificar")
```

## Crear un backup con nombre automático

```javascript
careerEditor.backup()
```

El nombre incluirá la fecha y hora.

Ejemplo:

```text
backup-20260803-201800
```

## Ver todos los backups

```javascript
careerEditor.backups
```

## Restaurar un backup

```javascript
careerEditor.restore("antes-de-modificar")
```

## Eliminar un backup

```javascript
careerEditor.deleteBackup("antes-de-modificar")
```

Los backups se guardan únicamente en la memoria de la pestaña.

Si recargas o cierras la página, se eliminan.

---

# ↩️ Undo y redo

## Deshacer

```javascript
careerEditor.undo()
```

Deshace el último cambio realizado mediante el editor.

## Rehacer

```javascript
careerEditor.redo()
```

Restaura el último cambio deshecho.

## Ver el historial

```javascript
careerEditor.history
```

Por defecto, el editor conserva hasta 50 entradas del historial.

Los cambios efectuados directamente por la página o por código externo pueden no aparecer en este historial.

---

# 📤 Exportar e importar partidas

## Exportar y copiar al portapapeles

```javascript
await careerEditor.export()
```

El editor convierte la partida a JSON y trata de copiarla al portapapeles.

## Exportar sin copiar

```javascript
const json = await careerEditor.export({
  copy: false
});
```

## Exportar sin formato

```javascript
const json = await careerEditor.export({
  pretty: false,
  copy: false
});
```

## Descargar como archivo JSON

```javascript
careerEditor.download()
```

Con nombre personalizado:

```javascript
careerEditor.download(
  "mi-carrera.json"
);
```

## Importar desde JSON

```javascript
careerEditor.import(json)
```

## Importar desde un objeto

```javascript
const partida = careerEditor.get;

partida.player.overall = 99;

careerEditor.import(partida);
```

El contenido importado debe conservar la estructura principal de una partida válida.

---

# 🪟 Panel visual

Para abrir el panel:

```javascript
careerEditor.panel()
```

El panel permite modificar rápidamente:

* OVR.
* Precio.
* Edad.
* Dorsal.
* Apellido.

También incluye botones para:

* Crear un backup.
* Deshacer.
* Restaurar el estado original.

Puedes moverlo arrastrando su cabecera.

Para cerrarlo:

```javascript
careerEditor.closePanel()
```

---

# 👀 Watcher

El watcher comprueba periódicamente si la partida cambió.

## Activarlo

```javascript
careerEditor.watch()
```

Por defecto, revisa el estado cada segundo.

## Cambiar el intervalo

```javascript
careerEditor.watch(2000)
```

Esto revisa los cambios cada 2000 milisegundos.

El intervalo mínimo permitido es de 250 milisegundos.

## Detenerlo

```javascript
careerEditor.unwatch()
```

El watcher puede ser útil para comprender qué propiedades modifica el juego al avanzar una temporada o tomar una decisión.

---

# 🏷️ Personalizar el prefijo

Al inicio de `main.js` encontrarás:

```javascript
const PREFIX = 'careerEditor.';
```

Puedes cambiarlo por:

```javascript
const PREFIX = 'jolly.';
```

Después de volver a cargar el script, los comandos serán:

```javascript
jolly.help
```

```javascript
jolly.overall(99)
```

```javascript
jolly.price(300_000_000)
```

El prefijo debe convertirse en un nombre válido de JavaScript.

Ejemplos válidos:

```javascript
const PREFIX = 'careerEditor.';
```

```javascript
const PREFIX = 'jolly.';
```

```javascript
const PREFIX = 'coperoEditor.';
```

Evita espacios, guiones y símbolos extraños:

```javascript
const PREFIX = 'mi editor.';
```

```javascript
const PREFIX = 'career-editor.';
```

---

# 🧪 Ejemplos completos

## OVR 99

```javascript
careerEditor.overall(99)
```

## OVR 99 y precio de 500 millones

```javascript
careerEditor.player({
  overall: 99,
  price: 500_000_000
});
```

## OVR 99 en el jugador y la última temporada

```javascript
careerEditor.overall(99, {
  lastSeason: true
});
```

## Temporada perfecta

```javascript
careerEditor.lastSeason({
  overall: 99,
  price: 500_000_000,

  stats: {
    appearances: 60,
    goals: 60,
    assists: 30,
    cleanSheets: 0,
    goalsConceded: 0
  },

  trophies: [
    "league",
    "cup",
    "continental_primary",
    "club_world_cup",
    "world_cup"
  ],

  awards: [
    "ballon_dor",
    "golden_boot"
  ]
});
```

## Jugador completo

```javascript
careerEditor.player({
  overall: 99,
  price: 500_000_000,
  age: 25,
  name: "JOLLY",
  number: 10,
  foot: "left",
  position: "ST"
});
```

## Diez Mundiales y OVR 99

```javascript
(() => {
  const partida = careerEditor.get;

  if (!partida.player) {
    throw new Error(
      "No existe un jugador activo."
    );
  }

  const ultimaTemporada = partida.seasons.at(-1);

  if (!ultimaTemporada) {
    throw new Error(
      "Todavía no tienes temporadas terminadas."
    );
  }

  partida.player.overall = 99;
  ultimaTemporada.overall = 99;

  ultimaTemporada.trophies ??= [];

  ultimaTemporada.trophies.push(
    ...Array(10).fill("world_cup")
  );

  careerEditor.import(partida);
  careerEditor.recalculateTotals();
})();
```

## Poner OVR 99 en todas las temporadas

```javascript
careerEditor.allSeasons({
  overall: 99
});
```

Después, poner también el OVR actual en 99:

```javascript
careerEditor.overall(99)
```

## Añadir todos los trofeos conocidos

```javascript
careerEditor.lastSeason({
  trophies: [
    "league",
    "cup",
    "continental_primary",
    "continental_secondary",
    "club_world_cup",
    "national_continental",
    "world_cup"
  ]
});
```

## Añadir todos los premios conocidos

```javascript
careerEditor.lastSeason({
  awards: [
    "ballon_dor",
    "golden_boot",
    "golden_glove"
  ]
});
```

## Hacer backup, editar y poder restaurar

```javascript
careerEditor.backup("antes-del-experimento");

careerEditor.player({
  overall: 99,
  price: 999_000_000
});
```

Para restaurar:

```javascript
careerEditor.restore(
  "antes-del-experimento"
);
```

---

# 🔍 Comandos de información

## Mostrar ayuda

```javascript
careerEditor.help
```

## Mostrar ejemplos

```javascript
careerEditor.examples
```

## Mostrar valores conocidos

```javascript
careerEditor.known
```

Incluye:

* Posiciones.
* Pies válidos.
* Trofeos.
* Premios.
* Fases conocidas.

## Mostrar configuración

```javascript
careerEditor.config
```

## Diagnóstico

```javascript
careerEditor.diagnose()
```

El diagnóstico muestra información como:

* Versión del editor.
* Prefijo.
* URL de la página.
* Si encontró React.
* Fase de la partida.
* Seed.
* Cantidad de backups.
* Historial disponible.
* Estado del watcher.
* Estado del panel.

## Volver a buscar la partida

```javascript
careerEditor.refresh()
```

Úsalo si cargaste el editor antes de iniciar la partida.

## Desinstalar el editor

```javascript
careerEditor.destroy()
```

Después de destruirlo, vuelve a ejecutar el loader si deseas cargarlo nuevamente.

---

# 🧯 Solución de errores

## “No encontré el estado React del simulador”

Causas posibles:

* No has abierto el Career Simulator.
* La partida todavía no comenzó.
* Hay una animación en proceso.
* La página cambió su estructura interna.
* Ejecutaste el editor en una página diferente.

Solución:

1. Abre el Career Simulator.
2. Inicia una partida.
3. Espera a que termine cualquier animación.
4. Ejecuta:

```javascript
careerEditor.refresh()
```

Si todavía no cargaste el editor, vuelve a ejecutar el loader.

---

## `careerEditor is not defined`

Significa que el script no se cargó correctamente.

Vuelve a ejecutar:

```javascript
fetch(`https://raw.githubusercontent.com/JollyJolli/copero/main/main.js?t=${Date.now()}`).then(r=>{if(!r.ok)throw Error(`HTTP ${r.status}`);return r.text()}).then(code=>(0,eval)(code)).catch(console.error);
```

También comprueba:

* Que el repositorio sea público.
* Que el archivo se llame `main.js`.
* Que el archivo esté en la rama `main`.
* Que la URL RAW abra el código JavaScript.
* Que no exista un error de sintaxis dentro de `main.js`.

---

## Error HTTP 404

La ruta no existe.

La estructura esperada es:

```text
JollyJolli/
└── copero/
    └── main.js
```

En la rama:

```text
main
```

URL RAW esperada:

```text
https://raw.githubusercontent.com/JollyJolli/copero/main/main.js
```

---

## GitHub muestra HTML o texto extraño

No ejecutes la URL:

```text
https://github.com/JollyJolli/copero/blob/main/main.js
```

Esa es la vista visual de GitHub.

Usa:

```text
https://raw.githubusercontent.com/JollyJolli/copero/main/main.js
```

---

## El cambio aparece y después desaparece

Puede suceder cuando:

* La partida avanza.
* Una animación todavía está aplicando el estado siguiente.
* El juego recalcula el OVR o el precio.
* Ejecutaste el comando durante una transición.

Espera a que la interfaz esté quieta y vuelve a ejecutar el comando.

Para mayor seguridad:

```javascript
careerEditor.backup(
  "antes-del-cambio"
);
```

---

## El total de trofeos no cambió

Después de modificar temporadas:

```javascript
careerEditor.recalculateTotals()
```

---

## `careerEditor.help()` produce error

`help` no es una función.

Incorrecto:

```javascript
careerEditor.help()
```

Correcto:

```javascript
careerEditor.help
```

---

## No puedo restaurar después de recargar

Los backups se guardan en memoria.

Al recargar la página desaparecen:

* El editor.
* Los backups.
* El historial.
* Undo.
* Redo.

Para conservar una partida, expórtala antes de recargar:

```javascript
careerEditor.download(
  "backup-carrera.json"
);
```

---

# ⚠️ Limitaciones

* El editor depende de propiedades internas de React.
* Una actualización de Copero puede romper el localizador.
* Los cambios no son permanentes en el servidor.
* Recargar la página elimina los cambios locales.
* El juego puede recalcular ciertos valores al avanzar.
* Identificadores incorrectos de equipos pueden generar inconsistencias.
* Trofeos duplicados pueden mostrarse de manera inesperada.
* Las propiedades internas pueden cambiar entre versiones.
* El editor está diseñado para uso local y experimental.
* No garantiza compatibilidad futura con todas las versiones de Copero.

---

# 📌 Referencia rápida

```javascript
// Ayuda
careerEditor.help

// Estado
careerEditor.status

// Partida completa
careerEditor.get

// OVR
careerEditor.overall(99)

// Precio
careerEditor.price(300_000_000)

// Jugador
careerEditor.player({
  overall: 99,
  price: 300_000_000,
  age: 24
})

// Última temporada
careerEditor.lastSeason({
  overall: 99
})

// Añadir Mundial
careerEditor.addTrophy("world_cup")

// Añadir Balón de Oro
careerEditor.addAward("ballon_dor")

// Recalcular totales
careerEditor.recalculateTotals()

// Backup
careerEditor.backup("mi-backup")

// Restaurar
careerEditor.restore("mi-backup")

// Deshacer
careerEditor.undo()

// Rehacer
careerEditor.redo()

// Panel
careerEditor.panel()

// Diagnóstico
careerEditor.diagnose()
```

---

# 📜 Aviso

Este proyecto no está afiliado oficialmente con Copero.

Es una herramienta experimental para modificar localmente el estado visible de una partida dentro del navegador.

Utilízala bajo tu propia responsabilidad.
