import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const infoDirectory=resolve(projectRoot,'info-files');
const outputPath=resolve(projectRoot,'src','data','verified-clubs.js');

async function findSourcePath(){
  const entries=await readdir(infoDirectory,{withFileTypes:true});
  const candidates=await Promise.all(entries.filter(entry=>entry.isFile()&&/^CareerSimulatorPage-.*\.js$/.test(entry.name)).map(async entry=>({path:resolve(infoDirectory,entry.name),name:entry.name,modified:(await stat(resolve(infoDirectory,entry.name))).mtimeMs})));
  candidates.sort((a,b)=>b.modified-a.modified);
  if(!candidates.length){const error=new Error('No se encontró ningún CareerSimulatorPage-*.js dentro de info-files.');error.code='ENOENT';throw error;}
  return candidates[0];
}

function decodeSingleQuotedString(raw){
  let result='';
  const simple={n:'\n',r:'\r',t:'\t',b:'\b',f:'\f',v:'\v','0':'\0',"'":"'",'\\':'\\'};
  for(let index=0;index<raw.length;index+=1){
    const character=raw[index];
    if(character!=='\\'){result+=character;continue;}
    const escaped=raw[++index];
    if(escaped==='x'){result+=String.fromCharCode(Number.parseInt(raw.slice(index+1,index+3),16));index+=2;continue;}
    if(escaped==='u'){result+=String.fromCharCode(Number.parseInt(raw.slice(index+1,index+5),16));index+=4;continue;}
    result+=simple[escaped]??escaped;
  }
  return result;
}

export async function extractVerifiedClubs(){
  let bundle,source;
  try{source=await findSourcePath();bundle=await readFile(source.path,'utf8');}
  catch(error){
    if(error.code!=='ENOENT')throw error;
    const generated=await readFile(outputPath,'utf8');
    const count=(generated.match(/"id":/g)??[]).length;
    if(count<100)throw new Error('Falta info-files y el catálogo generado parece incompleto.');
    console.log(`Using ${count} previously generated verified clubs.`);
    return null;
  }
  const candidates=[];const marker='JSON.parse(';
  for(let offset=0;(offset=bundle.indexOf(marker,offset))>=0;offset+=marker.length){
    const quoteIndex=offset+marker.length,quote=bundle[quoteIndex];if(!['\'', '"', '`'].includes(quote))continue;
    let end=quoteIndex+1;
    for(;end<bundle.length;end+=1){if(bundle[end]==='\\'){end+=1;continue;}if(bundle[end]===quote)break;}
    if(end>=bundle.length)continue;
    try{const parsed=JSON.parse(decodeSingleQuotedString(bundle.slice(quoteIndex+1,end)));if(Array.isArray(parsed)&&parsed.some(item=>Array.isArray(item?.teams)))candidates.push(parsed);}catch{}
  }
  const competitions=candidates.sort((a,b)=>b.reduce((sum,item)=>sum+(item.teams?.length??0),0)-a.reduce((sum,item)=>sum+(item.teams?.length??0),0))[0];
  if(!competitions)throw new Error(`No se encontró un catálogo de competiciones dentro de ${source.name}.`);
  const clubs=[];
  for(const competition of competitions){
    for(const team of competition.teams??[]){
      clubs.push({...team,country_fifa_code:competition.country_fifa_code,division:competition.tier,competitionId:competition.id,competitionName:competition.name,confederation:competition.confederation,reputation:team.international_reputation??team.continental_reputation??team.domestic_reputation??0});
    }
  }
  if(clubs.length<100)throw new Error(`El catálogo extraído parece incompleto: ${clubs.length} clubes.`);
  await mkdir(dirname(outputPath),{recursive:true});
  await writeFile(outputPath,`/* Generated from info-files/${source.name}. Do not edit. */\nexport const VERIFIED_CLUBS=Object.freeze(${JSON.stringify(clubs)});\n`,'utf8');
  console.log(`Extracted ${clubs.length} verified clubs from ${source.name}.`);
  return clubs;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const clubs=await extractVerifiedClubs();
  if(!clubs)console.log('Kept the previously generated verified club catalog.');
}
