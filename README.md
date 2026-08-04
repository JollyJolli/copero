# Copero Career Editor 3.0.0

Editor modular para modificar localmente una partida abierta del Career Simulator de Copero. Actúa sobre el estado React de la pestaña; no modifica servidores. Haz un backup antes de experimentar y evita importar estados que no sean tuyos.

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
careerEditor.backup('antes')
careerEditor.undo()
```

Los aliases v2 (`player`, `overall`, `price`, `season`, `lastSeason`, `addTrophy`, etc.) llaman a los mismos comandos organizados.

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

El catálogo solo acepta clubes observados en la partida, temporadas u opciones del evento. Las ofertas se clonan desde una opción real y el usuario confirma el fichaje pulsando la interfaz original. `forceJoin` no se incluye porque los bundles no permiten garantizar la sincronización de todos los campos.

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
```

La exportación nueva incluye versión, fecha y `gameState`; import acepta también el estado puro v2. `repair()` solo inicializa colecciones seguras ausentes.

## Desarrollo y contribución

Modifica exclusivamente `src/`, añade pruebas en `tests/`, ejecuta `npm test` y `npm run build`. Si el localizador falla, abre una partida, espera las animaciones y usa `careerEditor.diagnose()`. Consulta [CHANGELOG.md](CHANGELOG.md) para cambios publicados.
