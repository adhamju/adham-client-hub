import { Skeleton } from "@/components/ui/surfaces";

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
      <Skeleton className="h-7 w-48" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
