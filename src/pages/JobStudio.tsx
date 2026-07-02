import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Sparkles, RotateCcw } from "lucide-react";
import { Topbar } from "../layouts/Topbar";
import { Button, EmptyState, Skeleton } from "../components/ui";
import { JobDescriptionEditor } from "../components/features/JobDescriptionEditor";
import { RubricPanel } from "../components/features/RubricPanel";
import type { JobMetaFormValue } from "../components/features/JobMetaForm";
import { generateHiringRubric, saveJob } from "../services/api";
import { useToast } from "../hooks/useToast";
import type { Rubric, RubricSection, RubricSectionKey } from "../types";
import { RUBRIC_SECTION_ORDER } from "../types";

type StudioState = "empty" | "loading" | "error" | "ready";

const EMPTY_META: JobMetaFormValue = {
  title: "",
  location: "",
  employmentType: "Full-time",
};

function RubricSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-(--radius-lg) border border-border bg-surface p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="w-full">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-3 w-64" />
        </div>
        <Skeleton className="h-5 w-40 shrink-0 rounded-full" />
      </div>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
      <Skeleton className="h-8 w-48 mb-4" />
      <div className="space-y-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="mb-2 flex items-center justify-between">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function JobStudio() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [jobDescription, setJobDescription] = useState("");
  const [studioState, setStudioState] = useState<StudioState>("empty");
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [meta, setMeta] = useState<JobMetaFormValue>(EMPTY_META);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleGenerate = useCallback(() => {
    setStudioState("loading");
    setGenerateError(null);

    generateHiringRubric(jobDescription)
      .then((res) => {
        if (!res.success) {
          setGenerateError(res.message ?? "The AI rubric service is temporarily unavailable.");
          setStudioState("error");
          return;
        }
        setRubric(res.data);
        setMeta((prev) => ({ ...prev, title: prev.title || res.data.jobTitle }));
        setStudioState("ready");
      })
      .catch(() => {
        setGenerateError("The AI rubric service is temporarily unavailable. Please try again.");
        setStudioState("error");
      });
  }, [jobDescription]);

  const handleSectionChange = useCallback(
    (key: RubricSectionKey, section: RubricSection) => {
      setRubric((prev) => (prev ? { ...prev, [key]: section } : prev));
    },
    []
  );

  const handleSave = useCallback(() => {
    if (!rubric) return;
    setIsSaving(true);

    const rubricSections = RUBRIC_SECTION_ORDER.reduce((acc, key) => {
      acc[key] = rubric[key];
      return acc;
    }, {} as Record<RubricSectionKey, RubricSection>);

    saveJob({
      title: meta.title.trim(),
      description: jobDescription,
      location: meta.location.trim(),
      employmentType: meta.employmentType,
      rubricSections,
    })
      .then((res) => {
        if (!res.success || !res.data) {
          showToast("Couldn't save this job", {
            description: res.message ?? "Please try again.",
            tone: "error",
          });
          return;
        }
        setIsSaved(true);
        showToast("Job saved successfully", {
          description: `${res.data.title} is now live. Redirecting to resume upload…`,
          tone: "success",
        });
        navigate(`/jobs/${res.data.id}/upload`);
      })
      .catch(() => {
        showToast("Couldn't save this job", {
          description: "Please try again.",
          tone: "error",
        });
      })
      .finally(() => setIsSaving(false));
  }, [rubric, meta, jobDescription, showToast, navigate]);

  const handleStartOver = useCallback(() => {
    setJobDescription("");
    setStudioState("empty");
    setGenerateError(null);
    setRubric(null);
    setMeta(EMPTY_META);
    setIsSaved(false);
  }, []);

  return (
    <>
      <Topbar
        actions={
          (studioState === "ready" || studioState === "error") && (
            <Button
              size="sm"
              variant="ghost"
              icon={<RotateCcw className="size-3.5" />}
              onClick={handleStartOver}
            >
              Start over
            </Button>
          )
        }
      />

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-stretch min-h-[560px]">
          <JobDescriptionEditor
            value={jobDescription}
            onChange={setJobDescription}
            onGenerate={handleGenerate}
            isGenerating={studioState === "loading"}
            disabled={isSaved}
          />

          {studioState === "empty" && (
            <EmptyState
              icon={<FileText className="size-5 text-text-muted" />}
              title="No rubric yet"
              description="Paste a job description on the left and generate an AI rubric to see it here."
              className="h-full"
            />
          )}

          {studioState === "loading" && <RubricSkeleton />}

          {studioState === "error" && (
            <EmptyState
              tone="error"
              icon={<Sparkles className="size-5 text-error-400" />}
              title="Rubric generation failed"
              description={generateError ?? "Something went wrong. Your job description is still here."}
              action={{ label: "Try again", onClick: handleGenerate }}
              className="h-full"
            />
          )}

          {studioState === "ready" && rubric && (
            <RubricPanel
              rubric={rubric}
              onSectionChange={handleSectionChange}
              meta={meta}
              onMetaChange={setMeta}
              onSave={handleSave}
              isSaving={isSaving}
              isSaved={isSaved}
            />
          )}
        </div>
      </div>
    </>
  );
}
