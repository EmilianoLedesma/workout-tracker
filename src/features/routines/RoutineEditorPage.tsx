import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCatalog } from '@/features/exercises/useCatalog'
import { useSettings } from '@/features/settings/useSettings'
import { DAY_LABELS, type DayLabel } from '@/types/routine'
import { ExercisePicker } from './ExercisePicker'
import {
  addItem,
  draftFromRoutine,
  moveItem,
  removeItem,
  updateItem,
  validateDraft,
  type Draft,
  type DraftErrors,
} from './routineDraft'
import { useRoutine, useSaveRoutine } from './useRoutines'

const EMPTY: Draft = { name: '', dayLabel: null, items: [] }
const field = 'bg-background h-11 rounded-md border px-3'

export default function RoutineEditorPage() {
  const { routineId } = useParams()
  return routineId ? (
    <EditExisting id={routineId} />
  ) : (
    <Editor routineId={null} initial={EMPTY} />
  )
}

function EditExisting({ id }: { id: string }) {
  const { routine, error } = useRoutine(id)
  if (error) {
    return <p role="alert">Could not load this routine.</p>
  }
  if (routine === undefined) return <p role="status">Loading routine…</p>
  if (routine === null) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p>Routine not found</p>
        <Button asChild className="min-h-11 px-4">
          <Link to="/routines">Back to routines</Link>
        </Button>
      </div>
    )
  }
  return <Editor key={id} routineId={id} initial={draftFromRoutine(routine)} />
}

// A number box that can be emptied while typing; an empty box reads as NaN.
const toNumber = (text: string) => (text.trim() === '' ? NaN : Number(text))
const show = (n: number) => (Number.isNaN(n) ? '' : String(n))

function Editor({
  routineId,
  initial,
}: {
  routineId: string | null
  initial: Draft
}) {
  const navigate = useNavigate()
  const catalog = useCatalog()
  const { settings } = useSettings()
  const save = useSaveRoutine()
  const [draft, setDraft] = useState(initial)
  const [errors, setErrors] = useState<DraftErrors>({ items: {} })
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const names = new Map(catalog.data?.exercises.map((e) => [e.id, e.name]))

  const submit = async () => {
    const found = validateDraft(draft)
    setErrors(found)
    const firstItem = Object.keys(found.items)[0]
    const firstBad = found.name
      ? 'routine-name'
      : firstItem !== undefined
        ? `item-${firstItem}-sets`
        : null
    if (firstBad) {
      document.getElementById(firstBad)?.focus()
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      await save.mutateAsync({ id: routineId, draft })
      navigate('/routines')
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
    >
      <h1 className="page-title">
        {routineId ? 'Edit routine' : 'New routine'}
      </h1>

      <div className="flex flex-col gap-1">
        <label htmlFor="routine-name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="routine-name"
          value={draft.name}
          maxLength={60}
          aria-invalid={!!errors.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          className={field}
        />
        {errors.name && (
          <p className="text-destructive text-sm">{errors.name}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="routine-day" className="text-sm font-medium">
          Day label
        </label>
        <select
          id="routine-day"
          value={draft.dayLabel ?? ''}
          onChange={(e) =>
            setDraft({
              ...draft,
              dayLabel: (e.target.value || null) as DayLabel | null,
            })
          }
          className={field}
        >
          <option value="">None</option>
          {DAY_LABELS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <section aria-labelledby="routine-exercises-heading">
        <h2 id="routine-exercises-heading" className="section-title">
          Exercises
        </h2>
        {draft.items.length === 0 ? (
          <p className="text-muted-foreground mt-2">No exercises yet</p>
        ) : (
          <ol className="mt-2 flex flex-col gap-3">
            {draft.items.map((item, i) => {
              const name = names.get(item.exerciseId)
              const who = name ?? item.exerciseId
              const unit = item.targetType === 'seconds' ? 'Seconds' : 'Reps'
              return (
                <li
                  key={i}
                  className="bg-card flex flex-col gap-2 rounded-sm border p-3"
                >
                  <div>
                    {name ? (
                      <p className="font-medium">{name}</p>
                    ) : (
                      <>
                        <p className="font-medium">
                          Exercise no longer available
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {item.exerciseId}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <NumberField
                      id={`item-${i}-sets`}
                      text="Sets"
                      label={`Sets for ${who}`}
                      value={item.sets}
                      onChange={(sets) =>
                        setDraft(updateItem(draft, i, { sets }))
                      }
                    />
                    <NumberField
                      id={`item-${i}-target`}
                      text={unit}
                      label={`${unit} for ${who}`}
                      value={item.target}
                      onChange={(target) =>
                        setDraft(updateItem(draft, i, { target }))
                      }
                    />
                    <NumberField
                      id={`item-${i}-rest`}
                      text="Rest (s)"
                      label={`Rest for ${who}`}
                      value={item.restSeconds}
                      onChange={(restSeconds) =>
                        setDraft(updateItem(draft, i, { restSeconds }))
                      }
                    />
                  </div>
                  {errors.items[i] && (
                    <p className="text-destructive text-sm">
                      {errors.items[i]}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 px-3"
                      aria-label={`Move ${who} up`}
                      disabled={i === 0}
                      onClick={() => setDraft(moveItem(draft, i, -1))}
                    >
                      <ArrowUp aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 px-3"
                      aria-label={`Move ${who} down`}
                      disabled={i === draft.items.length - 1}
                      onClick={() => setDraft(moveItem(draft, i, 1))}
                    >
                      <ArrowDown aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="min-h-11 px-3"
                      aria-label={`Remove ${who}`}
                      onClick={() => setDraft(removeItem(draft, i))}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </section>

      <section aria-labelledby="routine-add-heading">
        <h2 id="routine-add-heading" className="section-title">
          Add exercises
        </h2>
        <div className="mt-2">
          {catalog.isPending ? (
            <p role="status">Loading exercises…</p>
          ) : (
            <ExercisePicker
              exercises={catalog.data?.exercises ?? []}
              equipment={settings.equipment}
              onAdd={(exercise) => setDraft(addItem(draft, exercise))}
            />
          )}
        </div>
      </section>

      {saveError && (
        <div role="alert" className="flex flex-col items-start gap-2">
          <p>{saveError}</p>
          <Button
            type="button"
            className="min-h-11 px-4"
            onClick={() => void submit()}
          >
            Try again
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" className="min-h-11 px-6" disabled={saving}>
          Save
        </Button>
        <Button asChild variant="outline" className="min-h-11 px-6">
          <Link to="/routines">Cancel</Link>
        </Button>
      </div>
    </form>
  )
}

function NumberField({
  id,
  text,
  label,
  value,
  onChange,
}: {
  id: string
  text: string
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-muted-foreground text-xs">
        {text}
      </label>
      <input
        id={id}
        aria-label={label}
        inputMode="numeric"
        value={show(value)}
        onChange={(e) => onChange(toNumber(e.target.value))}
        className={field}
      />
    </div>
  )
}
