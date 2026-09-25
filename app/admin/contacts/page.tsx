import { AdminSidebar } from "@/src/components/admin-sidebar";
import { DeleteContactButton } from "@/src/components/delete-contact-button";
import { requireAdmin } from "@/src/lib/admin-auth";
import { isDatabaseConfigured } from "@/src/lib/persistence";
import { getPrisma } from "@/src/lib/prisma";
import { retentionMonths } from "@/src/lib/support";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  await requireAdmin();
  const contacts = isDatabaseConfigured() ? await getPrisma().contact.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { attempts: { where: { status: "COMPLETED" }, orderBy: { completedAt: "desc" }, select: { id: true, completedAt: true, overallScore: true } }, crmLink: true } }).catch(() => []) : [];
  return <div className="admin-shell"><AdminSidebar active="Contacts" /><main className="admin-main"><div className="page-title"><div><div className="eyebrow">People</div><h1>Contacts</h1><p>Everyone who has completed a check-in. Results are deleted automatically after {retentionMonths()} months.</p></div></div>{contacts.length === 0 ? <section className="panel empty-state"><h2>No contacts yet</h2><p>Completed check-ins will appear here with their report history and follow-up preference.</p></section> : <div className="table-wrap"><div className="table-head contacts-head"><span>Contact</span><span>Check-ins</span><span>Follow-up</span><span>Actions</span></div>{contacts.map((contact: any) => { const name = [contact.firstName, contact.lastName].filter(Boolean).join(" ") || "Unnamed contact"; const latest = contact.attempts[0]; return <div className="table-row contact-row" key={contact.id}><div><strong>{name}</strong><span>{contact.email}</span></div><span>{contact.attempts.length}{latest ? <><br /><a className="text-link" href={`/admin/reports/${latest.id}`}>Latest: {latest.overallScore}/100</a></> : null}</span><span>{contact.followUpConsent ? <span className="tag">Yes{contact.crmLink ? " · CRM" : ""}</span> : <span className="tag draft">Report only</span>}</span><span className="report-actions"><DeleteContactButton contactId={contact.id} name={name} inCrm={Boolean(contact.crmLink)} /></span></div>; })}</div>}</main></div>;
}
