import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.join(__dirname, 'data')
const DB_PATH = path.join(DATA_DIR, 'db.json')

const DEFAULT_DATA = {
  familyTrees: [
    { id: 'default', name: '我的家族', description: '默认家族家谱', createdAt: '2024-01-01' },
  ],
  members: [],
  activities: [],
  chronicleEntries: [],
  birthdayReminders: [],
  lastBirthdayScanDate: null,
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

export function readDB() {
  ensureDataDir()
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DATA, null, 2), 'utf-8')
    return JSON.parse(JSON.stringify(DEFAULT_DATA))
  }
  const raw = fs.readFileSync(DB_PATH, 'utf-8')
  return JSON.parse(raw)
}

export function writeDB(data: any) {
  ensureDataDir()
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

export function initDB() {
  ensureDataDir()
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DATA, null, 2), 'utf-8')
  }
}
