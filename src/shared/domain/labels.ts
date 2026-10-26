import type { AvailabilityStatus, GameSystem, Position } from './types'

export const POSITION_LABELS: Record<Position, string> = {
  setter: 'Colocador',
  outside: 'Receptor',
  middle: 'Central',
  opposite: 'Opuesto',
  libero: 'Líbero',
}

export const POSITION_SHORT_LABELS: Record<Position, string> = {
  setter: 'COL',
  outside: 'REC',
  middle: 'CEN',
  opposite: 'OPU',
  libero: 'LÍB',
}

/** Background/text classes per position, shared by badges and the court. */
export const POSITION_COLORS: Record<Position, string> = {
  setter: 'bg-amber-400 text-amber-950',
  outside: 'bg-sky-500 text-white',
  middle: 'bg-emerald-500 text-white',
  opposite: 'bg-rose-500 text-white',
  libero: 'bg-violet-500 text-white',
}

export const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  yes: 'Sí',
  no: 'No',
  maybe: 'Duda',
}

export const SYSTEM_LABELS: Record<GameSystem, string> = {
  '5-1': '5-1',
  '6-0': '6-0',
  '4-2': '4-2',
  '6-2': '6-2',
  '4-2-front': '4-2 con posiciones delanteras',
}
