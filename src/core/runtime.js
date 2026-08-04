export const createRuntime = () => ({ installedAt: new Date().toISOString(), lastLocator: null, watcherTimer: null, freezes: new Map(), panelHost: null });
