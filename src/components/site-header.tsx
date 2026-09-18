import Link from "next/link";
import { BrandMark } from "./brand-mark";

export function SiteHeader() {
  return <header className="topbar container">
    <Link className="brand" href="/"><BrandMark /> checkapp</Link>
    <nav><Link href="#how-it-works">How it works</Link><Link href="#why-checkapp">For practitioners</Link><Link className="nav-pill" href="/admin">Open workspace ↗</Link></nav>
  </header>;
}
