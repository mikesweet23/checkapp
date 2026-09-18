import Link from "next/link";
import { BrandMark } from "./brand-mark";

export function AdminSidebar({ active = "Overview" }: { active?: string }) {
  const links = [{ label: "Overview", icon: "⌂", href: "/admin" }, { label: "Assessments", icon: "◌", href: "/admin/assessments" }, { label: "Contacts", icon: "♧", href: "#" }, { label: "Reports", icon: "▧", href: "#" }] as const;
  return <aside className="admin-sidebar">
    <Link className="brand" href="/"><BrandMark /> checkapp</Link>
    <div className="sidebar-label">Workspace</div>
    <nav>{links.map(({ label, icon, href }) => href === "#" ? <a className={`sidebar-link ${active === label ? "active" : ""}`} href={href} key={label}><span className="sidebar-icon">{icon}</span><span>{label}</span></a> : <Link className={`sidebar-link ${active === label ? "active" : ""}`} href={href} key={label}><span className="sidebar-icon">{icon}</span><span>{label}</span></Link>)}</nav>
    <div className="sidebar-bottom"><div className="profile"><div className="avatar">MP</div><div><strong>Mike & Paula</strong><span>Absolute Mind</span></div></div></div>
  </aside>;
}
