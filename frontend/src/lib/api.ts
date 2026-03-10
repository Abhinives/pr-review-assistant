const API_BASE = "http://localhost:8000";

export interface ReviewIssue {
  file: string;
  line: number;
  severity: string;
  description: string;
  fix: string;
}

export interface ReviewResult {
  decision: string;
  summary: string;
  issues: ReviewIssue[];
}

export interface ReviewRequest {
  pr_url: string;
  github_token?: string;
  credential_id?: string;
}

export interface Credential {
  id: string;
  email: string;
  github_username: string;
}

export interface CredentialCreate {
  email: string;
  github_username: string;
  github_token: string;
}

export interface HistoryItem {
  id: string;
  pr_url: string;
  decision: string;
  summary: string;
  created_at: string;
}

export async function runAnalysis(data: ReviewRequest): Promise<ReviewResult> {
  const res = await fetch(`${API_BASE}/analysis/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createCredential(data: CredentialCreate): Promise<Credential> {
  const res = await fetch(`${API_BASE}/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getCredentials(): Promise<Credential[]> {
  const res = await fetch(`${API_BASE}/credentials`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getHistory(): Promise<HistoryItem[]> {
  const res = await fetch(`${API_BASE}/history`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
