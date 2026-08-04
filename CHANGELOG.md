# Changelog

## B1 — Beta 1

- Añadido `update()` para comprobar e instalar una versión nueva desde GitHub sin volver a pegar el loader.
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
