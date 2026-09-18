import Link from "next/link";
import { BrandMark } from "./brand-mark";

export function SiteHeader() {
  return <header className="topbar container">
    <Link className="brand" href="/"><BrandMark /> Absolute Mind <span className="brand-sub">Check-ins</span></Link>
    <nav><Link href="#how-it-works">How it works</Link><Link href="#why-checkapp">For practitioners</Link><Link className="nav-pill" href="/admin">Open workspace ↗</Link></nav>
  </header>;
}
