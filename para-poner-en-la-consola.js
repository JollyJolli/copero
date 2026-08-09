// ==UserScript==
// @name         Copero Career Editor
// @namespace    https://github.com/JollyJolli/copero
// @version      2.1.0
// @description  Carga Copero Career Editor y añade un botón para abrir el panel sin consola.
// @match        https://copero.com.ar/*
// @match        https://www.copero.com.ar/*
// @run-at       document-idle
// @inject-into  page
// @grant        none
// @updateURL    https://raw.githubusercontent.com/JollyJolli/copero/main/para-poner-en-la-consola.js
// @downloadURL  https://raw.githubusercontent.com/JollyJolli/copero/main/para-poner-en-la-consola.js
// ==/UserScript==

(() => {
  const scriptUrl = 'https://raw.githubusercontent.com/JollyJolli/copero/main/main.js';
  const launcherId = 'copero-career-editor-launcher';
  let openedAutomatically = false;

  const openPanel = () => {
    const api = window.careerEditor;
    if (!api?.__coperoCareerEditor || api.installationFailed) return false;
    api.panel();
    return true;
  };

  const mountLauncher = () => {
    if (document.getElementById(launcherId)) return;
    const button = document.createElement('button');
    button.id = launcherId;
    button.type = 'button';
    button.textContent = 'C';
    button.title = 'Abrir Copero Career Editor';
    button.setAttribute('aria-label', button.title);
    Object.assign(button.style, {
      position: 'fixed', right: '16px', bottom: 'calc(16px + env(safe-area-inset-bottom))', zIndex: '2147483646',
      width: '48px', height: '48px', border: '1px solid rgba(255,255,255,.25)', borderRadius: '15px', color: '#fff',
      background: 'linear-gradient(145deg,#fb7185,#be123c)', boxShadow: '0 14px 35px rgba(136,19,55,.42)',
      font: '900 20px/1 system-ui,-apple-system,sans-serif', cursor: 'pointer'
    });
    button.addEventListener('click', () => { if (!openPanel()) console.warn('[Copero Career Editor] Abre una carrera y vuelve a intentarlo.'); });
    document.documentElement.append(button);
  };

  const ready = () => {
    mountLauncher();
    if (!openedAutomatically && document.querySelector('[data-career-phase]') && openPanel()) openedAutomatically = true;
  };

  const observer = new MutationObserver(ready);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  fetch(`${scriptUrl}?t=${Date.now()}`, { cache: 'no-store' })
    .then(response => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.text(); })
    .then(code => { (0, eval)(code); ready(); })
    .catch(error => console.error('[Copero Career Editor] No se pudo cargar.', error));
})();
