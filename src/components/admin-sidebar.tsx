import Link from "next/link";
import { BrandMark } from "./brand-mark";

export function AdminSidebar({ active = "Overview" }: { active?: string }) {
  const links = [{ label: "Overview", icon: "⌂", href: "/admin" }, { label: "Assessments", icon: "◌", href: "/admin/assessments" }, { label: "Contacts", icon: "♧", href: "/admin/contacts" }, { label: "Reports", icon: "▧", href: "/admin/reports" }] as const;
  return <aside className="admin-sidebar">
    <Link className="brand" href="/"><BrandMark /><span className="brand-sub">Check-ins</span></Link>
    <div className="sidebar-label">Workspace</div>
    <nav>{links.map(({ label, icon, href }) => <Link className={`sidebar-link ${active === label ? "active" : ""}`} href={href} key={label}><span className="sidebar-icon">{icon}</span><span>{label}</span></Link>)}</nav>
    <div className="sidebar-bottom"><div className="profile"><div className="avatar">AM</div><div><strong>Admin workspace</strong><span>Absolute Mind</span></div></div><form action="/api/admin/logout" method="post"><button className="sidebar-logout" type="submit">Sign out</button></form></div>
  </aside>;
}
