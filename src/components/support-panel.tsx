import { supportHeading, supportLines } from "@/src/lib/support";

export function SupportPanel({ emphasised = false }: { emphasised?: boolean }) {
  return <aside className={`support-panel ${emphasised ? "emphasised" : ""}`} aria-label={supportHeading}>
    <strong>{supportHeading}</strong>
    {emphasised && <p>You do not have to wait for an appointment if things feel too much. These services are free and confidential:</p>}
    <ul>{supportLines.map((line) => <li key={line}>{line}</li>)}</ul>
  </aside>;
}
