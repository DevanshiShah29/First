import { goodreadsUserId } from "@/lib/goodreads";
import { youtubeVideoId } from "@/lib/media-url";

export type Screen =
  | "dashboard"
  | "site"
  | "about"
  | "contact"
  | "hero"
  | "appearance"
  | "experience"
  | "experience-edit"
  | "projects"
  | "projects-edit"
  | "skills"
  | "technologies"
  | "memories"
  | "memories-edit";

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  current?: boolean;
}

export function clone<T>(value: T): T {
  return structuredClone(value);
}

export function move<T>(list: T[], index: number, dir: -1 | 1): T[] {
  const next = [...list];
  const j = index + dir;
  if (j < 0 || j >= next.length) return next;
  [next[index], next[j]] = [next[j], next[index]];
  return next;
}

export function newId(): string {
  return crypto.randomUUID();
}

export function goodreadsHint(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return "Leave blank to rest the books. The 3D World piano-desk book pulls this profile when tapped.";
  }
  if (goodreadsUserId(trimmed)) {
    return "Goodreads profile detected — the books object will load this shelf.";
  }
  return "Could not find a Goodreads user ID. Paste a profile URL like https://www.goodreads.com/user/show/123-name";
}

export function pianoMusicHint(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return "Leave blank to rest the piano. Playback starts only when someone taps the piano — never on page load.";
  }
  if (youtubeVideoId(trimmed)) {
    return "YouTube video detected — the piano will play this track inside the 3D world.";
  }
  return "Could not find a YouTube video ID. Use a watch, share, Shorts, or embed URL.";
}
