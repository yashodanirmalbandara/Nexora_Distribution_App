import { useState } from 'react'
import DispatcherApp from './DispatcherApp'
import StoreApp from './StoreApp'
import DriverApp from './DriverApp'
import LoaderApp from './LoaderApp'

export type ActiveRole = 'dispatcher' | 'store' | 'driver' | 'loader'

interface RoleCard {
  id: ActiveRole
  title: string
  subtitle: string
  badge: string
  icon: string
  color: string
  description: string
  deviceTarget: string
}

const ROLES: RoleCard[] = [
  {
    id: 'dispatcher',
    title: 'Dispatcher Portal',
    subtitle: 'Logistics Command & Fleet Operations',
    badge: 'Desktop / Hub',
    icon: '🖥️',
    color: 'from-teal-600 to-emerald-700',
    description: 'Order allocation, multi-trip route optimization, fuel tracking, constraint alert engine, and delivery sign-off confirmations.',
    deviceTarget: 'Designed for 1080p+ multi-monitor desktop setups',
  },
  {
    id: 'store',
    title: 'Store App',
    subtitle: 'Outlet Inventory & Reordering',
    badge: 'Store Manager',
    icon: '🏪',
    color: 'from-blue-600 to-indigo-700',
    description: 'Chilled & fresh daily stock reordering, 16:00 cutoff countdown, incoming ETA progress tracking, and delivery QR receipt sign-offs.',
    deviceTarget: 'Responsive across tablet & mobile viewports',
  },
  {
    id: 'driver',
    title: 'Driver Mobile',
    subtitle: 'On-Road Route Execution',
    badge: 'Field App',
    icon: '🚚',
    color: 'from-teal-600 to-cyan-700',
    description: 'Turn-by-turn stop workflow, delivery window enforcement, store QR verification, digital POD capture, and offline map tile cache.',
    deviceTarget: 'Optimized for handheld mobile devices & rugged tablets',
  },
  {
    id: 'loader',
    title: 'Loader Terminal',
    subtitle: 'Dock & Loading Bay Execution',
    badge: 'Warehouse Dock',
    icon: '📦',
    color: 'from-slate-700 to-slate-900',
    description: 'LIFO loading order verification, damage/shortage flagging, real-time sync with dispatch hub, and vehicle departure authorization.',
    deviceTarget: 'High-contrast UI for warehouse dock touch terminals',
  },

]

export default function MainInterface() {
  const [activeRole, setActiveRole] = useState<ActiveRole>('dispatcher')
  const [isDark, setIsDark] = useState<boolean>(false)
  const [showRoleBar, setShowRoleBar] = useState<boolean>(true)

  function handleToggleDark() {
    setIsDark(prev => !prev)
  }

  return (
    <div className={`min-h-[100dvh] ${isDark ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-800'}`} style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Global Persistent Role Navigation Bar */}
      {showRoleBar && (
        <div className="bg-slate-900 text-white border-b border-slate-800 px-3 py-2 flex items-center justify-between text-xs font-mono shrink-0 relative z-50">
          <div className="flex items-center gap-3 overflow-x-auto py-1 no-scrollbar">
            <span className="font-bold text-teal-400 flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              WAYPOINT HUB:
            </span>

            {ROLES.map(role => (
              <button
                key={role.id}
                onClick={() => setActiveRole(role.id)}
                className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  activeRole === role.id
                    ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>{role.icon}</span>
                <span>{role.title}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 shrink-0 pl-3 border-l border-slate-800">
            <button
              onClick={handleToggleDark}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Toggle global dark mode"
            >
              {isDark ? '☀ Light' : '☾ Dark'}
            </button>
            <button
              onClick={() => setShowRoleBar(false)}
              className="text-slate-500 hover:text-slate-300 transition-colors text-base leading-none"
              title="Hide switcher bar"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Floating Toggle button when top bar is hidden */}
      {!showRoleBar && (
        <button
          onClick={() => setShowRoleBar(true)}
          className="fixed top-3 right-3 z-50 px-3 py-1.5 rounded-xl bg-slate-900 text-white font-mono text-xs shadow-xl border border-slate-700 hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          <span>⇄ Switch Role</span>
        </button>
      )}

      {/* Role Renderer Viewport */}
      <div className="flex-1">
        {activeRole === 'dispatcher' && (
          <DispatcherApp
            onSwitchView={() => setActiveRole('store')}
            isDark={isDark}
            onToggleDark={handleToggleDark}
          />
        )}

        {activeRole === 'store' && (
          <StoreApp
            onSwitchView={() => setActiveRole('driver')}
            isDark={isDark}
            onToggleDark={handleToggleDark}
          />
        )}

        {activeRole === 'driver' && (
          <DriverApp
            onSwitchView={() => setActiveRole('loader')}
            isDark={isDark}
            onToggleDark={handleToggleDark}
          />
        )}

        {activeRole === 'loader' && (
          <LoaderApp
            onSwitchView={() => setActiveRole('offline')}
            isDark={isDark}
            onToggleDark={handleToggleDark}
          />
        )}

      </div>
    </div>
  )
}