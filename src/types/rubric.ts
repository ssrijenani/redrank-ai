/**
 * A hiring rubric is broken into five fixed sections (per product spec).
 * Each section carries its own recruiter-editable weight and a flat list
 * of editable items (skill tags for the skill sections, requirement
 * bullets for experience/education).
 */
export type RubricSectionKey =
  | "requiredSkills"
  | "preferredSkills"
  | "softSkills"
  | "experience"
  | "education";

export interface RubricSection {
  /** Percentage weight this section carries in the overall AI score. */
  weight: number;
  items: string[];
}

export type RubricSections = Record<RubricSectionKey, RubricSection>;

export interface Rubric {
  id: string;
  /** Null until the parent job is actually saved — rubrics can exist as drafts pre-save. */
  jobId: string | null;
  jobTitle: string;
  status: "draft" | "saved";
  generatedAt: string;
  requiredSkills: RubricSection;
  preferredSkills: RubricSection;
  softSkills: RubricSection;
  experience: RubricSection;
  education: RubricSection;
}

export const RUBRIC_SECTION_ORDER: RubricSectionKey[] = [
  "requiredSkills",
  "preferredSkills",
  "softSkills",
  "experience",
  "education",
];

export const RUBRIC_SECTION_LABELS: Record<RubricSectionKey, string> = {
  requiredSkills: "Required Skills",
  preferredSkills: "Preferred Skills",
  softSkills: "Soft Skills",
  experience: "Experience",
  education: "Education",
};

export const RUBRIC_SECTION_PLACEHOLDERS: Record<RubricSectionKey, string> = {
  requiredSkills: "e.g. React",
  preferredSkills: "e.g. GraphQL",
  softSkills: "e.g. Stakeholder communication",
  experience: "e.g. 5+ years in production frontend roles",
  education: "e.g. Bachelor's in CS or equivalent experience",
};
