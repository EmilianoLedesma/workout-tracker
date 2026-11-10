import { label } from '@/lib/catalog/label'
import { EQUIPMENT, type Equipment } from '@/lib/catalog/vocab'
import { useSettings, useUpdateSettings } from './useSettings'

export function EquipmentSettings() {
  const { settings, isLoading } = useSettings()
  const update = useUpdateSettings()

  const toggle = (item: Equipment) => {
    const owned = settings.equipment.includes(item)
      ? settings.equipment.filter((e) => e !== item)
      : [...settings.equipment, item]
    // keep the catalog's order so the saved list is stable
    update.mutate({ equipment: EQUIPMENT.filter((e) => owned.includes(e)) })
  }

  return (
    <fieldset className="w-full" disabled={isLoading}>
      <legend className="section-title">Equipment</legend>
      <p className="text-muted-foreground text-sm">
        The library shows exercises you can do with what you pick here.
      </p>
      <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
        {EQUIPMENT.map((item) => (
          <label
            key={item}
            className="flex min-h-11 items-center gap-3 rounded-md px-2"
          >
            <input
              type="checkbox"
              className="size-5"
              checked={settings.equipment.includes(item)}
              onChange={() => toggle(item)}
            />
            <span>{label(item)}</span>
          </label>
        ))}
      </div>
      {update.isError && (
        <p role="alert" className="text-destructive mt-2 text-sm">
          Could not save your equipment. Try again.
        </p>
      )}
    </fieldset>
  )
}
