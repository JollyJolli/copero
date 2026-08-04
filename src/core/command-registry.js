export class CommandRegistry {
  constructor() { this.commands = new Map(); this.aliases = new Map(); }
  register(command) {
    for (const key of ['name', 'category', 'description', 'usage', 'examples', 'aliases', 'dangerous', 'validate', 'execute']) if (!(key in command)) throw new Error(`Comando incompleto (${command.name ?? '?'}): falta ${key}.`);
    if (this.commands.has(command.name)) throw new Error(`Comando duplicado: ${command.name}.`); this.commands.set(command.name, command);
    for (const alias of command.aliases) { if (this.aliases.has(alias) || this.commands.has(alias)) throw new Error(`Alias duplicado: ${alias}.`); this.aliases.set(alias, command.name); } return command;
  }
  get(name) { return this.commands.get(name) ?? this.commands.get(this.aliases.get(name)); }
  list(category) { return [...this.commands.values()].filter(c => !category || c.category === category); }
  categories() { return [...new Set(this.list().map(c => c.category))]; }
}
