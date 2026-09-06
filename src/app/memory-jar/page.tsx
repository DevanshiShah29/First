import { redirect } from "next/navigation";

/**
 * Redirects legacy /memory-jar to /memories.
 * @example <MemoryJarAliasPage /> // redirect
 */
export default function MemoryJarAliasPage() {
  redirect("/memories");
}
