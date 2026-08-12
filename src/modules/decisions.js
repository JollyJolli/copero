import { command } from './helpers.js';

const UINT32_SIZE = 4294967296;
const RANDOM_EVENTS = {
  training_extra: event => ({ lowOutcome:'positive', thresholds:[event.variantKey === 'preseason_camp' ? .65 : .7], options:['accept'] }),
  personal_coach: event => ({ lowOutcome:'positive', thresholds:[event.variantKey === 'nutrition_plan' ? .6 : .5], options:['accept'] }),
  mysterious_substance: () => ({ lowOutcome:'negative', thresholds:[.25], options:['consume'] }),
  honesty_test: () => ({ lowOutcome:'negative', thresholds:[.5], options:['accept'] }),
  indecent_proposal: () => ({ lowOutcome:'negative', thresholds:[.5], options:['proceed'] }),
  season_load: event => ({ lowOutcome:'positive', thresholds:[event.variantKey === 'double_session' ? .65 : .7], options:['accept'] }),
  position_competition: () => ({ lowOutcome:'positive', thresholds:[.5], options:['compete'] }),
  giant_tattoo: () => ({ lowOutcome:'positive', thresholds:[.7], options:['accept'] }),
  injury_at_peak: () => ({ lowOutcome:'positive', thresholds:[.3,.8], options:['play_injured','recover'] }),
  decisive_penalty: event => ({ lowOutcome:'positive', thresholds:[.5], options:(event.options ?? []).filter(option => option.type === 'career_choice').map(option => option.optionKey) })
};

const normalizeOutcome = value => {
  const outcome = String(value ?? 'auto').trim().toLowerCase();
  if (['positive','good','bueno','buena','positivo','positiva'].includes(outcome)) return 'positive';
  if (['negative','bad','malo','mala','negativo','negativa'].includes(outcome)) return 'negative';
  if (['auto','automatic','automatico','automático','random','normal'].includes(outcome)) return 'auto';
  throw new Error('Resultado inválido. Usa "positive", "negative" o "auto".');
};

export function nextDecisionRandom(rngState) {
  let value = Number(rngState) >>> 0;
  value ^= value << 13; value ^= value >>> 17; value ^= value << 5;
  const state = value >>> 0 || 1;
  return { state, value:state / UINT32_SIZE };
}

export function decisionOutcomeSpec(event) {
  if (!event || event.type !== 'career_event') return null;
  const factory = RANDOM_EVENTS[event.eventKey]; if (!factory) return null;
  const spec = factory(event), available = new Set((event.options ?? []).filter(option => option.type === 'career_choice').map(option => option.optionKey));
  const options = spec.options.filter(option => available.has(option));
  return options.length ? { ...spec, options } : null;
}

function findRngState(originalState, predicate) {
  const start = Number(originalState) >>> 0 || 1;
  for (let offset = 0; offset < 100000; offset += 1) {
    const candidate = (start + Math.imul(offset, 2654435761)) >>> 0 || 1;
    if (predicate(nextDecisionRandom(candidate).value)) return candidate;
  }
  throw new Error('No se pudo preparar un RNG compatible para esta decisión.');
}

function status(runtime, state) {
  const override = runtime.decisionOutcome;
  if (!override) return { armed:false, outcome:'auto' };
  const current = state?.currentEvent?.id === override.eventId && Number(state?.rngState) === override.forcedRngState;
  return { ...override, armed:current, consumed:!current };
}

export function setDecisionOutcome(context, requested = 'auto') {
  const outcome = normalizeOutcome(requested), state = context.stateManager.get(), previous = context.runtime.decisionOutcome;
  if (outcome === 'auto') {
    if (previous && state.currentEvent?.id === previous.eventId && Number(state.rngState) === previous.forcedRngState) {
      context.stateManager.mutate('Resultado de decisión restaurado a automático', draft => { draft.rngState = previous.originalRngState; });
    }
    context.runtime.decisionOutcome = null;
    return { armed:false, outcome:'auto' };
  }
  const event = state.currentEvent, spec = decisionOutcomeSpec(event);
  if (!spec) throw new Error('La decisión actual no tiene un resultado aleatorio positivo/negativo compatible.');
  const samePendingEvent = previous && previous.eventId === event.id && Number(state.rngState) === previous.forcedRngState;
  const originalRngState = samePendingEvent ? previous.originalRngState : (Number(state.rngState) >>> 0 || 1);
  const minimum = Math.min(...spec.thresholds), maximum = Math.max(...spec.thresholds), wantsLow = outcome === spec.lowOutcome;
  const forcedRngState = findRngState(originalRngState, value => wantsLow ? value < minimum : value >= maximum);
  context.stateManager.mutate(`Próxima decisión preparada: resultado ${outcome === 'positive' ? 'positivo' : 'negativo'}`, draft => {
    if (draft.currentEvent?.id !== event.id) throw new Error('La decisión cambió mientras se preparaba el resultado.');
    draft.rngState = forcedRngState;
  });
  context.runtime.decisionOutcome = { outcome, eventId:event.id, eventKey:event.eventKey, originalRngState, forcedRngState, compatibleOptions:spec.options, armedAt:new Date().toISOString() };
  context.logger.info(`Resultado ${outcome === 'positive' ? 'bueno' : 'malo'} preparado. Elige una opción con azar: ${spec.options.join(', ')}.`);
  return status(context.runtime, context.stateManager.get());
}

export function registerDecisions(registry) {
  command(registry, { name:'decisions.outcome', category:'decisions', description:'Fuerza el resultado bueno o malo de la decisión aleatoria actual.', usage:'careerEditor.decisions.outcome("positive")', aliases:['decisionOutcome'], execute:(context, outcome = 'auto') => setDecisionOutcome(context, outcome) });
  command(registry, { name:'decisions.good', category:'decisions', description:'Prepara un resultado positivo para la decisión actual.', usage:'careerEditor.decisions.good()', aliases:['goodDecision'], execute:context => setDecisionOutcome(context, 'positive') });
  command(registry, { name:'decisions.bad', category:'decisions', description:'Prepara un resultado negativo para la decisión actual.', usage:'careerEditor.decisions.bad()', aliases:['badDecision'], execute:context => setDecisionOutcome(context, 'negative') });
  command(registry, { name:'decisions.auto', category:'decisions', description:'Cancela un resultado preparado antes de elegir.', usage:'careerEditor.decisions.auto()', execute:context => setDecisionOutcome(context, 'auto') });
  command(registry, { name:'decisions.status', category:'decisions', description:'Muestra el resultado preparado y sus opciones compatibles.', usage:'careerEditor.decisions.status()', execute:({ runtime, stateManager }) => status(runtime, stateManager.get()) });
}
