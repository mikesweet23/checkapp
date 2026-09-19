import Link from "next/link";
import { BrandMark } from "./brand-mark";

export function SiteHeader() {
  return <header className="topbar container">
    <Link className="brand" href="/"><BrandMark /><span className="brand-sub">Check-ins</span></Link>
    <nav><Link href="#how-it-works">How it works</Link><Link href="/privacy">Privacy</Link></nav>
  </header>;
}
