import { useState } from 'react'
import { Dashboard } from '@/pages/Dashboard'
import { CalendarPage } from '@/pages/Calendar'
import { Logs } from '@/pages/Logs'
import { Settings } from '@/pages/Settings'
import { ToastProvider } from '@/components/ui/toast'
import { ScheduleProvider } from '@/contexts/ScheduleContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { cn } from '@/lib/utils'
import { CalendarClock, CalendarDays, ScrollText, Settings as SettingsIcon } from 'lucide-react'
import iconSrc from './assets/icon.png'

type Tab = 'dashboard' | 'calendar' | 'logs' | 'settings'

const tabs: { id: Tab; label: string; icon: typeof CalendarClock }[] = [
  { id: 'dashboard', label: 'Schedules', icon: CalendarClock },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'logs', label: 'Activity', icon: ScrollText },
  { id: 'settings', label: 'Settings', icon: SettingsIcon }
]

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  return (
    <ErrorBoundary>
    <ToastProvider>
      <ScheduleProvider>
      <div className="flex h-screen">
        {/* Sidebar */}
        <nav className="w-52 border-r bg-muted/30 pt-4 flex flex-col">
          <div className="px-4 pb-4 border-b border-border/50 mb-2">
            <div className="flex items-center gap-2.5">
              <img src={iconSrc} alt="WA Scheduler" className="w-8 h-8 rounded-lg" />
              <div>
                <h1 className="text-sm font-semibold text-foreground leading-tight">WA Scheduler</h1>
                <p className="text-[10px] text-muted-foreground">Local message scheduling</p>
              </div>
            </div>
          </div>
          <div className="space-y-1 px-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 w-full rounded-md py-2 text-sm transition-all duration-150',
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary pl-[10px]'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground pl-3'
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'calendar' && <CalendarPage />}
          {activeTab === 'logs' && <Logs />}
          {activeTab === 'settings' && <Settings />}
        </main>
      </div>
      </ScheduleProvider>
    </ToastProvider>
    </ErrorBoundary>
  )
}
