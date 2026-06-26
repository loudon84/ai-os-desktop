export class HermesExpertsError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "HermesExpertsError";
    this.code = code;
  }
}

export function isHermesExpertsError(err: unknown): err is HermesExpertsError {
  return err instanceof HermesExpertsError;
}
