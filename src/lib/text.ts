/** Splits a heading so the last `count` words can be highlighted in brand orange. */
export function splitEmphasis(text: string, count = 2): [string, string] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= count) return ["", words.join(" ")];
  return [words.slice(0, -count).join(" "), words.slice(-count).join(" ")];
}

/** Turns a YouTube or Vimeo link into an embeddable URL; other links return null. */
export function videoEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return `https://www.youtube-nocookie.com/embed/${parsed.pathname.slice(1)}`;
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = parsed.searchParams.get("v") ?? parsed.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (host === "vimeo.com") {
      const id = parsed.pathname.match(/^\/(\d+)/)?.[1];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    if (host === "player.vimeo.com") return url;
    return null;
  } catch {
    return null;
  }
}
