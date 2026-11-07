type MaybeUser =
  | {
      displayName?: string;
      username?: string;
      dhis2_username?: string;
    }
  | null
  | undefined;

/** The best human name we have for the signed-in DHIMS2 user. */
export function displayName(user: MaybeUser): string {
  if (!user) return "";
  return (user.displayName || user.dhis2_username || user.username || "").trim();
}

/** Up to two initials for an avatar. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "U";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

/** "dhims.chimgh.org" from a full DHIS2 instance URL. */
export function instanceHost(url?: string): string {
  if (!url) return "";
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
