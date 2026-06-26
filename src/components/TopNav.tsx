import Link from 'next/link';
import NotificationBell from './NotificationBell';

interface NavLink {
  href: string;
  label: string;
}

const LINKS: NavLink[] = [
  { href: '/', label: 'All RAILs' },
  { href: '/priority-board', label: 'Priority Board' },
  { href: '/my-actions', label: 'My Actions' },
  { href: '/rollup', label: 'Team Rollup' },
  { href: '/calendar', label: 'Calendar' },
];

export default function TopNav({ activePath }: { activePath: string }) {
  return (
    <nav className="bg-white border-b border-zinc-200 px-4 sm:px-6 flex items-center gap-1 h-11">
      <span className="text-sm font-bold text-zinc-800 mr-4">RAIL Tracker</span>
      {LINKS.map(link => {
        const active = activePath === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={[
              'px-3 py-1.5 rounded-md text-sm transition-colors',
              active
                ? 'bg-blue-600 text-white font-medium'
                : 'text-zinc-600 hover:bg-zinc-100',
            ].join(' ')}
          >
            {link.label}
          </Link>
        );
      })}
      <div className="ml-auto">
        <NotificationBell />
      </div>
    </nav>
  );
}
