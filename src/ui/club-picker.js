import { PANEL_CSS } from './styles.js';

export function closeClubPicker(context) { context.runtime.clubPanelHost?.remove(); context.runtime.clubPanelHost = null; }

export function openClubPicker(context, api, catalog) {
  closeClubPicker(context);
  const host = document.createElement('div'); const root = host.attachShadow({ mode:'open' });
  root.innerHTML = `<style>${PANEL_CSS}</style><section class="cee-market" role="dialog" aria-label="Selector de clubes">
    <header class="cee-market-head"><div class="cee-market-logo">C</div><div><p>MERCADO DE PASES</p><h2>Busca tu próximo club</h2></div><button data-close>×</button></header>
    <div class="cee-market-tools"><label class="cee-market-search"><i>⌕</i><input placeholder="Buscar club por nombre o ID..." autocomplete="off"></label><select aria-label="Estrategia"><option value="replace">Reemplazar oferta 1</option><option value="add">Añadir oferta</option></select></div>
    <div class="cee-market-meta"><span>CLUBES VERIFICADOS</span><b class="cee-count">0 resultados</b></div>
    <main class="cee-market-results"></main>
    <footer><span class="cee-status-dot"></span><p class="cee-market-message">Selecciona un club para preparar una oferta compatible.</p><code>${context.config.prefix}</code></footer>
  </section>`;
  const input = root.querySelector('input'); const results = root.querySelector('.cee-market-results'); const message = root.querySelector('.cee-market-message'); const count = root.querySelector('.cee-count');
  const showMessage = (value, error = false) => { message.textContent = value; message.classList.toggle('is-error', error); };
  const render = () => {
    try {
      catalog.refresh(); const clubs = catalog.search(input.value); count.textContent = `${clubs.length} resultados`;
      if (!clubs.length) { results.innerHTML = '<div class="cee-empty"><i>⌕</i><strong>No encontramos ese club</strong><span>Prueba otro nombre o identificador.</span></div>'; return; }
      results.replaceChildren(...clubs.slice(0, 60).map(club => {
        const row = document.createElement('button'); row.className = 'cee-market-club'; row.type = 'button';
        const logo = document.createElement('span'); logo.className = 'cee-market-club-logo';
        if (club.logo_url) { const image = document.createElement('img'); image.src = club.logo_url; image.alt = ''; logo.append(image); }
        else logo.textContent = String(club.name ?? club.id).slice(0, 2).toUpperCase();
        const body = document.createElement('span'); body.className = 'cee-market-club-copy';
        const title = document.createElement('strong'); title.textContent = club.name ?? club.id;
        const detail = document.createElement('small'); detail.textContent = `${club.country ?? club.country_fifa_code ?? 'País desconocido'} · División ${club.division ?? club.divisionLevel ?? '?'}`;
        const id = document.createElement('code'); id.textContent = club.id; body.append(title, detail, id);
        const reputation = document.createElement('b'); reputation.textContent = `REP ${club.reputation ?? club.international_reputation ?? '?'}`;
        row.append(logo, body, reputation);
        row.onclick = () => { const before = context.runtime.lastError; const result = api.clubs.choose(club.id, { strategy:root.querySelector('select').value }); if (result === undefined && context.runtime.lastError !== before) showMessage(context.runtime.lastError.message, true); else showMessage(`Oferta de ${club.name ?? club.id} preparada. Confírmala desde el juego.`); };
        return row;
      }));
    } catch (error) { results.innerHTML = '<div class="cee-empty"><strong>No se pudo abrir el catálogo</strong></div>'; showMessage(error.message, true); }
  };
  input.oninput = render; root.querySelector('[data-close]').onclick = () => closeClubPicker(context);
  document.documentElement.append(host); context.runtime.clubPanelHost = host; render(); input.focus(); return host;
}
