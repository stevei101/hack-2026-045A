import type { IncidentCard } from "./types";

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function listIncidents(): Promise<IncidentCard[]> {
  const response = await fetch("/api/v1/incidents");
  if (!response.ok) {
    throw new ApiError("Incident feed is unavailable.", response.status);
  }
  return (await response.json()) as IncidentCard[];
}

export async function reportHazard(form: FormData): Promise<IncidentCard> {
  const response = await fetch("/api/v1/hazards/report", {
    method: "POST",
    body: form,
  });
  if (!response.ok) {
    const detail = await readDetail(response);
    throw new ApiError(detail, response.status);
  }
  return (await response.json()) as IncidentCard;
}

async function readDetail(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: string };
    if (body.detail) return body.detail;
  } catch {
    /* ignore parse errors */
  }
  if (response.status === 415) return "That file type is not accepted. Use JPEG, PNG, or WebP.";
  return "The report could not be filed. Try again.";
}
