import { Skeleton } from "@/components/ui/skeleton";

export function TemplatePreview({ loading = true }: { loading?: boolean }) {
  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="mt-8">
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Template preview content will go here */}
    </div>
  );
}