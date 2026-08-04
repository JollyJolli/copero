export class CommandHandler {
  constructor(registry, context) { this.registry = registry; this.context = context; }
  run(name, ...args) {
    return this.context.errorHandler.guard(name, () => {
      const command = this.registry.get(name);
      if (!command) throw new Error(`Comando desconocido: ${name}. Usa ${this.context.config.prefix}help.`);
      command.validate(args, this.context);
      return command.execute(this.context, ...args);
    });
  }
}
