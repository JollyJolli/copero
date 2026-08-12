# Copero Career Editor O1

Editor modular para modificar localmente una partida abierta del Career Simulator de Copero. Actúa sobre el estado React de la pestaña; no modifica servidores. Haz un backup antes de experimentar y evita importar estados que no sean tuyos.

> [!IMPORTANT]
> **O1 es la primera versión oficial de Copero Career Editor.** Sigue siendo recomendable crear backups frecuentes porque Copero puede cambiar su código sin aviso. Si encuentras un problema o tienes una sugerencia, escríbeme en X (Twitter): [@kuikilod](https://x.com/kuikilod).

## Instalación y loader

```bash
npm install
npm run build
npm test
```

Carga `main.js` desde la consola como antes:

```js
fetch(`https://raw.githubusercontent.com/JollyJolli/copero/main/main.js?t=${Date.now()}`)
  .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
  .then(code => (0, eval)(code)).catch(console.error);
```

## Móvil: sin consola

El archivo [para-poner-en-la-consola.js](para-poner-en-la-consola.js) es un userscript ya listo: descarga la versión actual del editor, añade un botón con la bandera del jugador y abre el panel cuando entras a una carrera. El panel móvil permite cambiar el OVR, sumar goles, asistencias o partidos, añadir logros individuales o completar una temporada según la posición y reemplazar ofertas de clubes con filtros avanzados.

> [!TIP]
> Si ya instalaste el userscript, **no tienes que volver a descargarlo**. Cada vez que carga Copero obtiene el `main.js` más reciente; después de una actualización basta con recargar la página.

### iPhone y iPad

Usa Safari con la app/extensión [Userscripts](https://github.com/extratone/userscripts-safari). Requiere iOS o iPadOS 15.1 o superior.

1. Instala Userscripts desde App Store.
2. Ve a `Ajustes > Extensiones > Userscripts`, actívala y permite acceso a todos los sitios.
3. Abre Userscripts, toca **Set Userscripts Directory** y elige una carpeta de Files.
4. Descarga el archivo real [para-poner-en-la-consola.js](para-poner-en-la-consola.js) desde GitHub y muévelo a esa carpeta. **No intentes crearlo ni renombrar un TXT en iOS**: debe ser el archivo descargado con extensión `.js`.
5. Abre el popup de Userscripts una vez para que detecte el archivo y déjalo activado.
6. Abre `copero.com.ar` en Safari, entra a una carrera y toca el botón con la bandera del jugador.

### Android

Usa Firefox para Android con un gestor de userscripts compatible, como Tampermonkey. Instálalo desde el administrador de extensiones, importa o abre el archivo descargado [para-poner-en-la-consola.js](para-poner-en-la-consola.js) desde el gestor y actívalo para `copero.com.ar`. Después entra a una carrera y toca el botón con la bandera.

El userscript solo se ejecuta en `copero.com.ar` y sigue usando el mismo `main.js` oficial del repositorio. Si cierras el panel, el botón con la bandera lo vuelve a abrir.

El `eval` pertenece únicamente al loader. El editor empaquetado no usa imports, Node ni código remoto en ejecución. `src/config.js` contiene el prefijo y la versión. `npm run dev` observa `src/` y regenera `main.js` sin iniciar servidor.

## Arquitectura

- `src/core`: React locator, StateManager, comandos, validación, rutas, historial, backups y logging.
- `src/modules`: jugador, temporadas, estadísticas, trofeos/premios, clubes, presets, importación y watcher.
- `src/help` y `src/ui`: ayuda generada y paneles Shadow DOM.
- `main.js`: artefacto IIFE generado; no editar a mano.
- `legacy/main-v2.js`: copia del editor anterior.

## Uso

```js
careerEditor.help
careerEditor.helpFor('clubs')
careerEditor.helpCommand('overall')
careerEditor.overall(99)
careerEditor.player.set({ overall: 95, price: 200_000_000 })
careerEditor.seasons.edit('last', { overall: 95 })
careerEditor.stats.add({ goals: 10, assists: 5 })
careerEditor.trophies.add('world_cup')
careerEditor.mobileSpecials.ovr99(true)
careerEditor.mobileSpecials.autoAll(true)
careerEditor.mobileSpecials.godMode(true)
careerEditor.mobileSpecials.stopAll()
careerEditor.addAllSeason() // completa solo los trofeos y premios faltantes de la última temporada
careerEditor.aas() // alias corto
careerEditor.addLegitSeason() // completa trofeos y premios compatibles con la posición
careerEditor.als() // alias corto de la opción realista
careerEditor.decisions.good() // prepara el resultado bueno de la decisión actual
careerEditor.decisions.bad() // prepara el resultado malo
careerEditor.decisions.auto() // cancela el resultado preparado antes de elegir
careerEditor.backup('antes')
careerEditor.undo()
```

El nombre global puede cambiarse temporalmente para la pestaña actual:

```js
careerEditor.setPrefix('p')
p.panel()
p.help
```

El cambio no usa almacenamiento y desaparece al recargar. El nombre anterior deja de estar disponible.

Los aliases v2 (`player`, `overall`, `price`, `season`, `lastSeason`, `addTrophy`, etc.) llaman a los mismos comandos organizados.

## Decisiones buenas o malas

Ejecuta el comando mientras la decisión esté visible y después pulsa normalmente una de las opciones con azar que indique la consola:

```js
careerEditor.decisions.outcome('positive') // también acepta "good" o "buena"
careerEditor.decisions.outcome('negative') // también acepta "bad" o "mala"
careerEditor.decisions.status()
careerEditor.decisions.auto()
```

El override modifica de manera reversible el siguiente valor del RNG real de Copero; no simula el resultado ni parchea los botones. Solo funciona en eventos que tengan una posibilidad real positiva/negativa, como entrenamiento extra, sustancia misteriosa, penal decisivo o lesión en el mejor momento. Las decisiones con efecto fijo mostrarán un error porque no existe un resultado bueno o malo que forzar. El ajuste es de un solo uso y `auto()` puede cancelarlo antes de elegir.

## Clubes

```js
careerEditor.clubs.list({ country: 'ES', division: 1 })
careerEditor.clubs.search('Barcelona')
careerEditor.clubs.offers()
careerEditor.clubs.replaceOffer(1, 'barcelona')
careerEditor.clubs.addOffer('barcelona')
careerEditor.clubs.choose('barcelona', { strategy: 'replace', offer: 1 })
careerEditor.clubs.panel()
```

`clubs.list()` y `clubs.search()` muestran en consola una tabla limpia con país, competición e ID; el array devuelto conserva todos los datos del club. El panel principal incluye un mercado completo para buscar clubes, filtrar por país, competición, división y reputación, seleccionar una oferta y reemplazarla o añadir otra sin escribir comandos.

El panel mantiene un botón `AAS` fijo para completar los logros faltantes de la última temporada. La sección **Comandos** permite buscar toda la API y ejecutarla con argumentos escritos como un array JSON, por ejemplo `["barcelona"]`; los comandos peligrosos siempre piden confirmación.

En pantallas de hasta 640 px se abre automáticamente el panel móvil O1, un dashboard táctil organizado en **Inicio**, **Especiales**, **Logros** y **Clubes**. Inicio concentra OVR y estadísticas con incrementos rápidos o cantidad manual; Logros ofrece un completado realista por posición y conserva cada premio como opción manual; Clubes permite combinar búsqueda, país, competición, división y reputación. **Especiales para celular** incluye OVR 99 Freeze, temporadas realistas automáticas y Modo Dios, que combina ambos. Los especiales son temporales para la pestaña actual y crean un backup de seguridad antes de activarse; no utilizan `localStorage`. El botón con la bandera del jugador permite volver a abrir el panel después de cerrarlo.

El catálogo usa los clubes verificados del bundle actual de Copero y también reconoce los observados en la partida, temporadas u opciones del evento. Las ofertas se clonan desde una opción real y el usuario confirma el fichaje pulsando la interfaz original. `forceJoin` no se incluye porque los bundles no permiten garantizar la sincronización de todos los campos.

## Datos, backups y diagnóstico

```js
careerEditor.backups.create('antes')
careerEditor.backups.list()
careerEditor.export()
careerEditor.import(json)
careerEditor.download()
careerEditor.validate()
careerEditor.repair()
careerEditor.diagnose()
careerEditor.refresh()
careerEditor.update()
```

`update()` consulta GitHub sin caché y, si `update.json` anuncia otra versión, descarga e instala el `main.js` nuevo en la pestaña actual. Usa `careerEditor.update({ checkOnly: true })` para limitarte a comprobar si existe una actualización.

La exportación nueva incluye versión, fecha y `gameState`; import acepta también el estado puro v2. `repair()` solo inicializa colecciones seguras ausentes.

## Desarrollo y contribución

Modifica exclusivamente `src/`, añade pruebas en `tests/`, ejecuta `npm test` y `npm run build`. Si el localizador falla, abre una partida, espera las animaciones y usa `careerEditor.diagnose()`. Consulta [CHANGELOG.md](CHANGELOG.md) para cambios publicados.
