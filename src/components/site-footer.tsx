import Link from "next/link";
import { BrandMark } from "./brand-mark";

export function SiteFooter() {
  return <footer className="site-footer">
    <div className="container site-footer-inner">
      <Link className="brand site-footer-brand" href="/">
        <BrandMark />
        <span className="brand-sub">Check-ins</span>
      </Link>
      <div className="site-footer-copy">
        <span>Private, thoughtful check-ins from Absolute Mind.</span>
        <Link href="/privacy">Privacy</Link>
        <a href="https://absolutemind.co.uk" target="_blank" rel="noreferrer">Visit Absolute Mind ↗</a>
      </div>
    </div>
  </footer>;
}
