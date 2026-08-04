import { command } from './helpers.js';
import { normalizeText } from '../core/utilities.js';
const CLUB_KEYS = ['teamId', 'clubId', 'currentTeamId', 'targetTeamId'];
export class ClubCatalog {
  constructor(stateManager) { this.stateManager = stateManager; this.clubs = new Map(); }
  add(value) { if (typeof value === 'string' && value) this.clubs.set(value, this.clubs.get(value) ?? { id: value, name: value }); else if (value && typeof value === 'object') { const id = value.id ?? value.teamId ?? value.clubId ?? value.slug; if (id) this.clubs.set(String(id), { ...this.clubs.get(String(id)), ...value, id: String(id), name: value.name ?? value.name_en ?? value.name_es ?? String(id) }); } }
  refresh() { this.clubs.clear(); const state = this.stateManager.get(); this.add(state.currentTeamId); this.add(state.contractTeamId); this.add(state.player?.currentTeamId); for (const s of state.seasons ?? []) this.add(s.team ?? s.teamId); for (const option of state.currentEvent?.options ?? []) { this.add(option.team ?? option.club); for (const key of CLUB_KEYS) this.add(option[key]); } return this.list(); }
  list(filters = {}) { return [...this.clubs.values()].filter(c => (!filters.country || [c.country, c.countryCode, c.country_id].includes(filters.country)) && (!filters.division || Number(c.division ?? c.divisionLevel) === Number(filters.division)) && (!filters.minReputation || Number(c.reputation ?? c.international_reputation ?? 0) >= filters.minReputation)); }
  getById(id) { if (!this.clubs.size) this.refresh(); return this.clubs.get(String(id)); }
  search(query) { if (!this.clubs.size) this.refresh(); const q = normalizeText(query); return this.list().filter(c => normalizeText(`${c.name} ${c.id}`).includes(q)); }
  has(id) { return Boolean(this.getById(id)); }
}
export function compatibleOffers(state) { return (state.currentEvent?.options ?? []).map((option, index) => ({ option, index, key: CLUB_KEYS.find(k => k in option) })).filter(x => x.key); }
export function replaceOfferState(state, humanIndex, club, add = false) {
  const offers = compatibleOffers(state); if (!offers.length) throw new Error('El evento actual no contiene una oferta compatible que pueda clonarse.');
  const source = add ? offers[0] : offers[Number(humanIndex) - 1]; if (!source) throw new Error(`No existe la oferta ${humanIndex}.`);
  if (offers.some(x => String(x.option[x.key]) === club.id)) throw new Error('Ese club ya está ofrecido.');
  const copy = structuredClone(source.option); copy[source.key] = club.id;
  for (const nested of ['team', 'club']) if (copy[nested] && typeof copy[nested] === 'object') copy[nested] = { ...copy[nested], ...club, id: club.id };
  if ('id' in copy) copy.id = `${copy.id}-editor-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  if (add) state.currentEvent.options.push(copy); else state.currentEvent.options[source.index] = copy; return copy;
}
export function registerClubs(registry, catalog) {
  command(registry, { name: 'clubs.list', category: 'clubs', description: 'Lista clubes descubiertos.', usage: 'careerEditor.clubs.list()', execute: (_, filters) => { catalog.refresh(); const rows = catalog.list(filters); console.table(rows); return rows; } });
  command(registry, { name: 'clubs.search', category: 'clubs', description: 'Busca clubes.', usage: 'careerEditor.clubs.search("Barcelona")', execute: (_, query) => { catalog.refresh(); const rows = catalog.search(query); console.table(rows); return rows; } });
  command(registry, { name: 'clubs.current', category: 'clubs', description: 'Club actual.', usage: 'careerEditor.clubs.current()', execute: ({ stateManager }) => { catalog.refresh(); return catalog.getById(stateManager.get().player?.currentTeamId ?? stateManager.get().currentTeamId); } });
  command(registry, { name: 'clubs.offers', category: 'clubs', description: 'Ofertas actuales.', usage: 'careerEditor.clubs.offers()', execute: ({ stateManager }) => compatibleOffers(stateManager.get()).map(({ option, index, key }) => ({ number: index + 1, clubId: option[key], option })) });
  for (const [name, add] of [['replaceOffer', false], ['addOffer', true]]) command(registry, { name: `clubs.${name}`, category: 'clubs', description: `${add ? 'Añade' : 'Reemplaza'} una oferta clonada.`, usage: `careerEditor.clubs.${name}(${add ? '' : '1,'}"club")`, execute: ({ stateManager }, first, second) => { catalog.refresh(); const id = add ? first : second; const club = catalog.getById(id); if (!club) throw new Error(`Club no verificado: ${id}. Usa careerEditor.clubs.search().`); let result; stateManager.mutate(`Oferta ${add ? 'añadida' : 'reemplazada'}`, d => { result = replaceOfferState(d, add ? 1 : first, club, add); }); return result; } });
  command(registry, { name: 'clubs.removeOffer', category: 'clubs', description: 'Elimina una oferta.', usage: 'careerEditor.clubs.removeOffer(2)', dangerous: true, execute: ({ stateManager }, number) => stateManager.mutate('Oferta eliminada', d => { const i = Number(number) - 1; if (!d.currentEvent?.options?.[i]) throw new Error('Oferta inexistente.'); d.currentEvent.options.splice(i, 1); }) });
  command(registry, { name: 'clubs.choose', category: 'clubs', description: 'Prepara una oferta para elegirla en la UI.', usage: 'careerEditor.clubs.choose("club")', execute: (ctx, id, options = {}) => { const strategy = options.strategy ?? 'auto'; const result = strategy === 'add' ? ctx.registry.get('clubs.addOffer').execute(ctx, id) : ctx.registry.get('clubs.replaceOffer').execute(ctx, options.offer ?? 1, id); ctx.logger.info('Oferta preparada. Pulsa la opción en la interfaz original.'); return result; } });
}
