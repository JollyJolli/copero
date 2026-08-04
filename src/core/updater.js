const cacheBuster = url => `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;

async function fetchText(fetcher, url, label) {
  const response = await fetcher(cacheBuster(url), { cache: 'no-store' });
  if (!response.ok) throw new Error(`${label}: HTTP ${response.status}`);
  return response.text();
}

export function validateManifest(value) {
  if (!value || typeof value !== 'object' || typeof value.version !== 'string' || !value.version.trim()) throw new Error('El manifiesto de actualización no contiene una versión válida.');
  return { version: value.version.trim() };
}

export function createUpdater({ config, runtime, logger, errorHandler, getApi, globalObject = window, fetcher = fetch }) {
  return async function update(options = {}) {
    const settings = options && typeof options === 'object' ? options : {};
    try {
      logger.info('Buscando una versión nueva...');
      const manifestText = await fetchText(fetcher, config.updateManifestUrl, 'No se pudo consultar la versión');
      let manifest;
      try { manifest = validateManifest(JSON.parse(manifestText)); } catch (error) { throw new Error(`Manifiesto inválido: ${error.message}`); }
      const available = manifest.version !== config.version;
      const result = { current: config.version, latest: manifest.version, available };
      if (settings.checkOnly) {
        logger[available ? 'warning' : 'success'](available ? `Nueva versión disponible: v${manifest.version}` : `Ya tienes la última versión: v${config.version}`);
        return result;
      }
      if (!available && !settings.force) { logger.success(`Ya tienes la última versión: v${config.version}`); return result; }

      logger.info(`Descargando v${manifest.version}...`);
      const code = await fetchText(fetcher, config.updateScriptUrl, 'No se pudo descargar la actualización');
      if (!code.includes('COPERO CAREER EDITOR')) throw new Error('El archivo descargado no parece ser Copero Career Editor.');
      const install = new Function(code);
      const oldApi = getApi(); const oldName = runtime.globalName;
      install.call(globalObject);
      const newApi = globalObject.careerEditor;
      if (!newApi?.__coperoCareerEditor || newApi.installationFailed) throw new Error('La versión nueva no pudo instalarse correctamente.');
      if (newApi.version !== manifest.version) throw new Error(`GitHub anunció v${manifest.version}, pero el archivo instaló v${newApi.version}.`);
      if (oldName !== 'careerEditor') { oldApi.destroy?.({ silent: true }); newApi.setPrefix(oldName); }
      logger.success(`Actualizado de v${config.version} a v${manifest.version}.`);
      return newApi;
    } catch (error) {
      errorHandler.capture(error, { phase: 'update', command: 'update', recovery: [`${config.prefix}update()`, 'Comprueba tu conexión a internet.', 'Si GitHub está caído, inténtalo más tarde.'] });
      return undefined;
    }
  };
}
