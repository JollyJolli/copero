export function playerCountryIso(state) {
  const player = state?.player ?? {};
  const value = player.nationality?.iso_alpha2 ?? player.nationality?.isoAlpha2 ?? player.nationalityIsoAlpha2 ?? player.nationality_iso_alpha2 ?? state?.identity?.nationalityIsoAlpha2 ?? state?.nationalityIsoAlpha2;
  const iso = String(value ?? '').trim().toUpperCase();
  return /^[A-Z]{2}$/.test(iso) ? iso : null;
}

export function countryFlag(iso, fallback = '🌍') {
  const value = String(iso ?? '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(value)) return fallback;
  return String.fromCodePoint(...[...value].map(letter => 127397 + letter.charCodeAt(0)));
}

export function playerFlag(state) { return countryFlag(playerCountryIso(state)); }

export function overallTier(value) {
  const overall = Number(value) || 0;
  if (overall <= 69) return 'bronze';
  if (overall <= 79) return 'silver';
  if (overall <= 89) return 'gold';
  if (overall <= 94) return 'diamond';
  if (overall <= 98) return 'elite';
  return 'ultimate';
}
