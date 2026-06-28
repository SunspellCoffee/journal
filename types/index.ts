export interface Coffee {
  id: string
  user_id: string
  name: string
  supplier: string | null
  origin: string | null
  process: string | null
  cultivar: string[]
  roast_level: 'ultra-light' | 'light' | 'medium-light' | 'medium' | 'medium-dark' | 'dark' | null
  flavor_notes: string[]
  weight_grams: number
  remaining_grams: number
  roast_date: string
  purchase_date: string | null
  rest_days: number
  peak_start_days: number | null
  peak_end_days: number
  status: 'active' | 'finished' | 'on_order'
  color: string
  roaster_id: string | null
  brew_mode: 'concurrent' | 'stretch' | null
  created_at: string
  updated_at: string
}

export interface Roaster {
  id: string
  user_id: string
  name: string
  website: string | null
  country: string | null
  notes: string | null
  default_rest_days: number
  default_peak_start_days: number | null
  default_peak_end_days: number
  default_weight_grams: number | null
  created_at: string
}

export interface Brew {
  id: string
  user_id: string
  coffee_id: string
  brew_date: string
  grams_used: number
  rating: number | null
  notes: string | null
  created_at: string
  coffee?: Coffee
}

export interface BrewScheduleEntry {
  id: string
  user_id: string
  coffee_id: string
  scheduled_date: string
  brew_index: number
  completed: boolean
  created_at: string
  coffee?: Coffee
}

export interface UserSettings {
  user_id: string
  brews_per_day: number
  brew_size_grams: number
  low_stock_threshold_brews: number
  notify_low_stock: boolean
  notify_ready_to_drink: boolean
  created_at: string
  updated_at: string
}

export type CoffeeStatus = 'resting' | 'ready' | 'peak' | 'fading' | 'finished'

export interface CoffeeWithStatus extends Coffee {
  computed_status: CoffeeStatus
  ready_date: string
  peak_end_date: string
  brews_remaining: number
  total_brews: number
  brews_completed: number
  days_until_ready: number
  days_in_peak: number
}

export const CULTIVAR_LIST = [
  '74110', '74112', '74158', '74165',
  'Acaiá', 'Ají', 'Arara',
  'Batian', 'Bourbon', 'Bourbon Ají',
  'Casiopea', 'Castillo', 'Catimor', 'Catuai Red', 'Catuai Yellow', 'Caturra',
  'Cenicafé 1', 'Centroamericano', 'Chandragiri', 'Chiroso', 'Colombia',
  'Dega',
  'Evaluna',
  'Gesha',
  'H3', 'Heirloom',
  'Icatú',
  'Ja\'adi',
  'K7', 'Kurume',
  'Laurina',
  'Maragogipe', 'Milenio', 'Mocha', 'Mokka', 'Mundo Novo',
  'Obatã', 'Odaini', 'Orange Bourbon',
  'Pacamara', 'Pacas', 'Pache', 'Paraíso', 'Pink Bourbon',
  'Red Bourbon', 'Ruiru 11',
  'S795', 'Sarchimor', 'Sidra', 'SL28', 'SL34', 'SL9', 'Starmaya', 'Sudan Rume',
  'Tabi', 'Tekisic', 'Typica', 'Typica Mejorado',
  'Villa Sarchi',
  'Wolisho', 'Wush Wush',
  'Yellow Bourbon',
]

export const ROAST_LEVELS = [
  { value: 'ultra-light', label: 'Ultra Light' },
  { value: 'light', label: 'Light' },
  { value: 'medium-light', label: 'Medium Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'medium-dark', label: 'Medium Dark' },
  { value: 'dark', label: 'Dark' },
]

export const COFFEE_COLORS = [
  '#E8A87C', // warm orange
  '#7CB9E8', // sky blue
  '#7CE8A8', // mint green
  '#E87CB9', // pink
  '#B97CE8', // purple
  '#E8D07C', // golden
  '#7CE8D0', // teal
  '#E87C7C', // coral
]

export function getCoffeeColor(colorHex: string): string {
  return colorHex || COFFEE_COLORS[0]
}
