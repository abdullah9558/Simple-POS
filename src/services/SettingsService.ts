import { getPrisma } from './prisma.ts'
import {
  type AppSettings,
  type SettingsKey,
  DEFAULT_SETTINGS,
  SETTINGS_KEYS,
} from '../shared/settings.ts'

export type { AppSettings, SettingsKey }

export class SettingsService {
  private get db() {
    return getPrisma()
  }

  async get(key: SettingsKey): Promise<string> {
    const setting = await this.db.setting.findUnique({ where: { key } })
    return setting?.value ?? DEFAULT_SETTINGS[key]
  }

  async set(key: SettingsKey, value: string): Promise<void> {
    await this.db.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  }

  async getAll(): Promise<AppSettings> {
    const settings = await this.db.setting.findMany()
    const map = new Map(settings.map((s) => [s.key, s.value]))

    const result = { ...DEFAULT_SETTINGS }
    for (const key of SETTINGS_KEYS) {
      if (map.has(key)) result[key] = map.get(key)!
    }
    return result
  }

  async updateAll(settings: Partial<AppSettings>): Promise<AppSettings> {
    for (const [key, value] of Object.entries(settings)) {
      if (value !== undefined && SETTINGS_KEYS.includes(key as SettingsKey)) {
        await this.set(key as SettingsKey, String(value))
      }
    }
    return this.getAll()
  }
}
