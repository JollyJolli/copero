import { PANEL_CSS } from './styles.js';

const escapeHtml = value => String(value ?? '—').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const number = value => Number(value) || 0;
const money = value => { try { return new Intl.NumberFormat('es-ES', { notation:'compact', style:'currency', currency:'EUR', maximumFractionDigits:1 }).format(number(value)); } catch { return String(value ?? 0); } };
const date = value => { try { return new Intl.DateTimeFormat('es-MX', { dateStyle:'medium', timeStyle:'short' }).format(new Date(value)); } catch { return 'Ahora'; } };
const icon = name => ({ dashboard:'⌂', player:'♙', career:'◫', data:'◇', backup:'□', undo:'↶', redo:'↷', clubs:'⌕', export:'↓', import:'↑', update:'↻' }[name] ?? '•');

function enableDrag(host, handle) {
  let drag;
  handle.addEventListener('pointerdown', event => {
    if (event.target.closest('button,input,select')) return;
    const rect = host.getBoundingClientRect();
    drag = { x:event.clientX - rect.left, y:event.clientY - rect.top };
    handle.setPointerCapture(event.pointerId);
  });
  handle.addEventListener('pointermove', event => {
    if (!drag || innerWidth < 720) return;
    host.style.left = `${Math.max(8, Math.min(innerWidth - host.offsetWidth - 8, event.clientX - drag.x))}px`;
    host.style.top = `${Math.max(8, Math.min(innerHeight - host.offsetHeight - 8, event.clientY - drag.y))}px`;
    host.style.right = 'auto';
  });
  handle.addEventListener('pointerup', () => { drag = null; });
}

const navigation = [
  ['dashboard', 'Inicio'], ['player', 'Jugador'], ['career', 'Carrera'], ['data', 'Datos']
];

function shellMarkup(version) {
  return `<style>${PANEL_CSS}</style><section class="cee-app" role="dialog" aria-label="Copero Career Editor">
    <aside class="cee-sidebar">
      <div class="cee-logo"><span>C</span><div><strong>COPERO</strong><small>EDITOR ${escapeHtml(version)}</small></div></div>
      <nav class="cee-nav">${navigation.map(([id,label], index) => `<button data-route="${id}" class="${index ? '' : 'is-active'}"><i>${icon(id)}</i><span>${label}</span></button>`).join('')}</nav>
      <div class="cee-sidebar-foot"><span class="cee-status-dot"></span><div><strong>Conectado</strong><small class="cee-prefix"></small></div></div>
    </aside>
    <section class="cee-workspace">
      <header class="cee-topbar"><div><p class="cee-eyebrow">CAREER CONTROL</p><h1 class="cee-page-title">Inicio</h1></div><div class="cee-window-actions"><button data-action="refresh" title="Actualizar panel">↻</button><button data-action="minimize" title="Minimizar">—</button><button data-action="close" title="Cerrar">×</button></div></header>
      <main class="cee-content" aria-live="polite"></main>
      <footer class="cee-mobile-nav">${navigation.map(([id,label], index) => `<button data-route="${id}" class="${index ? '' : 'is-active'}"><i>${icon(id)}</i><span>${label}</span></button>`).join('')}</footer>
    </section>
    <button class="cee-dock" data-action="restore"><span>C</span><strong class="cee-dock-name">Career Editor</strong><small class="cee-dock-ovr">— OVR</small></button>
    <div class="cee-toast" role="status"></div>
  </section>`;
}

function dashboardView(state, history) {
  const player = state.player ?? {}, totals = state.totals ?? {}, seasons = state.seasons ?? [], last = seasons.at(-1);
  const historyCount = history.undo.length;
  return `<section class="cee-dashboard">
    <article class="cee-player-hero">
      <div class="cee-hero-glow"></div><div class="cee-avatar">${escapeHtml((player.lastName || 'J').slice(0,1).toUpperCase())}</div>
      <div class="cee-player-copy"><span class="cee-chip">${escapeHtml(player.position)}</span><h2>${escapeHtml(player.lastName || 'Jugador')}</h2><p>#${escapeHtml(player.preferredNumber)} · ${escapeHtml(player.currentTeamId ?? state.currentTeamId ?? 'Sin club')}</p></div>
      <div class="cee-rating"><small>OVR</small><strong>${escapeHtml(player.overall)}</strong><span>${escapeHtml(player.age)} años</span></div>
    </article>
    <div class="cee-stat-grid">
      ${[['PJ',totals.appearances,'Partidos'],['GLS',totals.goals,'Goles'],['AST',totals.assists,'Asistencias'],['VAL',money(player.marketValue),'Valor']].map(([tag,value,label]) => `<article class="cee-stat-card"><span>${tag}</span><strong>${escapeHtml(value)}</strong><small>${label}</small></article>`).join('')}
    </div>
    <div class="cee-section-head"><div><p>ACCESOS RÁPIDOS</p><h3>¿Qué quieres hacer?</h3></div><span>${historyCount} cambios guardados</span></div>
    <div class="cee-quick-grid">
      <button data-command="backup"><i>${icon('backup')}</i><div><strong>Crear backup</strong><span>Punto de restauración rápido</span></div></button>
      <button data-command="undo"><i>${icon('undo')}</i><div><strong>Deshacer</strong><span>Regresa el último cambio</span></div></button>
      <button data-command="clubs"><i>${icon('clubs')}</i><div><strong>Mercado</strong><span>Explora clubes y ofertas</span></div></button>
      <button data-route="data"><i>${icon('export')}</i><div><strong>Guardar JSON</strong><span>Descarga tu carrera al PC</span></div></button>
    </div>
    <div class="cee-section-head"><div><p>ÚLTIMA TEMPORADA</p><h3>${escapeHtml(last?.teamId ?? 'Aún no hay temporadas')}</h3></div><button class="cee-text-button" data-route="career">Ver carrera →</button></div>
    ${last ? `<article class="cee-season-feature"><div class="cee-season-number">${seasons.length}</div><div><strong>${number(last.stats?.appearances)} PJ · ${number(last.stats?.goals)} goles · ${number(last.stats?.assists)} asistencias</strong><span>${escapeHtml(last.age)} años · ${escapeHtml(last.overall)} OVR · ${money(last.marketValue)}</span></div><div class="cee-trophy-count">${(last.trophies?.length ?? 0) + (last.awards?.length ?? 0)}<small>logros</small></div></article>` : `<div class="cee-empty"><i>◌</i><strong>Tu historia comienza aquí</strong><span>Termina una temporada para verla en este espacio.</span></div>`}
  </section>`;
}

function playerView(state) {
  const player = state.player ?? {};
  return `<section><div class="cee-section-head cee-page-head"><div><p>PERFIL DEL JUGADOR</p><h3>Edita lo importante</h3></div><span>Los cambios pueden deshacerse</span></div>
    <form class="cee-player-form" data-player-form>
      <div class="cee-form-card cee-identity-card"><div class="cee-form-card-head"><span>01</span><div><strong>Identidad</strong><small>Cómo aparece tu jugador</small></div></div><div class="cee-fields">
        <label class="wide"><span>Apellido</span><input name="lastName" value="${escapeHtml(player.lastName ?? '')}" autocomplete="off"></label>
        <label><span>Posición</span><input name="position" value="${escapeHtml(player.position ?? '')}" autocomplete="off"></label>
        <label><span>Dorsal</span><input name="preferredNumber" type="number" min="1" max="99" value="${escapeHtml(player.preferredNumber ?? '')}"></label>
        <label><span>Pie preferido</span><select name="preferredFoot"><option value="right" ${player.preferredFoot === 'right' ? 'selected' : ''}>Derecho</option><option value="left" ${player.preferredFoot === 'left' ? 'selected' : ''}>Izquierdo</option></select></label>
      </div></div>
      <div class="cee-form-card"><div class="cee-form-card-head"><span>02</span><div><strong>Rendimiento</strong><small>Nivel y progresión</small></div></div><div class="cee-fields">
        <label><span>Overall</span><input name="overall" type="number" min="1" max="99" value="${escapeHtml(player.overall ?? '')}"></label>
        <label><span>Edad</span><input name="age" type="number" min="0" max="100" value="${escapeHtml(player.age ?? '')}"></label>
        <label class="wide"><span>Valor de mercado</span><div class="cee-input-prefix"><b>€</b><input name="marketValue" type="number" min="0" value="${escapeHtml(player.marketValue ?? '')}"></div></label>
      </div></div>
      <div class="cee-form-actions"><button type="button" class="cee-button ghost" data-command="undo">${icon('undo')} Deshacer</button><button type="submit" class="cee-button primary">Guardar cambios</button></div>
    </form></section>`;
}

function careerView(state) {
  const seasons = [...(state.seasons ?? [])].reverse();
  return `<section><div class="cee-section-head cee-page-head"><div><p>TRAYECTORIA</p><h3>${seasons.length} temporadas</h3></div><button class="cee-button small" data-command="recalculate">Recalcular totales</button></div>
    <div class="cee-career-list">${seasons.length ? seasons.map((season,index) => { const actual = seasons.length - index; const achievements = [...(season.trophies ?? []), ...(season.awards ?? [])]; return `<article class="cee-career-card"><div class="cee-timeline"><span>${actual}</span><i></i></div><div class="cee-career-main"><div class="cee-career-title"><div><strong>${escapeHtml(season.teamId ?? 'Sin club')}</strong><span>${escapeHtml(season.age)} años · ${money(season.marketValue)}</span></div><b>${escapeHtml(season.overall)} <small>OVR</small></b></div><div class="cee-career-stats"><span><b>${number(season.stats?.appearances)}</b>PJ</span><span><b>${number(season.stats?.goals)}</b>Goles</span><span><b>${number(season.stats?.assists)}</b>Asist.</span><span><b>${achievements.length}</b>Logros</span></div>${achievements.length ? `<div class="cee-achievements">${achievements.slice(0,4).map(item => `<span>◆ ${escapeHtml(item.replaceAll('_',' '))}</span>`).join('')}${achievements.length > 4 ? `<span>+${achievements.length - 4}</span>` : ''}</div>` : ''}</div></article>`; }).join('') : `<div class="cee-empty"><i>◫</i><strong>No hay temporadas registradas</strong><span>Cuando completes una aparecerá aquí automáticamente.</span></div>`}</div>
  </section>`;
}

function dataView(context) {
  const backups = context.backupManager.list(); const history = context.historyManager.list();
  return `<section><div class="cee-section-head cee-page-head"><div><p>SEGURIDAD Y DATOS</p><h3>Tu carrera, protegida</h3></div><span>Todo permanece en tu navegador</span></div>
    <div class="cee-data-actions">
      <button data-command="download"><i>${icon('export')}</i><div><strong>Descargar JSON</strong><span>Guarda una copia permanente en tu PC</span></div><b>→</b></button>
      <button data-command="import"><i>${icon('import')}</i><div><strong>Importar JSON</strong><span>Restaura una carrera desde un archivo</span></div><b>→</b></button>
      <button data-command="update"><i>${icon('update')}</i><div><strong>Buscar actualización</strong><span>Comprueba si existe una versión nueva</span></div><b>→</b></button>
    </div>
    <div class="cee-section-head"><div><p>BACKUPS EN MEMORIA</p><h3>${backups.length} puntos guardados</h3></div><button class="cee-button small primary" data-command="backup">+ Nuevo backup</button></div>
    <div class="cee-backup-list">${backups.length ? backups.map((backup,index) => `<article><div class="cee-backup-icon">□</div><div><strong>${escapeHtml(backup.name)}</strong><span>${escapeHtml(backup.phase)} · ${backup.seasons} temporadas · ${date(backup.timestamp)}</span></div><button data-restore-backup="${index}" title="Restaurar">↶</button><button data-delete-backup="${index}" title="Eliminar">×</button></article>`).join('') : `<div class="cee-empty compact"><strong>No tienes backups manuales</strong><span>Crea uno antes de experimentar con tu carrera.</span></div>`}</div>
    <div class="cee-history-strip"><div><span>${history.undo.length}</span><small>Cambios para deshacer</small></div><div><span>${history.redo.length}</span><small>Cambios para rehacer</small></div><button data-command="redo">${icon('redo')} Rehacer último</button></div>
  </section>`;
}

export function openPanel(context, api) {
  closePanel(context);
  const host = document.createElement('div'); const root = host.attachShadow({ mode:'open' });
  root.innerHTML = shellMarkup(context.config.version);
  const app = root.querySelector('.cee-app'); const content = root.querySelector('.cee-content'); const toast = root.querySelector('.cee-toast');
  let route = 'dashboard'; let toastTimer; let busy = false;

  const notify = (message, kind = 'success') => { clearTimeout(toastTimer); toast.textContent = message; toast.className = `cee-toast is-visible is-${kind}`; toastTimer = setTimeout(() => { toast.className = 'cee-toast'; }, 2800); };
  const render = () => {
    root.querySelector('.cee-prefix').textContent = context.config.prefix;
    try {
      const state = context.stateManager.get(); const history = context.historyManager.list();
      const titles = { dashboard:'Inicio', player:'Jugador', career:'Carrera', data:'Datos y backups' };
      root.querySelector('.cee-page-title').textContent = titles[route];
      root.querySelector('.cee-dock-name').textContent = state.player?.lastName || 'Career Editor';
      root.querySelector('.cee-dock-ovr').textContent = `${state.player?.overall ?? '—'} OVR`;
      root.querySelectorAll('[data-route]').forEach(button => button.classList.toggle('is-active', button.dataset.route === route));
      content.innerHTML = route === 'dashboard' ? dashboardView(state, history) : route === 'player' ? playerView(state) : route === 'career' ? careerView(state) : dataView(context);
    } catch (error) {
      content.innerHTML = `<div class="cee-disconnected"><i>!</i><h2>No encuentro una partida abierta</h2><p>${escapeHtml(error.message)}</p><button class="cee-button primary" data-action="refresh">Intentar de nuevo</button></div>`;
    }
  };
  const run = async (message, action) => {
    if (busy) return; busy = true; app.classList.add('is-busy');
    try { const result = await action(); if (result === undefined && context.runtime.lastError) throw new Error(context.runtime.lastError.message); notify(message); render(); return result; }
    catch (error) { notify(error.message, 'error'); return undefined; }
    finally { busy = false; app.classList.remove('is-busy'); }
  };
  const pickJson = () => new Promise((resolve, reject) => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.json,application/json'; input.onchange = async () => { try { if (!input.files?.[0]) return resolve(null); resolve(await input.files[0].text()); } catch (error) { reject(error); } }; input.click(); });

  root.addEventListener('click', async event => {
    const routeButton = event.target.closest('[data-route]');
    if (routeButton) { route = routeButton.dataset.route; render(); return; }
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'close') return closePanel(context);
    if (action === 'minimize') { app.classList.add('is-minimized'); return; }
    if (action === 'restore') { app.classList.remove('is-minimized'); return; }
    if (action === 'refresh') return run('Panel actualizado', () => context.stateManager.refreshConnection());
    const command = event.target.closest('[data-command]')?.dataset.command;
    if (command === 'backup') { const name = prompt('Nombre del backup:', `backup-${new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'}).replace(':','-')}`); if (name) await run(`Backup “${name}” creado`, () => api.backup(name)); }
    if (command === 'undo') await run('Último cambio deshecho', () => api.undo());
    if (command === 'redo') await run('Cambio rehecho', () => api.redo());
    if (command === 'clubs') api.clubs.panel();
    if (command === 'recalculate') await run('Totales recalculados', () => api.stats.recalculate());
    if (command === 'download') await run('JSON descargado', () => api.download(`copero-career-${Date.now()}.json`));
    if (command === 'import') { const json = await pickJson(); if (json && confirm('Esto reemplazará la partida abierta. ¿Continuar?')) await run('Partida importada correctamente', () => api.import(json)); }
    if (command === 'update') await run('Comprobación terminada', () => api.update());
    const restoreIndex = event.target.closest('[data-restore-backup]')?.dataset.restoreBackup;
    if (restoreIndex !== undefined) { const backup = context.backupManager.list()[Number(restoreIndex)]; if (backup && confirm(`¿Restaurar “${backup.name}”?`)) await run(`Backup “${backup.name}” restaurado`, () => api.restore(backup.name)); }
    const deleteIndex = event.target.closest('[data-delete-backup]')?.dataset.deleteBackup;
    if (deleteIndex !== undefined) { const backup = context.backupManager.list()[Number(deleteIndex)]; if (backup && confirm(`¿Eliminar “${backup.name}”?`)) await run('Backup eliminado', () => api.deleteBackup(backup.name)); }
  });
  root.addEventListener('submit', async event => {
    if (!event.target.matches('[data-player-form]')) return; event.preventDefault();
    const form = new FormData(event.target); const patch = {};
    for (const [key,value] of form) if (value !== '') patch[key] = ['overall','age','preferredNumber','marketValue'].includes(key) ? Number(value) : value;
    await run('Jugador actualizado', () => api.player.set(patch));
  });
  root.addEventListener('keydown', event => { if (event.key === 'Escape') closePanel(context); });
  document.documentElement.append(host); context.runtime.panelHost = host; enableDrag(app, root.querySelector('.cee-topbar')); render(); return host;
}

export function closePanel(context) { context.runtime.panelHost?.remove(); context.runtime.panelHost = null; }
