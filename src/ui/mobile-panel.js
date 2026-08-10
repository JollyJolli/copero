import { PANEL_CSS } from './styles.js';
import { compatibleOffers } from '../modules/clubs.js';
import { TROPHIES, AWARDS } from '../modules/trophies.js';
import { achievementLabel } from './achievement-celebration.js';

const escapeHtml = value => String(value ?? '—').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
const clubCountry = club => club?.country_fifa_code ?? club?.countryCode ?? club?.country ?? '—';
const clubLogo = club => club?.logo_url ? `<img src="${escapeHtml(club.logo_url)}" alt="">` : escapeHtml(String(club?.name ?? club?.id ?? '?').slice(0,2).toUpperCase());

function markup(version) {
  return `<style>${PANEL_CSS}</style><section class="cee-phone" role="dialog" aria-label="Copero Career Editor móvil">
    <header><div class="cee-phone-brand"><span>C</span><div><strong>CAREER EDITOR</strong><small>${escapeHtml(version)} · MOBILE</small></div></div><button data-mobile-close aria-label="Cerrar panel">×</button></header>
    <main class="cee-phone-content"></main>
    <footer><button data-mobile-command="undo">↶ Deshacer</button><button class="primary" data-mobile-command="aas">◆ Completar temporada</button></footer>
    <div class="cee-phone-toast" role="status"></div>
  </section>`;
}

function view(context, ui) {
  const state = context.stateManager.get(), player = state.player ?? {}, season = state.seasons?.at(-1);
  context.catalog.refresh(); const offers = compatibleOffers(state); if (ui.offer > offers.length) ui.offer = Math.max(1, offers.length);
  const clubs = (ui.clubQuery.trim() ? context.catalog.search(ui.clubQuery) : context.catalog.list().sort((a,b) => Number(b.reputation ?? b.international_reputation ?? 0) - Number(a.reputation ?? a.international_reputation ?? 0))).slice(0, 18);
  const achievements = [...TROPHIES.map(id => ({ id, kind:'trophy', owned:season?.trophies?.includes(id) })), ...AWARDS.map(id => ({ id, kind:'award', owned:season?.awards?.includes(id) }))];
  const stats = [{ key:'goals', label:'Goles', value:season?.stats?.goals }, { key:'assists', label:'Asistencias', value:season?.stats?.assists }, { key:'appearances', label:'Partidos', value:season?.stats?.appearances }];
  const missingAchievements = achievements.filter(item => !item.owned).length;
  return `<section class="cee-phone-hero"><div><small>JUGADOR ACTUAL</small><strong>${escapeHtml(player.lastName || 'Jugador')}</strong><span>${escapeHtml(player.currentTeamId ?? state.currentTeamId ?? 'Sin club')}</span></div><div class="cee-phone-ovr"><small>OVR</small><b>${escapeHtml(player.overall)}</b></div></section>
    <section class="cee-phone-card"><div class="cee-phone-title"><div><small>AJUSTE RÁPIDO</small><h2>Cambiar OVR</h2></div><span>1–99</span></div><form data-mobile-ovr><input name="overall" type="number" inputmode="numeric" min="1" max="99" value="${escapeHtml(player.overall ?? 80)}"><button>Guardar OVR</button></form></section>
    <section class="cee-phone-card"><div class="cee-phone-title"><div><small>ÚLTIMA TEMPORADA</small><h2>Estadísticas</h2></div><span>${season ? 'Suma rápida' : 'Sin temporada'}</span></div><div class="cee-phone-stats">${stats.map(item => `<article><div><small>${item.label}</small><strong>${Number(item.value) || 0}</strong></div><div>${[1,5,10].map(amount => `<button data-mobile-stat="${item.key}" data-amount="${amount}" ${!season ? 'disabled' : ''}>+${amount}</button>`).join('')}</div></article>`).join('')}</div></section>
    <section class="cee-phone-card"><div class="cee-phone-title"><div><small>ÚLTIMA TEMPORADA</small><h2>Trofeos y premios</h2></div><span>${season ? `${(season.trophies?.length ?? 0) + (season.awards?.length ?? 0)} logros` : 'Sin temporada'}</span></div><button class="cee-phone-add-all" data-mobile-command="aas" ${!season || !missingAchievements ? 'disabled' : ''}><span>◆</span><strong>Añadir todos</strong><small>${season ? `${missingAchievements} pendientes` : 'Necesitas una temporada'}</small></button><div class="cee-phone-achievements">${achievements.map(item => `<button data-mobile-achievement="${item.id}" data-kind="${item.kind}" class="${item.owned ? 'is-owned' : ''}" ${!season || item.owned ? 'disabled' : ''}><i>${item.kind === 'award' ? '★' : '◆'}</i><span>${escapeHtml(achievementLabel(item.id))}</span><b>${item.owned ? '✓' : '+'}</b></button>`).join('')}</div></section>
    <section class="cee-phone-card"><div class="cee-phone-title"><div><small>MERCADO</small><h2>Reemplazar una oferta</h2></div><span>${offers.length} ofertas</span></div>
      <div class="cee-phone-offers">${offers.length ? offers.map(({option,key},index) => { const club = context.catalog.getById(option[key]); return `<button data-mobile-offer="${index + 1}" class="${ui.offer === index + 1 ? 'is-selected' : ''}"><span>${clubLogo(club)}</span><div><small>OFERTA ${index + 1}</small><strong>${escapeHtml(club?.name ?? option[key])}</strong></div></button>`; }).join('') : `<div class="cee-phone-empty">Avanza hasta una decisión con ofertas de clubes.</div>`}</div>
      <label class="cee-phone-search"><span>⌕</span><input data-mobile-club-search value="${escapeHtml(ui.clubQuery)}" placeholder="Buscar club por nombre o ID..." autocomplete="off"></label>
      <div class="cee-phone-clubs">${clubs.length ? clubs.map(club => `<article data-mobile-club="${escapeHtml(club.id)}"><span class="cee-phone-club-logo">${clubLogo(club)}</span><div><strong>${escapeHtml(club.name ?? club.id)}</strong><small>${escapeHtml(clubCountry(club))} · ${escapeHtml(club.competitionName ?? club.competitionId ?? '')}</small><code>${escapeHtml(club.id)}</code></div><button data-mobile-replace ${offers.length ? '' : 'disabled'}>Cambiar</button></article>`).join('') : `<div class="cee-phone-empty">No encontramos ese club.</div>`}</div>
    </section>`;
}

export function isSmallScreen(target = window) { return target.matchMedia?.('(max-width: 640px)').matches ?? target.innerWidth <= 640; }

export function openMobilePanel(context, api) {
  const host = document.createElement('div'), root = host.attachShadow({ mode:'open' }); root.innerHTML = markup(context.config.version);
  const content = root.querySelector('.cee-phone-content'), toast = root.querySelector('.cee-phone-toast'); const ui = { offer:1, clubQuery:'' }; let busy = false, toastTimer;
  const notify = (message, error = false) => { clearTimeout(toastTimer); toast.textContent = message; toast.className = `cee-phone-toast is-visible${error ? ' is-error' : ''}`; toastTimer = setTimeout(() => { toast.className = 'cee-phone-toast'; }, 2800); };
  const render = () => { try { content.innerHTML = view(context, ui); } catch (error) { content.innerHTML = `<div class="cee-phone-empty large"><strong>No encuentro una carrera abierta</strong><span>${escapeHtml(error.message)}</span></div>`; } };
  const run = async (message, action) => { if (busy) return; busy = true; const previousError = context.runtime.lastError; try { const result = await action(); if (result === undefined && context.runtime.lastError !== previousError) throw new Error(context.runtime.lastError.message); notify(message); render(); return result; } catch (error) { notify(error.message, true); } finally { busy = false; } };
  root.addEventListener('click', async event => {
    if (event.target.closest('[data-mobile-close]')) { host.remove(); context.runtime.panelHost = null; return; }
    const command = event.target.closest('[data-mobile-command]')?.dataset.mobileCommand;
    if (command === 'undo') { await run('Cambio deshecho', () => api.undo()); return; }
    if (command === 'aas') { await run('Temporada completada', () => api.aas()); return; }
    const stat = event.target.closest('[data-mobile-stat]');
    if (stat) { const key = stat.dataset.mobileStat, amount = Number(stat.dataset.amount), label = { goals:'goles', assists:'asistencias', appearances:'partidos' }[key] ?? key; await run(`+${amount} ${label}`, () => api.stats.addLastSeason({ [key]:amount })); return; }
    const achievement = event.target.closest('[data-mobile-achievement]');
    if (achievement) { const id = achievement.dataset.mobileAchievement, collection = achievement.dataset.kind === 'award' ? api.awards : api.trophies; await run(`${achievementLabel(id)} añadido`, () => collection.add(id)); return; }
    const offer = event.target.closest('[data-mobile-offer]')?.dataset.mobileOffer;
    if (offer) { ui.offer = Number(offer); render(); return; }
    const replace = event.target.closest('[data-mobile-replace]');
    if (replace) { const id = replace.closest('[data-mobile-club]')?.dataset.mobileClub; if (id) await run(`Oferta ${ui.offer} cambiada`, () => api.clubs.replaceOffer(ui.offer, id)); }
  });
  root.addEventListener('submit', async event => { if (!event.target.matches('[data-mobile-ovr]')) return; event.preventDefault(); const overall = Number(new FormData(event.target).get('overall')); await run(`OVR cambiado a ${overall}`, () => api.player.overall(overall)); });
  root.addEventListener('input', event => { if (!event.target.matches('[data-mobile-club-search]')) return; ui.clubQuery = event.target.value; render(); const input = root.querySelector('[data-mobile-club-search]'); input?.focus(); input?.setSelectionRange(input.value.length, input.value.length); });
  document.documentElement.append(host); context.runtime.panelHost = host; render(); return host;
}
