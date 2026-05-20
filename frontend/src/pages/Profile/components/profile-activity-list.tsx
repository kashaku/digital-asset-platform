import { Clock3Icon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProfileActivity } from "@/types/profile";

type ProfileActivityListProps = {
  activities: ProfileActivity[];
};

export function ProfileActivityList({ activities }: ProfileActivityListProps) {
  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader>
        <CardTitle>交易历史</CardTitle>
      </CardHeader>

      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-slate-500">暂无交易历史。</p>
        ) : (
          <div className="relative ml-3 space-y-6 border-l border-slate-200">
            {activities.map((activity) => (
              <div className="relative pl-6" key={activity.id}>
                <div className="absolute -left-[6.5px] top-1.5 size-3 rounded-full bg-purple-500 ring-4 ring-purple-100" />

                <div className="text-sm">
                  <p className="flex items-center gap-2 font-bold text-slate-950">
                    <Clock3Icon className="size-4 text-slate-400" />
                    {activity.title}
                  </p>

                  <p className="mt-1 text-slate-500">
                    {activity.description}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {activity.timestamp}
                    {activity.txHash ? ` · ${activity.txHash}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
