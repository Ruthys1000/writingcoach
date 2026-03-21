// ============================================================
// Settings Store
// Reads and writes system settings from config/settings.json.
// Falls back to hardcoded defaults if the file doesn't exist.
// ============================================================

import * as fs from 'fs';
import * as path from 'path';

export interface SystemSettings {
  max_lessons: number;
  llm_timeout_seconds: number;
  rate_limit_enabled: boolean;
  rate_limit_max: number;
  rate_limit_window_minutes: number;
  site_title: string;
  site_tagline: string;
}

const CONFIG_PATH = path.join(
  process.env.CONFIG_DIR ?? (process.env.DATA_DIR ?? process.cwd()),
  'config',
  'settings.json',
);

const DEFAULTS: SystemSettings = {
  max_lessons: 3,
  llm_timeout_seconds: 120,
  rate_limit_enabled: true,
  rate_limit_max: 60,
  rate_limit_window_minutes: 15,
  site_title: 'מאמן כתיבה מנהלית',
  site_tagline: 'AI לשיפור כתיבה מנהלית מקצועית',
};

function load(): SystemSettings {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

function save(settings: SystemSettings): void {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(settings, null, 2), 'utf-8');
}

export const settingsStore = {
  get(): SystemSettings {
    return load();
  },

  update(patch: Partial<SystemSettings>): SystemSettings {
    const current = load();
    const updated = { ...current, ...patch };
    save(updated);
    return updated;
  },
};
