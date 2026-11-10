import {
  BarChart3,
  Dumbbell,
  Home,
  ListChecks,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'

const links: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/library', label: 'Library', icon: Dumbbell },
  { to: '/routines', label: 'Routines', icon: ListChecks },
  { to: '/progress', label: 'Progress', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function BottomNav() {
  return (
    <nav
      aria-label="Main"
      className="bg-background fixed inset-x-0 bottom-0 z-10 flex border-t md:static md:order-first md:w-56 md:flex-col md:border-t-0 md:border-r"
    >
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'text-muted-foreground flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-xs md:flex-none md:flex-row md:justify-start md:gap-3 md:px-4 md:text-sm',
              isActive &&
                'text-foreground border-accent-fill border-t-4 font-semibold md:border-t-0 md:border-l-4',
            )
          }
        >
          <Icon className="size-5" aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
