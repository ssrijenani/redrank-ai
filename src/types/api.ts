/**
 * Every function in services/api.ts resolves this exact envelope shape,
 * regardless of endpoint. This contract is what the real Firebase Functions
 * responses must also conform to — pages and components only ever branch
 * on `success` and read `data`/`message`, never on the shape underneath.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}
