import { PANEL_CSS } from './styles.js';
import { compatibleOffers } from '../modules/clubs.js';
import { TROPHIES, AWARDS, legitAwardsForPosition } from '../modules/trophies.js';
import { mobileSpecialsStatus } from '../modules/mobile-specials.js';
import { achievementLabel } from './achievement-celebration.js';
import { overallTier, playerFlag } from './player-presentation.js';

const escapeHtml = value => String(value ?? '—').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const clubCountry = club => club?.country_fifa_code ?? club?.countryCode ?? club?.country ?? '—';
const clubCompetition = club => club?.competitionName ?? club?.competition_name ?? club?.competitionId ?? club?.competition_id ?? 'Competición desconocida';
const clubLogo = club => club?.logo_url ? `<img src="${escapeHtml(club.logo_url)}" alt="">` : escapeHtml(String(club?.name ?? club?.id ?? '?').slice(0,2).toUpperCase());
const statItems = season => [{ key:'goals', label:'Goles', short:'GLS', value:season?.stats?.goals }, { key:'assists', label:'Asistencias', short:'AST', value:season?.stats?.assists }, { key:'appearances', label:'Partidos', short:'PJ', value:season?.stats?.appearances }];
const pages = [['home','⌂','Inicio'], ['specials','⚡','Especiales'], ['achievements','◆','Logros'], ['clubs','⌕','Clubes']];
const zone = (number, title, detail) => `<div class="cee-phone-zone"><span>${number}</span><div><strong>${title}</strong><small>${detail}</small></div><i></i></div>`;

function markup(version) {
  return `<style>${PANEL_CSS}</style><section class="cee-phone" role="dialog" aria-label="Copero Career Editor móvil">
    <header><div class="cee-phone-brand"><span class="cee-player-flag">🌍</span><div><strong>CAREER EDITOR</strong><small><b class="cee-phone-page-label">INICIO</b> · ${escapeHtml(version)}</small></div></div><div class="cee-phone-head-actions"><button data-mobile-command="undo" aria-label="Deshacer">↶</button><button data-mobile-close aria-label="Cerrar panel">×</button></div></header>
    <main class="cee-phone-content"></main>
    <footer class="cee-phone-nav">${pages.map(([id,icon,label]) => `<button data-mobile-tab="${id}" class="${id === 'home' ? 'is-active' : ''}"><i>${icon}</i><span>${label}</span></button>`).join('')}</footer>
    <div class="cee-phone-toast" role="status"></div>
  </section>`;
}

function playerHero(state, status) {
  const player = state.player ?? {}, currentTeam = player.currentTeamId ?? state.currentTeamId ?? 'Sin club';
  return `<section class="cee-phone-hero cee-phone-hero-v2"><div class="cee-phone-avatar">${escapeHtml((player.lastName || 'J').slice(0,1).toUpperCase())}</div><div><small>${status.godMode ? '⚡ MODO DIOS ACTIVO' : 'JUGADOR ACTUAL'}</small><strong>${escapeHtml(player.lastName || 'Jugador')}</strong><span>${escapeHtml(currentTeam)}</span></div><div class="cee-phone-ovr cee-ovr-${overallTier(player.overall)} ${status.ovr99 ? 'is-frozen' : ''}"><small>${status.ovr99 ? '❄ FREEZE' : 'OVR'}</small><b>${escapeHtml(player.overall)}</b></div></section>`;
}

function quickStats(season) {
  return `<div class="cee-phone-metrics">${statItems(season).map(item => `<article><span>${item.short}</span><strong>${Number(item.value) || 0}</strong><small>${item.label}</small></article>`).join('')}</div>`;
}

function homeView(state, status) {
  const player = state.player ?? {}, season = state.seasons?.at(-1);
  return `<section class="cee-phone-screen">${playerHero(state, status)}${zone('01','Resumen de temporada','Tus números actuales')}${quickStats(season)}
    ${zone('02','Centro de poder','Automatizaciones de O1')}
    <button class="cee-phone-power-strip ${status.godMode ? 'is-active' : ''}" data-mobile-tab="specials"><span>${status.godMode ? '⚡' : '◇'}</span><div><small>ESPECIALES MÓVILES</small><strong>${status.godMode ? 'Modo Dios está trabajando' : status.ovr99 || status.autoAll ? 'Tienes especiales activos' : 'Desbloquea el control total'}</strong></div><b>→</b></button>
    ${zone('03','Edición rápida','Cambios directos y reversibles')}
    <section class="cee-phone-card"><div class="cee-phone-title"><div><small>AJUSTE RÁPIDO</small><h2>Cambiar OVR</h2></div><span>1–99</span></div><form data-mobile-ovr><input name="overall" type="number" inputmode="numeric" min="1" max="99" value="${escapeHtml(player.overall ?? 80)}"><button>Guardar OVR</button></form></section>
    <section class="cee-phone-card"><div class="cee-phone-title"><div><small>ÚLTIMA TEMPORADA</small><h2>Sumar estadísticas</h2></div><span>${season ? `Temporada ${state.seasons.length}` : 'Sin temporada'}</span></div><div class="cee-phone-stats">${statItems(season).map(item => `<article><div class="cee-phone-stat-head"><div><small>${item.label}</small><strong>${Number(item.value) || 0}</strong></div><div>${[1,5,10].map(amount => `<button data-mobile-stat="${item.key}" data-amount="${amount}" ${!season ? 'disabled' : ''}>+${amount}</button>`).join('')}</div></div><form class="cee-phone-stat-manual" data-mobile-stat-form data-stat-key="${item.key}"><input name="amount" type="number" inputmode="numeric" min="1" max="9999" placeholder="Cantidad" ${!season ? 'disabled' : ''}><button ${!season ? 'disabled' : ''}>Sumar</button></form></article>`).join('')}</div></section>
    ${zone('04','Acciones de seguridad','Completa o guarda la carrera')}
    <div class="cee-phone-quick-actions"><button data-mobile-command="legit" ${!season ? 'disabled' : ''}><i>◆</i><span><strong>Completar realista</strong><small>Según tu posición</small></span></button><button data-mobile-command="backup"><i>□</i><span><strong>Backup rápido</strong><small>Guardar antes de editar</small></span></button></div>
  </section>`;
}

function specialToggle(id, icon, title, copy, active) {
  return `<button class="cee-phone-special-toggle ${active ? 'is-active' : ''}" data-mobile-special="${id}" aria-pressed="${active}"><span>${icon}</span><div><strong>${title}</strong><small>${copy}</small></div><i><b></b></i></button>`;
}

function specialsView(state, status) {
  const activeCount = Number(status.ovr99) + Number(status.autoAll);
  return `<section class="cee-phone-screen cee-phone-specials-screen">
    <section class="cee-phone-special-hero ${status.godMode ? 'is-active' : ''}"><div class="cee-special-orb">⚡</div><small>ESPECIALES PARA CELULAR</small><h1>${status.godMode ? 'Modo Dios activo' : 'Control sin límites'}</h1><p>Automatizaciones temporales para esta pestaña. Nada se guarda en localStorage.</p><button data-mobile-special="god">${status.godMode ? 'Desactivar Modo Dios' : 'Activar Modo Dios'}</button><div><span>${activeCount}/2 activos</span><span>${status.completions} temporadas completadas</span></div></section>
    ${zone('01','Automatizaciones','Activa solamente lo que necesites')}<section class="cee-phone-card cee-phone-special-card"><div class="cee-phone-title"><div><small>POWER UPS</small><h2>Activa lo que quieras</h2></div><span>Solo esta pestaña</span></div><div class="cee-phone-special-list">
      ${specialToggle('ovr99', '99', 'OVR 99 Freeze', 'Recupera el 99 si Copero intenta cambiarlo', status.ovr99)}
      ${specialToggle('autoAll', '◆', 'Temporada realista siempre', 'Completa cada temporada con premios compatibles con tu posición', status.autoAll)}
    </div></section>
    ${zone('02','Protección','Todo especial comienza con un backup')}<section class="cee-phone-safety"><span>▣</span><div><small>BACKUP DE SEGURIDAD</small><strong>${status.backupName ? escapeHtml(status.backupName) : 'Se creará al activar un especial'}</strong><p>${status.lastCompletedSeason ? `Última temporada automática: ${escapeHtml(status.lastCompletedSeason)}` : 'Podrás volver al estado anterior desde tus backups.'}</p></div></section>
    <button class="cee-phone-stop-all" data-mobile-special="stop" ${activeCount ? '' : 'disabled'}>■ Pausar todos los especiales</button>
  </section>`;
}

function achievementButtons(items, season, legitAwards = AWARDS) {
  return items.map(({id,kind}) => {
    const owned = season?.[kind === 'award' ? 'awards' : 'trophies']?.includes(id), manual = kind === 'award' && !legitAwards.includes(id);
    return `<button data-mobile-achievement="${id}" data-kind="${kind}" class="${owned ? 'is-owned' : ''}${manual ? ' is-manual' : ''}" ${!season || owned ? 'disabled' : ''} title="${manual ? 'Premio fuera de tu posición: puedes añadirlo manualmente' : ''}"><i>${kind === 'award' ? '★' : '◆'}</i><span>${escapeHtml(achievementLabel(id))}${manual ? '<em>MANUAL</em>' : ''}</span><b>${owned ? '✓' : '+'}</b></button>`;
  }).join('');
}

function achievementsView(state) {
  const season = state.seasons?.at(-1), position = state.player?.position ?? 'Sin posición', legitAwards = legitAwardsForPosition(position);
  const trophyItems = TROPHIES.map(id => ({id,kind:'trophy'})), awardItems = AWARDS.map(id => ({id,kind:'award'}));
  const owned = (season?.trophies?.filter(id => TROPHIES.includes(id)).length ?? 0) + (season?.awards?.filter(id => AWARDS.includes(id)).length ?? 0), total = TROPHIES.length + AWARDS.length;
  const legitMissing = TROPHIES.filter(id => !season?.trophies?.includes(id)).length + legitAwards.filter(id => !season?.awards?.includes(id)).length;
  return `<section class="cee-phone-screen"><section class="cee-phone-achievement-head"><div><small>TEMPORADA ${state.seasons?.length ?? 0}</small><h1>Vitrina de logros</h1><p>Completa una temporada creíble o elige cualquier premio manualmente.</p></div><div><strong>${owned}<small>/${total}</small></strong><span>conseguidos</span></div></section>
    ${zone('01','Completar temporada','Filtrado por la posición del jugador')}<button class="cee-phone-add-all cee-phone-add-all-v2" data-mobile-command="legit" ${!season || !legitMissing ? 'disabled' : ''}><span>◆</span><strong>Completar de forma realista</strong><small>${season ? `${escapeHtml(position)} · ${legitMissing} pendientes` : 'Necesitas una temporada'}</small></button><div class="cee-phone-legit-note"><span>✦</span><p>El botón automático respeta tu posición. Los premios marcados como <b>MANUAL</b> siguen disponibles si quieres forzarlos.</p></div>
    ${zone('02','Trofeos colectivos','Liga, copas y torneos')}<section class="cee-phone-card"><div class="cee-phone-title"><div><small>COLECTIVOS</small><h2>Trofeos</h2></div><span>${season?.trophies?.length ?? 0}/${TROPHIES.length}</span></div><div class="cee-phone-achievements">${achievementButtons(trophyItems, season)}</div></section>
    ${zone('03','Premios individuales','Reconocimientos del jugador')}<section class="cee-phone-card"><div class="cee-phone-title"><div><small>INDIVIDUALES</small><h2>Awards</h2></div><span>${season?.awards?.length ?? 0}/${AWARDS.length}</span></div><div class="cee-phone-achievements">${achievementButtons(awardItems, season, legitAwards)}</div></section>
  </section>`;
}

function clubsView(context, ui, state) {
  context.catalog.refresh(); const offers = compatibleOffers(state); if (ui.offer > offers.length) ui.offer = Math.max(1, offers.length);
  const allClubs = context.catalog.list(), countries = [...new Set(allClubs.map(clubCountry).filter(value => value !== '—'))].sort();
  const competitions = [...new Map(allClubs.filter(club => !ui.country || clubCountry(club) === ui.country).map(club => [club.competitionId ?? club.competition_id ?? clubCompetition(club), clubCompetition(club)])).entries()].sort((a,b) => a[1].localeCompare(b[1]));
  const filters = { country:ui.country, competition:ui.competition, division:ui.division, minReputation:ui.minReputation }, query = ui.clubQuery.trim();
  const source = (query ? context.catalog.search(query, filters) : context.catalog.list(filters)).sort((a,b) => Number(b.reputation ?? b.international_reputation ?? 0) - Number(a.reputation ?? a.international_reputation ?? 0));
  const clubs = source.slice(0, 30);
  return `<section class="cee-phone-screen"><section class="cee-phone-page-head"><small>MERCADO MÓVIL</small><h1>Cambia tus ofertas</h1><p>Selecciona una oferta y busca el club que quieres.</p></section>${zone('01','Oferta objetivo','Elige qué tarjeta vas a reemplazar')}<section class="cee-phone-card cee-phone-club-card"><div class="cee-phone-title"><div><small>PASO 1</small><h2>Elige la oferta</h2></div><span>${offers.length} disponibles</span></div>
    <div class="cee-phone-offers">${offers.length ? offers.map(({option,key},index) => { const club = context.catalog.getById(option[key]); return `<button data-mobile-offer="${index + 1}" class="${ui.offer === index + 1 ? 'is-selected' : ''}"><span>${clubLogo(club)}</span><div><small>OFERTA ${index + 1}</small><strong>${escapeHtml(club?.name ?? option[key])}</strong></div></button>`; }).join('') : `<div class="cee-phone-empty">Avanza hasta una decisión con ofertas de clubes.</div>`}</div></section>
    ${zone('02','Filtros avanzados','País, competición, división y reputación')}<section class="cee-phone-card cee-phone-club-card"><div class="cee-phone-title"><div><small>PASO 2</small><h2>Busca el destino</h2></div><span>${source.length} resultados</span></div><label class="cee-phone-search"><span>⌕</span><input data-mobile-club-search value="${escapeHtml(ui.clubQuery)}" placeholder="Nombre o ID del club..." autocomplete="off"></label>
    <div class="cee-phone-club-filters"><label><span>País</span><select data-mobile-club-filter="country"><option value="">Todos</option>${countries.map(value => `<option value="${escapeHtml(value)}" ${ui.country === value ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('')}</select></label><label><span>Competición</span><select data-mobile-club-filter="competition"><option value="">Todas</option>${competitions.map(([value,label]) => `<option value="${escapeHtml(value)}" ${ui.competition === value ? 'selected' : ''}>${escapeHtml(label)}</option>`).join('')}</select></label><label><span>División</span><select data-mobile-club-filter="division"><option value="">Todas</option>${[1,2,3].map(value => `<option value="${value}" ${Number(ui.division) === value ? 'selected' : ''}>División ${value}</option>`).join('')}</select></label><label><span>Reputación</span><select data-mobile-club-filter="minReputation"><option value="">Cualquiera</option>${[1,2,3,4,5].map(value => `<option value="${value}" ${String(ui.minReputation) === String(value) ? 'selected' : ''}>${value}+</option>`).join('')}</select></label><button data-mobile-clear-filters>Limpiar filtros</button></div>
    ${zone('03','Resultados','Toca cambiar para reemplazar la oferta elegida')}<div class="cee-phone-clubs">${clubs.length ? clubs.map(club => `<article data-mobile-club="${escapeHtml(club.id)}"><span class="cee-phone-club-logo">${clubLogo(club)}</span><div><strong>${escapeHtml(club.name ?? club.id)}</strong><small>${escapeHtml(clubCountry(club))} · ${escapeHtml(clubCompetition(club))}</small><code>${escapeHtml(club.id)}</code></div><button data-mobile-replace ${offers.length ? '' : 'disabled'}>Cambiar</button></article>`).join('') : `<div class="cee-phone-empty">No encontramos clubes con esos filtros.</div>`}</div></section>
  </section>`;
}

function view(context, ui) {
  const state = context.stateManager.get(), status = mobileSpecialsStatus(context.runtime);
  if (ui.page === 'specials') return specialsView(state, status);
  if (ui.page === 'achievements') return achievementsView(state);
  if (ui.page === 'clubs') return clubsView(context, ui, state);
  return homeView(state, status);
}

export function isSmallScreen(target = window) { return target.matchMedia?.('(max-width: 640px)').matches ?? target.innerWidth <= 640; }

export function openMobilePanel(context, api) {
  const host = document.createElement('div'), root = host.attachShadow({ mode:'open' }); root.innerHTML = markup(context.config.version);
  const content = root.querySelector('.cee-phone-content'), toast = root.querySelector('.cee-phone-toast');
  const ui = { page:'home', offer:1, clubQuery:'', country:'', competition:'', division:'', minReputation:'' }; let busy = false, toastTimer;
  const notify = (message, error = false) => { clearTimeout(toastTimer); toast.textContent = message; toast.className = `cee-phone-toast is-visible${error ? ' is-error' : ''}`; toastTimer = setTimeout(() => { toast.className = 'cee-phone-toast'; }, 2800); };
  const render = () => { try { const state = context.stateManager.get(), flag = playerFlag(state); content.innerHTML = view(context, ui); root.querySelector('.cee-player-flag').textContent = flag; const launcher = document.getElementById('copero-career-editor-launcher'); if (launcher) launcher.textContent = flag; root.querySelector('.cee-phone-page-label').textContent = ({home:'INICIO',specials:'ESPECIALES',achievements:'LOGROS',clubs:'CLUBES'})[ui.page]; root.querySelectorAll('[data-mobile-tab]').forEach(button => button.classList.toggle('is-active', button.dataset.mobileTab === ui.page)); } catch (error) { content.innerHTML = `<div class="cee-phone-empty large"><strong>No encuentro una carrera abierta</strong><span>${escapeHtml(error.message)}</span></div>`; } };
  const run = async (message, action) => { if (busy) return; busy = true; const previousError = context.runtime.lastError; try { const result = await action(); if (result === undefined && context.runtime.lastError !== previousError) throw new Error(context.runtime.lastError.message); notify(message); render(); return result; } catch (error) { notify(error.message, true); } finally { busy = false; } };
  const close = () => { host.__ceeCleanup?.(); host.remove(); context.runtime.panelHost = null; };
  const refreshTimer = setInterval(() => { if (ui.page === 'specials' && !busy && host.isConnected) render(); }, 1500);
  host.__ceeCleanup = () => { clearInterval(refreshTimer); clearTimeout(toastTimer); };
  root.addEventListener('click', async event => {
    if (event.target.closest('[data-mobile-close]')) return close();
    const tab = event.target.closest('[data-mobile-tab]')?.dataset.mobileTab;
    if (tab) { ui.page = tab; content.scrollTop = 0; render(); return; }
    const command = event.target.closest('[data-mobile-command]')?.dataset.mobileCommand;
    if (command === 'undo') { await run('Cambio deshecho', () => api.undo()); return; }
    if (command === 'aas') { await run('Temporada completada', () => api.aas()); return; }
    if (command === 'legit') { await run('Temporada completada de forma realista', () => api.als()); return; }
    if (command === 'backup') { const name = `movil-${new Date().toISOString().replace(/[:.]/g,'-')}`; await run('Backup rápido creado', () => api.backup(name)); return; }
    const special = event.target.closest('[data-mobile-special]')?.dataset.mobileSpecial;
    if (special) {
      const status = mobileSpecialsStatus(context.runtime);
      if (special === 'ovr99') await run(status.ovr99 ? 'OVR 99 Freeze desactivado' : 'OVR 99 Freeze activado', () => api.mobileSpecials.ovr99(!status.ovr99));
      if (special === 'autoAll') await run(status.autoAll ? 'Automatización detenida' : 'Cada temporada se completará de forma realista', () => api.mobileSpecials.autoAll(!status.autoAll));
      if (special === 'god') await run(status.godMode ? 'Modo Dios desactivado' : 'Modo Dios activado', () => api.mobileSpecials.godMode(!status.godMode));
      if (special === 'stop') await run('Todos los especiales están pausados', () => api.mobileSpecials.stopAll());
      return;
    }
    const stat = event.target.closest('[data-mobile-stat]');
    if (stat) { const key = stat.dataset.mobileStat, amount = Number(stat.dataset.amount), label = { goals:'goles', assists:'asistencias', appearances:'partidos' }[key] ?? key; await run(`+${amount} ${label}`, () => api.stats.addLastSeason({ [key]:amount })); return; }
    const achievement = event.target.closest('[data-mobile-achievement]');
    if (achievement) { const id = achievement.dataset.mobileAchievement, collection = achievement.dataset.kind === 'award' ? api.awards : api.trophies; await run(`${achievementLabel(id)} añadido`, () => collection.add(id)); return; }
    const offer = event.target.closest('[data-mobile-offer]')?.dataset.mobileOffer;
    if (offer) { ui.offer = Number(offer); render(); return; }
    if (event.target.closest('[data-mobile-clear-filters]')) { Object.assign(ui, { country:'', competition:'', division:'', minReputation:'' }); render(); return; }
    const replace = event.target.closest('[data-mobile-replace]');
    if (replace) { const id = replace.closest('[data-mobile-club]')?.dataset.mobileClub; if (id) await run(`Oferta ${ui.offer} cambiada`, () => api.clubs.replaceOffer(ui.offer, id)); }
  });
  root.addEventListener('submit', async event => {
    if (event.target.matches('[data-mobile-stat-form]')) { event.preventDefault(); const key = event.target.dataset.statKey, amount = Number(new FormData(event.target).get('amount')); if (!Number.isInteger(amount) || amount < 1 || amount > 9999) { notify('Ingresa un número entero entre 1 y 9999', true); return; } const label = { goals:'goles', assists:'asistencias', appearances:'partidos' }[key] ?? key; await run(`+${amount} ${label}`, () => api.stats.addLastSeason({ [key]:amount })); return; }
    if (!event.target.matches('[data-mobile-ovr]')) return; event.preventDefault(); const overall = Number(new FormData(event.target).get('overall')); await run(`OVR cambiado a ${overall}`, () => api.player.overall(overall));
  });
  root.addEventListener('input', event => { if (!event.target.matches('[data-mobile-club-search]')) return; ui.clubQuery = event.target.value; render(); const input = root.querySelector('[data-mobile-club-search]'); input?.focus(); input?.setSelectionRange(input.value.length, input.value.length); });
  root.addEventListener('change', event => { const filter = event.target.dataset.mobileClubFilter; if (!filter) return; ui[filter] = event.target.value; if (filter === 'country') ui.competition = ''; render(); });
  document.documentElement.append(host); context.runtime.panelHost = host; render(); return host;
}
