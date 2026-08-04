# Changelog

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
