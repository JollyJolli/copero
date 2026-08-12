import { CONSOLE_THEME as T, consoleBrand, consoleSection } from '../core/console-theme.js';

const META = {
  player:['PLR','Jugador','♙'], seasons:['SEA','Temporadas','◫'], stats:['STA','Estadísticas','↗'], trophies:['TRP','Trofeos','◆'], awards:['AWD','Premios','★'], clubs:['CLB','Clubes','⌕'], decisions:['DEC','Decisiones','⚖'], backups:['BKP','Backups','□'], presets:['PRE','Presets','◇'], data:['DAT','Datos','↓'], runtime:['SYS','Sistema','⚙'], core:['CORE','General','C']
};

export class HelpRenderer {
  constructor(registry, config) { this.registry = registry; this.config = config; }
  syntax(value) { return String(value).replace(/\bcareerEditor\./g, () => this.config.prefix); }
  overview() {
    consoleBrand(this.config.version);
    console.log('%cCENTRO DE COMANDOS', T.section);
    console.log('%cBusca por categoría o abre un comando para ver ejemplos y aliases.', T.muted);
    console.log('\n%c ● API ACTIVA %c ' + this.config.prefix, T.success, T.command);
    consoleSection('Explorar');
    for (const category of this.registry.categories()) {
      const [code,label,glyph] = META[category] ?? [category.toUpperCase(),category,'•']; const count = this.registry.list(category).length;
      console.log(`%c ${glyph} %c ${code} %c ${label.padEnd(17)} %c ${String(count).padStart(2,'0')} comandos %c ${this.config.prefix}helpFor("${category}")`, 'color:#fb7185;font-weight:950', T.chip, T.text, T.muted, T.command);
    }
    consoleSection('Inicio rápido');
    for (const [label,example] of [['JUGADOR',`${this.config.prefix}overall(99)`],['EDITOR',`${this.config.prefix}player.set({ age: 24, position: "ST" })`],['DECISIÓN',`${this.config.prefix}decisions.good()`],['MERCADO',`${this.config.prefix}clubs.search("Barcelona")`],['SEGURIDAD',`${this.config.prefix}backup("antes")`],['INTERFAZ',`${this.config.prefix}panel()`]]) console.log(`%c ${label.padEnd(10)} %c ${example}`, T.chip, T.command);
    console.log('\n%c TIP %c Detalle de un comando: %c' + `${this.config.prefix}helpCommand("overall")`, T.info, T.muted, T.command);
    console.groupEnd(); return undefined;
  }
  category(name) {
    const commands = this.registry.list(name); if (!commands.length) throw new Error(`Categoría desconocida: ${name}.`);
    const [code,label,glyph] = META[name] ?? [name.toUpperCase(),name,'•'];
    console.group(`%c ${glyph} %c ${code} %c ${label.toUpperCase()} · ${commands.length} COMANDOS`, T.mark, T.chip, T.title);
    console.log('%cPulsa cada fila para abrir sus ejemplos y aliases.', T.muted);
    commands.forEach((item, index) => {
      console.groupCollapsed(`%c ${String(index + 1).padStart(2,'0')} %c ${this.syntax(item.usage)} %c ${item.dangerous ? '⚠ ' : ''}${item.description}`, item.dangerous ? T.error : T.chip, T.command, item.dangerous ? T.danger : T.muted);
      console.log('%cDESCRIPCIÓN%c  ' + item.description, T.section, T.text);
      if (item.examples.length) { console.log('\n%cEJEMPLOS', T.section); for (const example of item.examples) console.log('%c  › %c' + this.syntax(example), 'color:#f43f5e;font-weight:950', T.command); }
      if (item.aliases.length) console.log('\n%cALIASES%c  ' + item.aliases.join('  ·  '), T.section, T.muted);
      if (item.dangerous) console.warn('%c ⚠ CUIDADO %c Crea un backup antes de ejecutar este comando.', T.error, T.text);
      console.groupEnd();
    });
    console.log('\n%c VOLVER %c ' + `${this.config.prefix}help`, T.chip, T.command); console.groupEnd(); return commands;
  }
  command(name) {
    const item = this.registry.get(name); if (!item) throw new Error(`Comando desconocido: ${name}.`);
    consoleBrand(this.config.version);
    console.log('%cDETALLE DE COMANDO', T.section); console.log('%c' + item.name, T.title); console.log('%c' + item.description, T.muted);
    consoleSection('Uso'); console.log('%c' + this.syntax(item.usage), T.command);
    if (item.examples.length) { consoleSection('Ejemplos'); for (const example of item.examples) console.log('%c  › %c' + this.syntax(example), 'color:#f43f5e;font-weight:950', T.command); }
    if (item.aliases.length) { consoleSection('Aliases'); console.log('%c ' + item.aliases.join('  ·  ') + ' ', T.chip); }
    if (item.dangerous) console.warn('\n%c ⚠ OPERACIÓN PELIGROSA %c Crea un backup antes de continuar.', T.error, T.text);
    console.log('\n%c CATEGORÍA %c ' + `${this.config.prefix}helpFor("${item.category}")`, T.chip, T.command); console.groupEnd(); return item;
  }
}
