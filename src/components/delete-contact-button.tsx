"use client";

import { useState } from "react";

export function DeleteContactButton({ contactId, name, inCrm }: { contactId: string; name: string; inCrm: boolean }) {
  const [busy, setBusy] = useState(false);
  const remove = async () => {
    const crmNote = inCrm ? "\n\nTheir record in the CRM is separate and must be removed there too." : "";
    if (!window.confirm(`Delete ${name} and all of their check-in answers, scores and reports? This cannot be undone.${crmNote}`)) return;
    setBusy(true);
    const response = await fetch(`/api/admin/contacts/${contactId}`, { method: "DELETE" });
    if (response.ok) window.location.reload();
    else { window.alert("We could not delete this contact. Please try again."); setBusy(false); }
  };
  return <button className="button button-ghost button-danger" type="button" disabled={busy} onClick={remove}>{busy ? "Deleting…" : "Delete data"}</button>;
}
