import { Settings, SettingsManager, deepMerge } from "@/libs/settingsManager";
import { useCallback, useEffect, useState } from "react";

const { appSettings } = useAppConfig();

export function useSettings(defaultOverrides: Settings = {}) {
  const finalDefaults = useMemo(() => {
    return deepMerge(appSettings, defaultOverrides);
  }, [defaultOverrides]);

  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const manager = useMemo(
    () => new SettingsManager(finalDefaults),
    [finalDefaults],
  );

  const loadSettings = useCallback(async () => {
    setLoading(true);
    const loaded = await manager.load(storage);
    setSettings(loaded);
    setLoading(false);
  }, [manager]);

  const saveSettings = useCallback(
    async (newSettings: Settings) => {
      const merged = deepMerge(settings || {}, newSettings);
      const updated = await manager.save(storage, merged);
      setSettings(updated);
    },
    [manager, settings],
  );

  const removeSettings = useCallback(
    async (keys: string | string[]) => {
      const updated = await manager.remove(storage, keys);
      setSettings(updated);
    },
    [manager],
  );

  const clearSettings = useCallback(async () => {
    await manager.clear(storage);
    setSettings(finalDefaults);
  }, [manager, finalDefaults]);

  useEffect(() => {
    loadSettings();

    const unwatch = manager.watch(storage, (newSettings) => {
      setSettings((prev) => deepMerge(prev || {}, newSettings));
    });

    return () => {
      unwatch();
    };
  }, []);

  return {
    settings,
    saveSettings,
    removeSettings,
    clearSettings,
    loading,
  };
}

/*

import { useCallback, useEffect, useMemo, useState } from "react";

const { appSettings } = useAppConfig();

type Settings = Record<string, any> | null;

const storageKey = "local:settings";

// Deep merge helper
function deepMerge(base: Settings = {}, updates: Settings = {}): Settings {
  const result = { ...base };
  for (const key in updates) {
    if (
      updates[key] &&
      typeof updates[key] === "object" &&
      !Array.isArray(updates[key])
    ) {
      result[key] = deepMerge(result[key] || {}, updates[key]);
    } else {
      result[key] = updates[key];
    }
  }
  return result;
}

export function useSettings(defaultOverrides: Settings = {}) {
  const [settings, setSettings] = useState<Settings>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const finalDefaults = useMemo(
    () => deepMerge(appSettings, defaultOverrides),
    [appSettings, defaultOverrides],
  );

  const loadSettings = useCallback(async () => {
    setLoading(true);
    const stored = (await storage.getItem<Settings>(storageKey)) || {};
    const merged = deepMerge(finalDefaults, stored);
    setSettings(merged);
    setLoading(false);
  }, [finalDefaults]);

  const saveSettings = useCallback(
    async (newSettings: Settings) => {
      const updated = deepMerge(settings, newSettings);
      setSettings(updated);
      await storage.setItem(storageKey, updated);
    },
    [settings],
  );

  useEffect(() => {
    loadSettings();

    const unwatch = storage.watch<Settings>(storageKey, (newSettings) => {
      if (newSettings) {
        setSettings((prev) => deepMerge(prev, newSettings));
      }
    });

    return () => {
      unwatch();
    };
  }, []);

  return {
    settings,
    saveSettings,
    settingsLoading: loading,
  };
}
*/
