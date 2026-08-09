# Changelog

## B3 — Beta 3

- Integrado un mercado completo dentro del panel principal con búsqueda de clubes, selector de ofertas y acciones para reemplazar o añadir ofertas.
- Simplificadas las tablas de `clubs.list()` y `clubs.search()` para mostrar solamente país, competición e ID, conservando los objetos completos en el valor devuelto.
- Ampliada la navegación del panel para que Clubes sea una sección propia tanto en PC como en celular.

## B2.3

- Añadida una celebración visual al agregar trofeos o premios por consola, incluyendo los logros que incorpore `addAllSeason()` / `aas()`.

## B2.2.2

- Corregido `addAllSeason()` / `aas()` para completar únicamente los trofeos y premios que falten en la última temporada, conservando cualquier logro existente.

## B2.2

- Añadido `addAllSeason()` y su alias `aas()` para dar todos los trofeos y premios conocidos a la temporada actual en un solo paso reversible.

## B2.1
- Añadido un userscript descargable para iPhone, iPad y Android que permite abrir el editor sin consola mediante un botón flotante.
- Corregido el reemplazo de clubes para forzar que Copero actualice visualmente nombre, escudo y botón de la oferta.
- Conservado el ID original de ofertas reemplazadas para evitar `Unknown decision option` durante la transición visual.
- Sincronizada la referencia visual interna del evento para mantener `eventId` y `optionId` válidos durante la animación de Copero.
- Añadida invalidación visual segura al añadir o eliminar ofertas.

## B2 — Beta 2

- Reconstruida la experiencia de consola con identidad visual propia para B2, banner de instalación, ayuda navegable y reportes de error más claros.
- Actualizada la compatibilidad con `CareerSimulatorPage-C-UnCYTO.js`; el extractor ya encuentra automáticamente bundles con cualquier hash.
- Ampliado el catálogo verificado de 574 a 711 clubes tras la actualización de Copero.
- Añadidas pruebas de regresión para las nuevas ligas y clubes del simulador.

## B1.1

- Corregida la ayuda de categorías y comandos para mostrar siempre el prefijo temporal activo en usos y ejemplos.
- Reconstruido desde cero todo el panel como una mini aplicación con dashboard, editor de jugador, trayectoria, centro de datos, backups, importación de archivos y modo minimizado.
- Rediseñado el mercado de clubes para integrarlo con el nuevo sistema visual.
- Añadido `update()` para comprobar e instalar una versión nueva desde GitHub sin volver a pegar el loader.
- Añadido `update.json` como manifiesto ligero de la versión pública disponible.
- Añadidos controles visuales para descargar e importar carreras JSON desde el panel.

## B1 — Beta 1

- Añadido `setPrefix()` para renombrar temporalmente la API global durante la pestaña actual.
- El logger, la ayuda y el manejador de errores adoptan inmediatamente el nuevo prefijo.
- Añadida validación de identificadores reservados y protección contra sobrescritura de variables globales.
- Rediseñados el panel general, el selector de clubes, la ayuda y los mensajes de consola.
- Primera beta pública; se advierte que todavía puede contener numerosos bugs.
- Añadido el canal de contacto [@kuikilod](https://x.com/kuikilod) para reportes y sugerencias.
- Añadido el crédito `hecho con <3 por Jolly` al cargar el editor.
- El crédito se reconstruye en ejecución y el bundle público se distribuye minificado para dificultar su eliminación accidental.
- Corregido el módulo de clubes para usar el catálogo completo verificado del bundle del juego.
- Añadido diagnóstico de catálogo y compatibilidad estricta para ofertas de fichaje, préstamo y transferencia permanente.
- Panel adaptado a la interfaz real del Career Simulator a partir de su HTML, con HUD compacto, tarjeta OVR ámbar y estadísticas PJ/Gls/Ast.

## 3.1.1

- Corregida la colisión entre `careerEditor.player(...)` y `careerEditor.player.name(...)`.
- Añadido un manejador central avanzado para errores de instalación y comandos.
- Añadida una API mínima de diagnóstico cuando el arranque no puede completarse.
- Añadidos IDs de error, causas probables y pasos de recuperación.

## 3.0.0

- Arquitectura modular y build con esbuild.
- CommandRegistry y CommandHandler con aliases.
- Ayuda generada, API organizada y compatibilidad v2.
- Historial, backups, validación, presets, freeze y paneles Shadow DOM.
- Catálogo de clubes verificado desde estado/eventos y edición segura de ofertas.
- Pruebas unitarias con Node test runner.
