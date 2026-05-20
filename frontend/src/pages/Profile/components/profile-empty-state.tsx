import { PackageOpenIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type ProfileEmptyStateProps = {
  title: string;
  description: string;
};

export function ProfileEmptyState({
  title,
  description,
}: ProfileEmptyStateProps) {
  return (
    <Card className="border-slate-200 bg-white">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <PackageOpenIcon className="mb-3 size-10 text-slate-400" />

        <h3 className="text-base font-semibold text-slate-950">
          {title}
        </h3>

        <p className="mt-2 max-w-md text-sm text-slate-500">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
