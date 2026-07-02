import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-(--radius-md) bg-accent-600">
            <Sparkles className="size-4 text-white" />
          </div>
          <span className="text-[17px] font-semibold tracking-tight text-text-primary">
            RedRank AI
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
