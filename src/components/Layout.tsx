import { type ReactNode, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Menu,
  X,
  Bell,
  Search,
  Settings,
} from 'lucide-react';

export type Page = 'dashboard' | 'students' | 'courses' | 'subjects';

interface LayoutProps {
  children: ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  breadcrumbs?: { label: string; onClick?: () => void }[];
}

const navItems: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'courses', label: 'Courses', icon: GraduationCap },
  { id: 'subjects', label: 'Subjects', icon: BookOpen },
];

export function Layout({ children, currentPage, onNavigate, breadcrumbs }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentLabel = navItems.find((n) => n.id === currentPage)?.label ?? '';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 fixed inset-y-0 left-0 z-30">
        <SidebarContent currentPage={currentPage} onNavigate={(p) => { onNavigate(p); }} />
      </aside>

      {/* Sidebar - Mobile */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-64 bg-slate-900 z-50 lg:hidden animate-slide-in">
            <SidebarContent
              currentPage={currentPage}
              onNavigate={(p) => {
                onNavigate(p);
                setSidebarOpen(false);
              }}
              onClose={() => setSidebarOpen(false)}
            />
          </aside>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 lg:px-8 h-16 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm flex-1 min-w-0">
            {breadcrumbs && breadcrumbs.length > 0 ? (
              breadcrumbs.map((bc, i) => (
                <span key={i} className="flex items-center gap-2 min-w-0">
                  {i > 0 && <span className="text-slate-300">/</span>}
                  {bc.onClick ? (
                    <button
                      onClick={bc.onClick}
                      className="text-slate-500 hover:text-slate-700 transition-colors truncate"
                    >
                      {bc.label}
                    </button>
                  ) : (
                    <span className="font-semibold text-slate-800 truncate">{bc.label}</span>
                  )}
                </span>
              ))
            ) : (
              <span className="font-semibold text-slate-800">{currentLabel}</span>
            )}
          </nav>

          {/* Search */}
          <div className="hidden md:flex items-center relative">
            <Search className="absolute left-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-9 pr-4 py-2 w-48 lg:w-64 rounded-lg bg-slate-100 text-sm border border-transparent focus:bg-white focus:border-slate-300 focus:outline-none transition-all"
            />
          </div>

          <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </button>

          <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-600">
            <Settings className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold text-sm">
              AD
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-800 leading-tight">Admin</p>
              <p className="text-xs text-slate-500 leading-tight">Administrator</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  currentPage,
  onNavigate,
  onClose,
}: {
  currentPage: Page;
  onNavigate: (p: Page) => void;
  onClose?: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between px-6 h-16 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">College Admin</p>
            <p className="text-slate-400 text-xs leading-tight">Management System</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1 text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Main Menu
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-slate-400'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-700/50">
        <div className="px-3 py-3 rounded-lg bg-slate-800/50">
          <p className="text-xs text-slate-400 leading-relaxed">
            College Administration System
          </p>
          <p className="text-xs text-slate-500 mt-1">Version 1.0.0</p>
        </div>
      </div>
    </>
  );
}
