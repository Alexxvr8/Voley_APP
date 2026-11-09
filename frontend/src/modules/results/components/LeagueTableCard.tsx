// Unofficial league table. Everyone sees it with "Actualizada el dd/mm"; staff add, edit or remove it.
import { useState } from 'react'
import { Card } from '@/shared/ui/Card'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'
import { PRIMARY_BUTTON_CLASS, SECONDARY_BUTTON_CLASS } from '@/shared/ui/form'
import { useRemoveLeagueTable, useSaveLeagueTable, type LeagueTable } from '../api'
import { EMPTY_ROW, sortTable, type LeagueRow } from '../leagueTable'

interface LeagueTableCardProps {
  teamId: string
  /** Season the table belongs to. */
  seasonId: string
  table: LeagueTable | null
  /** Staff can edit; players only read. */
  editable: boolean
}

const dateFormatter = new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit' })
const NUMBER_FIELDS: { key: Exclude<keyof LeagueRow, 'team'>; label: string }[] = [
  { key: 'played', label: 'PJ' },
  { key: 'won', label: 'PG' },
  { key: 'lost', label: 'PP' },
  { key: 'points', label: 'Pts' },
]

export function LeagueTableCard({ teamId, seasonId, table, editable }: LeagueTableCardProps) {
  const save = useSaveLeagueTable(teamId, seasonId)
  const remove = useRemoveLeagueTable(seasonId)
  const [draft, setDraft] = useState<LeagueRow[] | null>(null)
  const [confirmingRemove, setConfirmingRemove] = useState(false)

  function startEditing() {
    setDraft(table?.rows.length ? table.rows : [{ ...EMPTY_ROW }])
  }

  function change(index: number, changes: Partial<LeagueRow>) {
    setDraft(draft!.map((row, i) => (i === index ? { ...row, ...changes } : row)))
  }

  if (!table && !draft) {
    if (!editable) return null
    return (
      <Card className="space-y-2">
        <p className="font-semibold">Tabla de liga</p>
        <p className="text-sm text-slate-500">
          Opcional. La rellenas a mano y el equipo la ve con la fecha de actualización.
        </p>
        <button type="button" onClick={startEditing} className={SECONDARY_BUTTON_CLASS}>
          Añadir tabla de liga
        </button>
      </Card>
    )
  }

  if (draft) {
    return (
      <Card className="space-y-3">
        <p className="font-semibold">Editar tabla de liga</p>
        <div className="space-y-2 overflow-x-auto">
          <div className="grid min-w-[28rem] grid-cols-[1fr_repeat(4,3.5rem)_2rem] gap-2 text-xs font-semibold text-slate-500">
            <span>Equipo</span>
            {NUMBER_FIELDS.map((field) => (
              <span key={field.key} className="text-center">
                {field.label}
              </span>
            ))}
            <span />
          </div>
          {draft.map((row, index) => (
            <div
              key={index}
              className="grid min-w-[28rem] grid-cols-[1fr_repeat(4,3.5rem)_2rem] items-center gap-2"
            >
              <input
                value={row.team}
                onChange={(e) => change(index, { team: e.target.value })}
                aria-label={`Equipo, fila ${index + 1}`}
                className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
              />
              {NUMBER_FIELDS.map((field) => (
                <input
                  key={field.key}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={row[field.key]}
                  onChange={(e) =>
                    change(index, { [field.key]: Math.max(0, Number(e.target.value)) })
                  }
                  aria-label={`${field.label}, fila ${index + 1}`}
                  className="rounded-lg border border-slate-300 px-1 py-1.5 text-center text-sm"
                />
              ))}
              <button
                type="button"
                onClick={() => setDraft(draft.filter((_, i) => i !== index))}
                aria-label={`Quitar fila ${index + 1}`}
                className="text-slate-400 hover:text-rose-700"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setDraft([...draft, { ...EMPTY_ROW }])}
          className="text-sm font-medium text-blue-800 underline"
        >
          + Añadir equipo
        </button>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={save.isPending}
            onClick={() => save.mutate(sortTable(draft), { onSuccess: () => setDraft(null) })}
            className={PRIMARY_BUTTON_CLASS}
          >
            {save.isPending ? 'Guardando…' : 'Guardar tabla'}
          </button>
          <button type="button" onClick={() => setDraft(null)} className={SECONDARY_BUTTON_CLASS}>
            Cancelar
          </button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold">Tabla de liga (no oficial)</p>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
          Actualizada el {dateFormatter.format(new Date(table!.updatedAt))}
        </span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-slate-500">
            <th className="w-6 text-left">#</th>
            <th className="text-left">Equipo</th>
            {NUMBER_FIELDS.map((field) => (
              <th key={field.key} className="w-10 text-center">
                {field.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table!.rows.map((row, index) => (
            <tr key={row.team} className="border-t border-slate-100">
              <td className="py-1.5 font-semibold text-slate-400">{index + 1}</td>
              <td className="py-1.5 font-medium text-slate-900">{row.team}</td>
              {NUMBER_FIELDS.map((field) => (
                <td
                  key={field.key}
                  className={`text-center ${field.key === 'points' ? 'font-bold' : ''}`}
                >
                  {row[field.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {editable && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={startEditing}
            className="text-sm font-medium text-blue-800 underline"
          >
            Editar tabla
          </button>
          <button
            type="button"
            onClick={() => setConfirmingRemove(true)}
            className="text-sm font-medium text-rose-700 underline"
          >
            Quitar tabla
          </button>
        </div>
      )}
      {confirmingRemove && (
        <ConfirmDialog
          title="¿Quitar la tabla de liga?"
          confirmLabel="Quitar"
          busy={remove.isPending}
          onCancel={() => setConfirmingRemove(false)}
          onConfirm={() =>
            remove.mutate(undefined, { onSuccess: () => setConfirmingRemove(false) })
          }
        >
          Dejará de verse en el equipo. Podrás añadirla otra vez cuando quieras.
        </ConfirmDialog>
      )}
    </Card>
  )
}
