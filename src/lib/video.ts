/** Extrae ID de YouTube o null si no es un enlace reconocido. */
export function youtubeVideoId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id && /^[\w-]{6,}$/.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (u.pathname === "/watch") {
        const id = u.searchParams.get("v");
        return id && /^[\w-]{6,}$/.test(id) ? id : null;
      }
      const embed = u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{6,})/);
      if (embed?.[1]) return embed[1];
    }

    return null;
  } catch {
    return null;
  }
}

export function youtubeEmbedUrl(url: string): string | null {
  const id = youtubeVideoId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

export function isHttpsUrl(value: string) {
  try {
    const u = new URL(value.trim());
    return u.protocol === "https:";
  } catch {
    return false;
  }
}
