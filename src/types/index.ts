export * from "./job";
export * from "./rubric";
export * from "./candidate";
export * from "./resume";
export * from "./decision";
export * from "./api";

/**
 * Standard async-state shape consumed by pages/components.
 * Every services/api.ts function that returns collection or detail
 * data is expected to resolve a plain value; components wrap calls
 * with their own loading/error state using this shape for consistency.
 */
export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}
