import { MessageCircleQuestion } from "lucide-react";
import { Skeleton } from "../ui";

interface InterviewQuestionListProps {
  questions: string[];
  isLoading: boolean;
}

export function InterviewQuestionList({ questions, isLoading }: InterviewQuestionListProps) {
  return (
    <div className="rounded-(--radius-lg) border border-border bg-surface p-5">
      <h3 className="mb-3 text-[13.5px] font-semibold text-text-primary">
        AI Suggested Interview Questions
      </h3>
      {isLoading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-11/12" />
          ))}
        </div>
      ) : (
        <ol className="space-y-3">
          {questions.map((q, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-text-secondary">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-600/10 text-[10.5px] font-semibold text-accent-400">
                {i + 1}
              </span>
              {q}
            </li>
          ))}
        </ol>
      )}
      {!isLoading && questions.length === 0 && (
        <p className="flex items-center gap-2 text-[12.5px] text-text-muted">
          <MessageCircleQuestion className="size-3.5" />
          No suggested questions available for this candidate yet.
        </p>
      )}
    </div>
  );
}
