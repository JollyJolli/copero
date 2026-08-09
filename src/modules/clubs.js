import { command } from './helpers.js';
import { normalizeText } from '../core/utilities.js';
import { VERIFIED_CLUBS } from '../data/verified-clubs.js';

const TEAM_KEYS=['teamId','clubId','currentTeamId','targetTeamId'];
const OFFER_TYPES=new Set(['join_club','join_loan','permanent_transfer']);

export function clubTableRows(clubs){return clubs.map(club=>({
  país:club.country_fifa_code??club.countryCode??club.country??club.country_id??'—',
  competición:club.competitionName??club.competition_name??club.competitionId??club.competition_id??'—',
  id:club.id
}));}

export function refreshDecisionEvent(state){
  if(!state.currentEvent)return null;
  const base=String(state.currentEvent.id??`career-event-${state.step??0}`).replace(/-cee-[a-z0-9-]+$/i,'');
  const nonce=`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
  state.currentEvent.id=`${base}-cee-${nonce}`;
  return state.currentEvent.id;
}

export class ClubCatalog{
  constructor(stateManager,verifiedClubs=VERIFIED_CLUBS){this.stateManager=stateManager;this.verifiedClubs=verifiedClubs;this.clubs=new Map();}
  add(value){
    if(typeof value==='string'&&value){if(!this.clubs.has(value))this.clubs.set(value,{id:value,name:value,source:'state'});return;}
    if(!value||typeof value!=='object')return;
    const id=value.id??value.teamId??value.clubId??value.slug;if(!id)return;
    const key=String(id),previous=this.clubs.get(key)??{};
    this.clubs.set(key,{...previous,...value,id:key,name:value.name??value.name_en??value.name_es??previous.name??key});
  }
  refresh(){
    this.clubs.clear();for(const club of this.verifiedClubs)this.add({...club,source:'verified-bundle'});
    const state=this.stateManager.get();this.add(state.currentTeamId);this.add(state.contractTeamId);this.add(state.player?.currentTeamId);
    for(const season of state.seasons??[])this.add(season.team??season.teamId);
    for(const option of state.currentEvent?.options??[]){this.add(option.team??option.club);for(const key of TEAM_KEYS)this.add(option[key]);}
    return this.list();
  }
  list(filters={}){return[...this.clubs.values()].filter(club=>(!filters.country||[club.country,club.countryCode,club.country_id,club.country_fifa_code].map(value=>String(value??'').toUpperCase()).includes(String(filters.country).toUpperCase()))&&(!filters.competition||[club.competitionId,club.competition_id,club.competitionName,club.competition_name].map(value=>normalizeText(value??'')).includes(normalizeText(filters.competition)))&&(!filters.division||Number(club.division??club.divisionLevel)===Number(filters.division))&&(!filters.minReputation||Number(club.reputation??club.international_reputation??0)>=Number(filters.minReputation)));}
  getById(id){if(!this.clubs.size)this.refresh();return this.clubs.get(String(id));}
  search(query,filters={}){if(!this.clubs.size)this.refresh();const normalized=normalizeText(query);return this.list(filters).filter(club=>normalizeText(`${club.name} ${club.short_name??''} ${club.abbreviation??''} ${club.id}`).includes(normalized));}
  has(id){return Boolean(this.getById(id));}
}

export function compatibleOffers(state){
  return(state.currentEvent?.options??[]).map((option,index)=>({option,index,key:TEAM_KEYS.find(key=>key in option)})).filter(item=>item.key&&OFFER_TYPES.has(item.option.type));
}

export function replaceOfferState(state,humanIndex,club,add=false){
  if(!state.currentEvent||!Array.isArray(state.currentEvent.options))throw new Error('No existe un evento actual con opciones.');
  const offers=compatibleOffers(state);if(!offers.length)throw new Error('El evento actual no contiene una oferta de club compatible.');
  const requested=Number(humanIndex);if(!add&&(!Number.isInteger(requested)||requested<1))throw new Error('El número de oferta debe comenzar en 1.');
  const source=add?offers[0]:offers[requested-1];if(!source)throw new Error(`No existe la oferta compatible ${humanIndex}.`);
  if(offers.some(item=>String(item.option[item.key])===club.id))throw new Error('Ese club ya está ofrecido.');
  const copy=structuredClone(source.option),previousOptionId=copy.id;copy[source.key]=club.id;
  for(const nested of ['team','club'])if(copy[nested]&&typeof copy[nested]==='object')copy[nested]={...copy[nested],...club,id:club.id};
  copy.id=add?`${copy.type}-${club.id}-editor-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`:previousOptionId;
  if(add)state.currentEvent.options.push(copy);else state.currentEvent.options[source.index]=copy;
  // Copero keeps a local visual copy until the event id changes. Rotating it
  // refreshes the card, while preserving a replaced option id keeps stale
  // buttons safe during the short transition animation.
  refreshDecisionEvent(state);
  return{option:copy,optionNumber:add?compatibleOffers(state).length:requested,optionIndex:add?state.currentEvent.options.length-1:source.index};
}

export function registerClubs(registry,catalog){
  command(registry,{name:'clubs.list',category:'clubs',description:'Lista el catálogo verificado de clubes.',usage:'careerEditor.clubs.list()',execute:({logger},filters)=>{catalog.refresh();const rows=catalog.list(filters);logger.group(`CATÁLOGO · ${rows.length} CLUBES`,true);console.table(clubTableRows(rows));console.groupEnd();return rows;}});
  command(registry,{name:'clubs.search',category:'clubs',description:'Busca en el catálogo completo verificado.',usage:'careerEditor.clubs.search("Barcelona")',execute:({logger},query)=>{catalog.refresh();const rows=catalog.search(query);logger.group(`BÚSQUEDA “${query}” · ${rows.length} RESULTADOS`);console.table(clubTableRows(rows));console.groupEnd();return rows;}});
  command(registry,{name:'clubs.current',category:'clubs',description:'Devuelve el club actual.',usage:'careerEditor.clubs.current()',execute:({stateManager})=>{catalog.refresh();return catalog.getById(stateManager.get().player?.currentTeamId??stateManager.get().currentTeamId);}});
  command(registry,{name:'clubs.offers',category:'clubs',description:'Muestra únicamente ofertas compatibles.',usage:'careerEditor.clubs.offers()',execute:({stateManager})=>compatibleOffers(stateManager.get()).map(({option,index,key},offerIndex)=>({number:offerIndex+1,optionIndex:index,kind:option.type,clubId:option[key],club:catalog.getById(option[key])??null,option}))});
  command(registry,{name:'clubs.catalogInfo',category:'clubs',description:'Diagnostica catálogo y evento actual.',usage:'careerEditor.clubs.catalogInfo()',execute:({stateManager,logger})=>{catalog.refresh();const state=stateManager.get(),report={verifiedClubs:catalog.list().filter(club=>club.source==='verified-bundle').length,totalClubs:catalog.list().length,eventType:state.currentEvent?.type??null,totalOptions:state.currentEvent?.options?.length??0,compatibleOffers:compatibleOffers(state).length,compatibleTypes:[...OFFER_TYPES]};logger.group('DIAGNÓSTICO DEL MERCADO');console.table(report);console.groupEnd();return report;}});
  for(const[name,add]of[['replaceOffer',false],['addOffer',true]])command(registry,{name:`clubs.${name}`,category:'clubs',description:`${add?'Añade':'Reemplaza'} una oferta usando una plantilla real.`,usage:`careerEditor.clubs.${name}(${add?'':'1,'}"club")`,execute:({stateManager},first,second)=>{catalog.refresh();const id=String(add?first:second),club=catalog.getById(id);if(!club||club.source!=='verified-bundle')throw new Error(`Club no verificado: ${id}. Usa careerEditor.clubs.search().`);let result;stateManager.mutate(`Oferta ${add?'añadida':'reemplazada'}`,draft=>{result=replaceOfferState(draft,add?1:first,club,add);},{syncCurrentEvent:true});return result;}});
  command(registry,{name:'clubs.removeOffer',category:'clubs',description:'Elimina una oferta compatible por número.',usage:'careerEditor.clubs.removeOffer(2)',dangerous:true,execute:({stateManager},number)=>stateManager.mutate('Oferta eliminada',draft=>{const offers=compatibleOffers(draft),offer=offers[Number(number)-1];if(!offer)throw new Error(`No existe la oferta compatible ${number}.`);draft.currentEvent.options.splice(offer.index,1);refreshDecisionEvent(draft);},{syncCurrentEvent:true})});
  command(registry,{name:'clubs.choose',category:'clubs',description:'Prepara una oferta para pulsarla en la interfaz.',usage:'careerEditor.clubs.choose("club")',execute:(context,id,options={})=>{const strategy=options.strategy??'auto';if(!['auto','replace','add'].includes(strategy))throw new Error('strategy debe ser auto, replace o add.');const commandName=strategy==='add'?'clubs.addOffer':'clubs.replaceOffer',result=context.registry.get(commandName).execute(context,...(strategy==='add'?[id]:[options.offer??1,id]));context.logger.info(`Oferta preparada en la opción ${result.optionNumber}. Pulsa esa opción en la interfaz original.`);return result;}});
}
