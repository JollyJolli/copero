import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const sourcePath=resolve(projectRoot,'info-files','CareerSimulatorPage-Cu3K3f1m.js');
const outputPath=resolve(projectRoot,'src','data','verified-clubs.js');

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
  let bundle;
  try{bundle=await readFile(sourcePath,'utf8');}
  catch(error){
    if(error.code!=='ENOENT')throw error;
    const generated=await readFile(outputPath,'utf8');
    const count=(generated.match(/"id":/g)??[]).length;
    if(count<100)throw new Error('Falta info-files y el catálogo generado parece incompleto.');
    console.log(`Using ${count} previously generated verified clubs.`);
    return null;
  }
  const match=bundle.match(/kr=JSON\.parse\((['`])([\s\S]*?)\1\),Ge=/);
  if(!match)throw new Error('No se encontró el catálogo kr dentro del bundle verificado.');
  const competitions=JSON.parse(decodeSingleQuotedString(match[2]));
  const clubs=[];
  for(const competition of competitions){
    for(const team of competition.teams??[]){
      clubs.push({...team,country_fifa_code:competition.country_fifa_code,division:competition.tier,competitionId:competition.id,competitionName:competition.name,confederation:competition.confederation,reputation:team.international_reputation??team.continental_reputation??team.domestic_reputation??0});
    }
  }
  if(clubs.length<100)throw new Error(`El catálogo extraído parece incompleto: ${clubs.length} clubes.`);
  await mkdir(dirname(outputPath),{recursive:true});
  await writeFile(outputPath,`/* Generated from info-files/CareerSimulatorPage-Cu3K3f1m.js. Do not edit. */\nexport const VERIFIED_CLUBS=Object.freeze(${JSON.stringify(clubs)});\n`,'utf8');
  return clubs;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const clubs=await extractVerifiedClubs();
  console.log(`Extracted ${clubs.length} verified clubs.`);
}
