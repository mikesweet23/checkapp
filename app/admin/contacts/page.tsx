import { AdminSidebar } from "@/src/components/admin-sidebar";
import { requireAdmin } from "@/src/lib/admin-auth";
import { isDatabaseConfigured } from "@/src/lib/persistence";
import { getPrisma } from "@/src/lib/prisma";

export default async function ContactsPage() {
  await requireAdmin();
  const contacts = isDatabaseConfigured() ? await getPrisma().contact.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { attempts: { select: { id: true, completedAt: true, overallScore: true } }, crmLink: true } }).catch(() => []) : [];
  return <div className="admin-shell"><AdminSidebar active="Contacts" /><main className="admin-main"><div className="page-title"><div><div className="eyebrow">People</div><h1>Contacts</h1><p>Everyone who has completed a check-in and agreed to receive their report.</p></div></div>{contacts.length === 0 ? <section className="panel empty-state"><h2>No contacts yet</h2><p>Completed check-ins will appear here with their report history and CRM status.</p></section> : <div className="table-wrap"><div className="table-head"><span>Contact</span><span>Check-ins</span><span>Latest score</span><span>CRM</span></div>{contacts.map((contact) => <div className="table-row contact-row" key={contact.id}><div><strong>{[contact.firstName, contact.lastName].filter(Boolean).join(" ") || "Unnamed contact"}</strong><span>{contact.email}</span></div><span>{contact.attempts.length}</span><span>{contact.attempts[0]?.overallScore ?? "—"}</span><span>{contact.crmLink ? <span className="tag">Synced</span> : <span className="tag draft">Not synced</span>}</span></div>)}</div>}</main></div>;
}
