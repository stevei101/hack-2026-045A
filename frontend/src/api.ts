import type { Austin311Context, Category, IncidentCard } from "./types";

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

export async function fetchAustin311Context(args: {
  category: Category;
  lat: number | null;
  lng: number | null;
}): Promise<Austin311Context> {
  const params = new URLSearchParams({ category: args.category });
  if (args.lat != null && args.lng != null) {
    params.set("lat", String(args.lat));
    params.set("lng", String(args.lng));
  }
  const response = await fetch(`/api/v1/austin311/context?${params.toString()}`);
  if (!response.ok) {
    throw new ApiError("Austin 311 context is unavailable.", response.status);
  }
  return (await response.json()) as Austin311Context;
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
