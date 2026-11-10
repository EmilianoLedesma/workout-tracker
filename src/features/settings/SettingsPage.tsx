import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/useSession'
import { EquipmentSettings } from './EquipmentSettings'

export default function SettingsPage() {
  const { signOut } = useSession()
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="page-title">Settings</h1>
      <EquipmentSettings />
      <Link to="/credits" className="flex min-h-11 items-center underline">
        Credits
      </Link>
      <Button variant="outline" className="h-11" onClick={signOut}>
        Sign out
      </Button>
    </div>
  )
}
