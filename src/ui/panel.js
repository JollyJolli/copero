import { PANEL_CSS } from './styles.js';
import { compatibleOffers } from '../modules/clubs.js';
import { isSmallScreen, openMobilePanel } from './mobile-panel.js';

const escapeHtml = value => String(value ?? '—').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const number = value => Number(value) || 0;
const money = value => { try { return new Intl.NumberFormat('es-ES', { notation:'compact', style:'currency', currency:'EUR', maximumFractionDigits:1 }).format(number(value)); } catch { return String(value ?? 0); } };
const date = value => { try { return new Intl.DateTimeFormat('es-MX', { dateStyle:'medium', timeStyle:'short' }).format(new Date(value)); } catch { return 'Ahora'; } };
const icon = name => ({ dashboard:'⌂', player:'♙', career:'◫', commands:'⌘', data:'◇', backup:'□', undo:'↶', redo:'↷', clubs:'⌕', export:'↓', import:'↑', update:'↻' }[name] ?? '•');

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
  ['dashboard', 'Inicio'], ['player', 'Jugador'], ['clubs', 'Clubes'], ['commands', 'Comandos'], ['career', 'Carrera'], ['data', 'Datos']
];

function shellMarkup(version) {
  return `<style>${PANEL_CSS}</style><section class="cee-app" role="dialog" aria-label="Copero Career Editor">
    <aside class="cee-sidebar">
      <div class="cee-logo"><span>C</span><div><strong>COPERO</strong><small>EDITOR ${escapeHtml(version)}</small></div></div>
      <nav class="cee-nav">${navigation.map(([id,label], index) => `<button data-route="${id}" class="${index ? '' : 'is-active'}"><i>${icon(id)}</i><span>${label}</span></button>`).join('')}</nav>
      <div class="cee-sidebar-foot"><span class="cee-status-dot"></span><div><strong>Conectado</strong><small class="cee-prefix"></small></div></div>
    </aside>
    <section class="cee-workspace">
      <header class="cee-topbar"><div><p class="cee-eyebrow">CAREER CONTROL</p><h1 class="cee-page-title">Inicio</h1></div><div class="cee-global-actions"><button class="cee-aas-button" data-command="aas" title="Completar logros faltantes de la última temporada">◆ AAS</button><div class="cee-window-actions"><button data-action="refresh" title="Actualizar panel">↻</button><button data-action="minimize" title="Minimizar">—</button><button data-action="close" title="Cerrar">×</button></div></div></header>
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
      <button data-route="clubs"><i>${icon('clubs')}</i><div><strong>Mercado</strong><span>Busca y cambia ofertas aquí mismo</span></div></button>
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

const clubCountry = club => club?.country_fifa_code ?? club?.countryCode ?? club?.country ?? '—';
const clubCompetition = club => club?.competitionName ?? club?.competition_name ?? club?.competitionId ?? club?.competition_id ?? 'Competición desconocida';
const clubLogo = club => club?.logo_url ? `<img src="${escapeHtml(club.logo_url)}" alt="">` : escapeHtml(String(club?.name ?? club?.id ?? '?').slice(0, 2).toUpperCase());

function clubsView(context, ui) {
  context.catalog.refresh(); const state = context.stateManager.get(); const offers = compatibleOffers(state);
  if (ui.offer > offers.length) ui.offer = Math.max(1, offers.length);
  const allClubs = context.catalog.list();
  const countries = [...new Set(allClubs.map(clubCountry).filter(value => value !== '—'))].sort();
  const competitions = [...new Map(allClubs.filter(club => !ui.country || clubCountry(club) === ui.country).map(club => [club.competitionId ?? club.competition_id ?? clubCompetition(club), clubCompetition(club)])).entries()].sort((a,b) => a[1].localeCompare(b[1]));
  const filters = { country:ui.country, competition:ui.competition, division:ui.division, minReputation:ui.minReputation };
  const query = ui.query.trim(); const source = (query ? context.catalog.search(query, filters) : context.catalog.list(filters)).sort((a,b) => Number(b.reputation ?? b.international_reputation ?? 0) - Number(a.reputation ?? a.international_reputation ?? 0));
  const clubs = source.slice(0, 48);
  return `<section class="cee-clubs-page"><div class="cee-section-head cee-page-head"><div><p>MERCADO B4-P</p><h3>Control total de ofertas</h3></div><span>${context.catalog.list().length} clubes verificados</span></div>
    <div class="cee-offer-zone"><div class="cee-market-title"><div><small>PASO 1</small><strong>Elige qué oferta quieres cambiar</strong></div><span>${offers.length} disponibles</span></div>
      <div class="cee-offer-grid">${offers.length ? offers.map(({option,key},index) => { const club = context.catalog.getById(option[key]); return `<button class="cee-offer-card ${ui.offer === index + 1 ? 'is-selected' : ''}" data-select-offer="${index + 1}"><span class="cee-club-badge">${clubLogo(club)}</span><div><small>OFERTA ${index + 1} · ${escapeHtml(option.type)}</small><strong>${escapeHtml(club?.name ?? option[key])}</strong><code>${escapeHtml(option[key])}</code></div><b>${ui.offer === index + 1 ? 'SELECCIONADA' : 'ELEGIR'}</b></button>`; }).join('') : `<div class="cee-empty compact"><strong>No hay ofertas compatibles ahora mismo</strong><span>Avanza hasta una decisión de fichaje y actualiza el panel.</span></div>`}</div>
    </div>
    <div class="cee-club-browser"><div class="cee-market-title"><div><small>PASO 2</small><strong>Busca el club que quieres</strong></div><span>${source.length} resultados</span></div>
      <label class="cee-club-search"><i>⌕</i><input data-club-search value="${escapeHtml(ui.query)}" placeholder="Nombre o ID, por ejemplo Barcelona..." autocomplete="off"><kbd>48 MAX</kbd></label>
      <div class="cee-club-filters">
        <label><span>País</span><select data-club-filter="country"><option value="">Todos</option>${countries.map(value => `<option value="${escapeHtml(value)}" ${ui.country === value ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('')}</select></label>
        <label><span>Competición</span><select data-club-filter="competition"><option value="">Todas</option>${competitions.map(([value,label]) => `<option value="${escapeHtml(value)}" ${ui.competition === value ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('')}</select></label>
        <label><span>División</span><select data-club-filter="division"><option value="">Todas</option>${[1,2,3].map(value => `<option value="${value}" ${Number(ui.division) === value ? 'selected' : ''}>División ${value}</option>`).join('')}</select></label>
        <label><span>Reputación mínima</span><select data-club-filter="minReputation"><option value="">Cualquiera</option>${[0,1,2,3,4,5].map(value => `<option value="${value}" ${String(ui.minReputation) === String(value) ? 'selected' : ''}>${value}+</option>`).join('')}</select></label>
        <button data-clear-club-filters>Limpiar filtros</button>
      </div>
      <div class="cee-panel-club-results">${clubs.length ? clubs.map(club => `<article class="cee-panel-club" data-club-card="${escapeHtml(club.id)}"><span class="cee-club-badge large">${clubLogo(club)}</span><div class="cee-panel-club-copy"><strong>${escapeHtml(club.name ?? club.id)}</strong><span>${escapeHtml(clubCountry(club))} · ${escapeHtml(clubCompetition(club))}</span><code>${escapeHtml(club.id)}</code></div><div class="cee-club-actions"><button data-market-action="replace" ${offers.length ? '' : 'disabled'}>Reemplazar ${offers.length ? ui.offer : ''}</button><button data-market-action="add" title="Añadir como oferta nueva" ${offers.length ? '' : 'disabled'}>＋</button></div></article>`).join('') : `<div class="cee-empty"><i>⌕</i><strong>No encontramos ese club</strong><span>Prueba con otro nombre o con su ID exacta.</span></div>`}</div>
    </div>
  </section>`;
}

function commandsView(context, ui) {
  const query = ui.query.trim().toLowerCase(); const commands = context.registry.list().filter(command => !query || `${command.name} ${command.description} ${command.category} ${command.aliases.join(' ')}`.toLowerCase().includes(query));
  const selected = commands.find(command => command.name === ui.selected) ?? commands[0] ?? null; if (selected) ui.selected = selected.name;
  return `<section class="cee-commands-page"><div class="cee-section-head cee-page-head"><div><p>COMMAND CENTER</p><h3>Busca y ejecuta cualquier comando</h3></div><span>${context.registry.list().length} comandos instalados</span></div>
    <label class="cee-command-search"><i>⌘</i><input data-command-search value="${escapeHtml(ui.query)}" placeholder="Buscar por nombre, categoría o alias..." autocomplete="off"></label>
    <div class="cee-command-layout"><div class="cee-command-list">${commands.length ? commands.map(command => `<button data-select-command="${escapeHtml(command.name)}" class="${selected?.name === command.name ? 'is-selected' : ''}"><span>${escapeHtml(command.category)}</span><strong>${escapeHtml(command.name)}</strong><small>${escapeHtml(command.description)}</small>${command.dangerous ? '<b>PELIGROSO</b>' : ''}</button>`).join('') : `<div class="cee-empty compact"><strong>No hay comandos con ese nombre</strong></div>`}</div>
      <div class="cee-command-runner">${selected ? `<div class="cee-runner-head"><span>${escapeHtml(selected.category)}</span><h3>${escapeHtml(selected.name)}</h3><p>${escapeHtml(selected.description)}</p></div><div class="cee-command-usage"><small>USO</small><code>${escapeHtml(selected.usage.replaceAll('careerEditor.', context.config.prefix))}</code></div>${selected.aliases.length ? `<div class="cee-command-aliases">${selected.aliases.map(alias => `<span>${escapeHtml(alias)}</span>`).join('')}</div>` : ''}<label><span>Argumentos en JSON</span><textarea data-command-args placeholder='Ejemplo: ["barcelona"]'>${escapeHtml(ui.args)}</textarea><small>Déjalo vacío para ejecutar sin argumentos. Debe ser un array JSON.</small></label>${selected.dangerous ? '<div class="cee-command-danger">⚠ Este comando puede modificar o borrar datos.</div>' : ''}<button class="cee-run-command ${selected.dangerous ? 'danger' : ''}" data-execute-command="${escapeHtml(selected.name)}">▶ Ejecutar ${escapeHtml(selected.name)}</button>` : '<div class="cee-empty"><strong>Selecciona un comando</strong></div>'}</div>
    </div>
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

function apiCommand(api, name) { return name.split('.').reduce((value, key) => value?.[key], api); }

export function openPanel(context, api) {
  closePanel(context);
  if (isSmallScreen()) return openMobilePanel(context, api);
  const host = document.createElement('div'); const root = host.attachShadow({ mode:'open' });
  root.innerHTML = shellMarkup(context.config.version);
  const app = root.querySelector('.cee-app'); const content = root.querySelector('.cee-content'); const toast = root.querySelector('.cee-toast');
  let route = 'dashboard'; let toastTimer; let busy = false; const clubUi = { query:'', offer:1, country:'', competition:'', division:'', minReputation:'' }; const commandUi = { query:'', selected:'', args:'' };

  const notify = (message, kind = 'success') => { clearTimeout(toastTimer); toast.textContent = message; toast.className = `cee-toast is-visible is-${kind}`; toastTimer = setTimeout(() => { toast.className = 'cee-toast'; }, 2800); };
  const render = () => {
    root.querySelector('.cee-prefix').textContent = context.config.prefix;
    try {
      const state = context.stateManager.get(); const history = context.historyManager.list();
      const titles = { dashboard:'Inicio', player:'Jugador', clubs:'Mercado de clubes', commands:'Centro de comandos', career:'Carrera', data:'Datos y backups' };
      root.querySelector('.cee-page-title').textContent = titles[route];
      root.querySelector('.cee-dock-name').textContent = state.player?.lastName || 'Career Editor';
      root.querySelector('.cee-dock-ovr').textContent = `${state.player?.overall ?? '—'} OVR`;
      root.querySelectorAll('[data-route]').forEach(button => button.classList.toggle('is-active', button.dataset.route === route));
      content.innerHTML = route === 'dashboard' ? dashboardView(state, history) : route === 'player' ? playerView(state) : route === 'clubs' ? clubsView(context, clubUi) : route === 'commands' ? commandsView(context, commandUi) : route === 'career' ? careerView(state) : dataView(context);
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
    if (event.target.closest('[data-clear-club-filters]')) { Object.assign(clubUi, { country:'', competition:'', division:'', minReputation:'' }); render(); return; }
    const selectedOffer = event.target.closest('[data-select-offer]')?.dataset.selectOffer;
    if (selectedOffer) { clubUi.offer = Number(selectedOffer); render(); return; }
    const marketButton = event.target.closest('[data-market-action]');
    if (marketButton) { const clubId = marketButton.closest('[data-club-card]')?.dataset.clubCard; if (!clubId) return; const action = marketButton.dataset.marketAction; if (action === 'replace') await run(`Oferta ${clubUi.offer} reemplazada por ${clubId}`, () => api.clubs.replaceOffer(clubUi.offer, clubId)); else await run(`Oferta de ${clubId} añadida`, () => api.clubs.addOffer(clubId)); return; }
    const selectedCommand = event.target.closest('[data-select-command]')?.dataset.selectCommand;
    if (selectedCommand) { commandUi.selected = selectedCommand; commandUi.args = ''; render(); return; }
    const executeCommand = event.target.closest('[data-execute-command]')?.dataset.executeCommand;
    if (executeCommand) { const spec = context.registry.get(executeCommand); if (spec?.dangerous && !confirm(`¿Ejecutar el comando peligroso “${executeCommand}”?`)) return; let args = []; try { if (commandUi.args.trim()) { args = JSON.parse(commandUi.args); if (!Array.isArray(args)) throw new Error('Los argumentos deben estar dentro de un array JSON.'); } } catch (error) { notify(`JSON inválido: ${error.message}`, 'error'); return; } const fn = apiCommand(api, executeCommand); if (typeof fn !== 'function') { notify('No se encontró la función de ese comando.', 'error'); return; } await run(`Comando ${executeCommand} ejecutado`, () => fn(...args)); return; }
    const routeButton = event.target.closest('[data-route]');
    if (routeButton) { route = routeButton.dataset.route; render(); return; }
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'close') return closePanel(context);
    if (action === 'minimize') { app.classList.add('is-minimized'); return; }
    if (action === 'restore') { app.classList.remove('is-minimized'); return; }
    if (action === 'refresh') return run('Panel actualizado', () => context.stateManager.refreshConnection());
    const command = event.target.closest('[data-command]')?.dataset.command;
    if (command === 'backup') { const name = prompt('Nombre del backup:', `backup-${new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'}).replace(':','-')}`); if (name) await run(`Backup “${name}” creado`, () => api.backup(name)); }
    if (command === 'aas') await run('Logros de temporada completados', () => api.aas());
    if (command === 'undo') await run('Último cambio deshecho', () => api.undo());
    if (command === 'redo') await run('Cambio rehecho', () => api.redo());
    if (command === 'clubs') { route = 'clubs'; render(); }
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
  root.addEventListener('input', event => {
    if (event.target.matches('[data-club-search]')) { clubUi.query = event.target.value; render(); const input = root.querySelector('[data-club-search]'); input?.focus(); input?.setSelectionRange(input.value.length, input.value.length); return; }
    if (event.target.matches('[data-command-search]')) { commandUi.query = event.target.value; render(); const input = root.querySelector('[data-command-search]'); input?.focus(); input?.setSelectionRange(input.value.length, input.value.length); return; }
    if (event.target.matches('[data-command-args]')) commandUi.args = event.target.value;
  });
  root.addEventListener('change', event => { const filter = event.target.dataset.clubFilter; if (!filter) return; clubUi[filter] = event.target.value; if (filter === 'country') clubUi.competition = ''; render(); });
  root.addEventListener('keydown', event => { if (event.key === 'Escape') closePanel(context); });
  document.documentElement.append(host); context.runtime.panelHost = host; enableDrag(app, root.querySelector('.cee-topbar')); render(); return host;
}

export function closePanel(context) { context.runtime.panelHost?.remove(); context.runtime.panelHost = null; }
