// Sample data used until the Supabase backend exists (SPEC phase 0/1). Not real people.
import type { AvailabilityEntry, Match, Player, Team } from '@/shared/domain/types'

export const team: Team = {
  id: 't1',
  name: 'Infantil A',
  category: 'Infantil femenino',
  season: '2026-27',
  defaultSystem: '5-1',
  enabledModules: ['matches', 'roster', 'lineup'],
}

export const players: Player[] = [
  { id: 'p1', firstName: 'Lucía', lastName: 'Martín', birthYear: 2013, number: 1, mainPosition: 'setter', otherPositions: [] },
  { id: 'p2', firstName: 'Paula', lastName: 'García', birthYear: 2013, number: 2, mainPosition: 'outside', otherPositions: ['opposite'] },
  { id: 'p3', firstName: 'Marta', lastName: 'López', birthYear: 2012, number: 3, mainPosition: 'middle', otherPositions: [] },
  { id: 'p4', firstName: 'Carla', lastName: 'Sánchez', birthYear: 2012, number: 4, mainPosition: 'opposite', otherPositions: ['outside'] },
  { id: 'p5', firstName: 'Laia', lastName: 'Puig', birthYear: 2013, number: 5, mainPosition: 'outside', otherPositions: [] },
  { id: 'p6', firstName: 'Noa', lastName: 'Romero', birthYear: 2012, number: 6, mainPosition: 'middle', otherPositions: ['opposite'] },
  { id: 'p7', firstName: 'Júlia', lastName: 'Vidal', birthYear: 2013, number: 7, mainPosition: 'libero', otherPositions: ['outside'] },
  { id: 'p8', firstName: 'Ainhoa', lastName: 'Torres', birthYear: 2013, number: 8, mainPosition: 'setter', otherPositions: ['opposite'] },
  { id: 'p9', firstName: 'Irene', lastName: 'Navarro', birthYear: 2012, number: 9, mainPosition: 'outside', otherPositions: [] },
  { id: 'p10', firstName: 'Clara', lastName: 'Ruiz', birthYear: 2013, number: 10, mainPosition: 'middle', otherPositions: [] },
  { id: 'p11', firstName: 'Sara', lastName: 'Molina', birthYear: 2012, number: 11, mainPosition: 'outside', otherPositions: ['libero'] },
  { id: 'p12', firstName: 'Alba', lastName: 'Gil', birthYear: 2013, number: 12, mainPosition: 'opposite', otherPositions: [] },
]

export const matches: Match[] = [
  {
    id: 'm1',
    opponent: 'CV Sant Cugat',
    date: '2026-10-31',
    warmupTime: '10:15',
    matchTime: '11:00',
    venue: 'Pavelló Municipal Nord',
    mapsUrl: 'https://maps.google.com/?q=Pavello+Municipal+Nord',
    homeAway: 'home',
    notes: 'Traer equipación azul.',
  },
  {
    id: 'm2',
    opponent: 'CV Terrassa',
    date: '2026-11-07',
    warmupTime: '11:45',
    matchTime: '12:30',
    venue: 'Pavelló La Maurina',
    mapsUrl: 'https://maps.google.com/?q=Pavello+La+Maurina+Terrassa',
    homeAway: 'away',
  },
  {
    id: 'm3',
    opponent: 'Club Voleibol Rubí',
    date: '2026-11-15',
    warmupTime: '09:15',
    matchTime: '10:00',
    venue: 'Pavelló Municipal Nord',
    mapsUrl: 'https://maps.google.com/?q=Pavello+Municipal+Nord',
    homeAway: 'home',
  },
]

/** matchId → playerId → availability. Missing entries mean "no answer yet". */
export const initialAvailability: Record<string, Record<string, AvailabilityEntry>> = {
  m1: {
    p1: { status: 'yes' },
    p3: { status: 'yes' },
    p4: { status: 'maybe', comment: 'Depende de un examen' },
    p5: { status: 'yes' },
    p6: { status: 'yes' },
    p7: { status: 'yes' },
    p8: { status: 'no', comment: 'Fuera el fin de semana' },
    p9: { status: 'yes' },
    p10: { status: 'yes' },
    p12: { status: 'yes' },
  },
  m2: {
    p1: { status: 'yes' },
    p3: { status: 'maybe' },
  },
}

/** matchId → called-up player ids. */
export const initialCallups: Record<string, string[]> = {
  m1: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p9', 'p10', 'p12'],
}
