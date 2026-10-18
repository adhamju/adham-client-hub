"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, FolderKanban, Clapperboard, CreditCard, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/actions";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/videos", label: "Videos", icon: Clapperboard },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function AdminSidebar({ businessName, logoUrl }: { businessName: string; logoUrl: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-base-border bg-base-surface md:flex">
      <div className="flex h-16 items-center gap-2.5 px-5">
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="h-7 w-7 rounded-sm object-cover" />
        )}
        <span className="truncate text-[15px] font-semibold text-ink">{businessName}</span>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-sm px-3 py-2 text-[14px] transition-colors",
              isActive(pathname, href) ? "bg-base-raised text-ink" : "text-ink-dim hover:bg-base-raised hover:text-ink"
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>
      <form action={signOut} className="border-t border-base-border p-3">
        <button className="flex w-full items-center gap-2.5 rounded-sm px-3 py-2 text-[14px] text-ink-dim hover:bg-base-raised hover:text-ink">
          <LogOut size={16} />
          Sign out
        </button>
      </form>
    </aside>
  );
}

export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-base-border bg-base-surface md:hidden">
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px]",
            isActive(pathname, href) ? "text-signal-action" : "text-ink-dim"
          )}
        >
          <Icon size={18} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
