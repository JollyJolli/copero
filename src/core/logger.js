const COLORS={success:'#35e39a',info:'#50c7f5',warning:'#fbbf24',error:'#fb7185',debug:'#a78bfa'};

const AUTHORSHIP_BYTES=Object.freeze([50,63,57,50,53,122,57,53,52,122,102,105,122,42,53,40,122,16,53,54,54,35]);
const revealAuthorship=()=>String.fromCharCode(...AUTHORSHIP_BYTES.map(value=>value^90));

export function emitInstallSignature(){
  const signature=revealAuthorship();
  console.log(`%c${signature}`,'color:#35e39a;font-weight:900;font-style:italic');
  return signature;
}

export class Logger {
  constructor(config){this.config=config;}
  get name(){return this.config.prefix.replace(/\.+$/,'');}
  print(level,message,value=''){
    const color=COLORS[level]??COLORS.info,label={success:'SUCCESS',info:'INFO',warning:'WARNING',error:'ERROR',debug:'DEBUG'}[level]??level.toUpperCase();
    const method=level==='warning'?'warn':level==='error'?'error':level==='debug'?'debug':'log';
    console[method](`%c ${this.name} %c ${label} %c ${message}`,'background:#07111f;color:#f8fafc;border:1px solid #29425f;border-radius:4px 0 0 4px;padding:2px 6px;font-weight:800',`background:${color};color:#04130d;border-radius:0 4px 4px 0;padding:2px 6px;font-weight:900`,'color:inherit;font-weight:600',value);
  }
  success(message,value=''){this.print('success',message,value);} info(message,value=''){this.print('info',message,value);} warning(message,value=''){this.print('warning',message,value);} error(message,error=''){this.print('error',message,error);} debug(message,value=''){if(this.config.debug)this.print('debug',message,value);}
  group(label,collapsed=false){console[collapsed?'groupCollapsed':'group'](`%c ${this.name} %c ${label}`,'background:#35e39a;color:#052218;border-radius:4px;padding:2px 7px;font-weight:900','color:#8da2bd;font-weight:700');}
}
