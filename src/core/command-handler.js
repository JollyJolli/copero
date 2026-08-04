export class CommandHandler {
  constructor(registry, context) { this.registry = registry; this.context = context; }
  run(name, ...args) { try { const command = this.registry.get(name); if (!command) throw new Error(`Comando desconocido: ${name}. Usa ${this.context.config.prefix}help.`); command.validate(args, this.context); return command.execute(this.context, ...args); } catch (error) { this.context.logger.error(`Falló ${name}. Prueba ${this.context.config.prefix}diagnose().`, this.context.config.debug ? error : error.message); return undefined; } }
}
