import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, GitBranch, Calendar, BookOpen } from 'lucide-react';

const navItems = [
  { to: '/', label: '仪表盘', icon: LayoutDashboard },
  { to: '/family-tree', label: '家谱树', icon: GitBranch },
  { to: '/activities', label: '家庭活动', icon: Calendar },
  { to: '/chronicle', label: '家族编年史', icon: BookOpen },
];

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-brown-50">
      <aside className="w-64 bg-brown-500 text-brown-50 flex flex-col flex-shrink-0">
        <div className="px-6 py-8 border-b border-brown-600">
          <div className="border-2 border-gold-400 rounded-lg px-4 py-3 text-center">
            <h1 className="font-serif text-2xl font-bold text-gold-400 tracking-wider">族谱</h1>
            <p className="text-xs text-brown-200 mt-1">家族记忆，代代相传</p>
          </div>
        </div>

        <nav className="flex-1 py-4">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-brown-50 text-gold-400 border-l-4 border-gold-400 font-medium'
                    : 'text-brown-100 hover:bg-brown-600 border-l-4 border-transparent hover:border-gold-300'
                }`
              }
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-6 py-4 border-t border-brown-600">
          <p className="text-xs text-brown-300 text-center">© 2024 族谱管理系统</p>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
