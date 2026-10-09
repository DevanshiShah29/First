import { ReadingSkeleton } from "@/components/skeleton/ReadingSkeleton";

/**
 * Book Nook loading skeleton while the shelf resolves.
 * @example <Loading /> while /reading resolves
 */
export default function Loading() {
  return <ReadingSkeleton />;
}
