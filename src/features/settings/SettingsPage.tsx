import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/useSession'
import { EquipmentSettings } from './EquipmentSettings'

export default function SettingsPage() {
  const { signOut } = useSession()
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <EquipmentSettings />
      <Button variant="outline" className="h-11" onClick={signOut}>
        Sign out
      </Button>
    </div>
  )
}
