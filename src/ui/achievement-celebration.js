const LABELS = {
  league: 'Liga', cup: 'Copa nacional', continental_primary: 'Competición continental', continental_secondary: 'Competición continental secundaria',
  club_world_cup: 'Mundial de Clubes', national_continental: 'Torneo continental de selecciones', world_cup: 'Copa Mundial',
  ballon_dor: 'Balón de Oro', golden_boot: 'Bota de Oro', golden_glove: 'Guante de Oro'
};
const HOST_ID = 'cee-achievement-celebration';
export function achievementLabel(id) { return LABELS[id] ?? String(id).replaceAll('_', ' '); }
export function showAchievementCelebration(entries = []) {
  if (typeof document === 'undefined' || !entries.length) return false;
  const unique = [...new Map(entries.map(entry => [`${entry.kind}:${entry.id}`, entry])).values()];
  document.getElementById(HOST_ID)?.remove();
  const host = document.createElement('div'); host.id = HOST_ID;
  const preview = unique.slice(0, 4).map(({ kind }) => kind === 'award' ? '★' : '◆').join('');
  const title = unique.length === 1 ? achievementLabel(unique[0].id) : `${unique.length} logros desbloqueados`;
  const subtitle = unique.length === 1 ? (unique[0].kind === 'award' ? 'PREMIO CONSEGUIDO' : 'TROFEO CONSEGUIDO') : `${unique.filter(x => x.kind === 'trophy').length} trofeos · ${unique.filter(x => x.kind === 'award').length} premios`;
  host.innerHTML = `<style>@keyframes cee-achievement-in{0%{opacity:0;transform:translateY(24px) scale(.88)}55%{opacity:1;transform:translateY(-3px) scale(1.02)}100%{opacity:1;transform:translateY(0) scale(1)}}@keyframes cee-achievement-out{to{opacity:0;transform:translateY(-12px) scale(.96)}}#${HOST_ID}{position:fixed;right:24px;bottom:24px;z-index:2147483647;pointer-events:none;font-family:ui-sans-serif,system-ui,sans-serif}#${HOST_ID} article{display:flex;align-items:center;gap:12px;min-width:270px;max-width:340px;padding:12px 16px;border:1px solid rgba(253,230,138,.45);border-radius:16px;color:#fff;background:linear-gradient(135deg,rgba(69,26,3,.98),rgba(120,53,15,.98));box-shadow:0 18px 45px rgba(0,0,0,.42),inset 0 1px rgba(255,255,255,.16);animation:cee-achievement-in .48s cubic-bezier(.22,.9,.3,1) both}#${HOST_ID} i{display:grid;place-items:center;width:46px;height:46px;flex:none;border-radius:13px;color:#fef3c7;background:linear-gradient(145deg,#f59e0b,#b45309);box-shadow:inset 0 1px rgba(255,255,255,.35);font-size:22px;font-style:normal;letter-spacing:-5px;padding-right:5px}#${HOST_ID} small,#${HOST_ID} strong{display:block}#${HOST_ID} small{margin-bottom:3px;color:#fde68a;font-size:9px;font-weight:900;letter-spacing:.12em}#${HOST_ID} strong{font-size:14px;line-height:1.15}</style><article><i>${preview}</i><div><small>${subtitle}</small><strong>${title}</strong></div></article>`;
  document.documentElement.append(host);
  setTimeout(() => { const card = host.querySelector('article'); if (card) card.style.animation = 'cee-achievement-out .35s ease both'; setTimeout(() => host.remove(), 360); }, unique.length === 1 ? 2400 : 3400);
  return true;
}
