type Settings = Record<string, any> | null;

// Deep merge helper
function deepMerge(base: Settings, updates: Settings): Settings {
  const result: Settings = { ...(base ?? {}) };
  if (!updates) return result;
  for (const key in updates) {
    const updateVal = updates[key];
    if (
      updateVal &&
      typeof updateVal === "object" &&
      !Array.isArray(updateVal)
    ) {
      result[key] = deepMerge((result[key] as Settings) || {}, updateVal);
    } else {
      result[key] = updateVal;
    }
  }
  return result;
}

class SettingsManager {
  private defaults: Settings;
  private currentSettings: Settings = null;

  constructor(defaults: Settings) {
    this.defaults = defaults;
  }

  /** Loads settings from storage, merges with defaults, updates currentSettings, returns merged settings */
  async load(storage: WxtStorage): Promise<Settings> {
    const stored = (await storage.getItem<Settings>("local:settings")) || {};
    this.currentSettings = deepMerge(this.defaults, stored);
    return this.currentSettings;
  }

  /** Returns current settings asynchronously */
  async get(): Promise<Settings> {
    // Just return the cached currentSettings, or you could force reload from storage here if you want
    return this.currentSettings;
  }

  /** Saves new settings merged with currentSettings to storage */
  async save(storage: WxtStorage, newSettings: Settings): Promise<Settings> {
    this.currentSettings = deepMerge(this.currentSettings, newSettings);
    await storage.setItem("local:settings", this.currentSettings);
    return this.currentSettings;
  }

  /** Clears all settings (removes 'local:settings' key) and resets currentSettings */
  async clear(storage: WxtStorage): Promise<void> {
    this.currentSettings = deepMerge(this.defaults, {}); // reset to defaults or null
    await storage.removeItem("local:settings");
  }

  /** Removes one or multiple keys from the currentSettings and updates storage */
  async remove(
    storage: WxtStorage,
    keys: string | string[],
  ): Promise<Settings> {
    if (!this.currentSettings) return null;

    if (typeof keys === "string") {
      delete this.currentSettings[keys];
    } else if (Array.isArray(keys)) {
      for (const key of keys) {
        delete this.currentSettings[key];
      }
    }

    await storage.setItem("local:settings", this.currentSettings);
    return this.currentSettings;
  }

  /** Watches storage changes and calls callback with new and old settings */
  watch(
    storage: WxtStorage,
    callback: (newSettings: Settings, oldSettings: Settings | null) => void,
  ): () => void {
    return storage.watch<Settings>(
      "local:settings",
      (newSettings, oldSettings) => {
        if (newSettings) {
          this.currentSettings = deepMerge(this.currentSettings, newSettings);
          callback(newSettings, oldSettings);
        }
      },
    );
  }
}

export { Settings, SettingsManager, deepMerge };
