const COOLIFY_API_URL =
  process.env.COOLIFY_API_URL || 'http://localhost:8000/api/v1';
const COOLIFY_API_TOKEN = process.env.COOLIFY_API_TOKEN;

// Application UUIDs from GEMINI.md
export const COOLIFY_APPS = {
  DASHBOARD: 'l8goc4scgcgwk0ookoc0k8c0',
  BOT: 'd8g4cgkocw40sgkwsscckks8',
} as const;

export interface CoolifyDeployment {
  id: number;
  application_id: string;
  deployment_uuid: string;
  status: 'queued' | 'in_progress' | 'finished' | 'failed' | 'cancelled';
  created_at: string;
  updated_at: string;
  commit?: string;
  commit_message?: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!COOLIFY_API_TOKEN) {
    throw new Error('COOLIFY_API_TOKEN is not set');
  }

  const res = await fetch(`${COOLIFY_API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${COOLIFY_API_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Coolify API Error (${res.status}): ${errorText}`);
  }

  return res.json();
}

/**
 * List deployments for a specific application
 */
export async function getDeployments(
  appUuid: string,
  limit = 10,
): Promise<CoolifyDeployment[]> {
  // Note: Coolify API doesn't standardly support ?take= on this endpoint in all versions,
  // but we'll try to just fetch and slice if needed.
  const deployments = await request<CoolifyDeployment[]>(
    `/deployments/applications/${appUuid}`,
  );
  return deployments.slice(0, limit);
}

/**
 * Trigger a new deployment
 */
export async function triggerDeployment(
  appUuid: string,
  force = false,
): Promise<{ deployment_uuid: string }> {
  return request<{ deployment_uuid: string }>(
    `/deploy?uuid=${appUuid}&force=${force}`,
    {
      method: 'POST',
    },
  );
}

/**
 * Get deployment status
 */
export async function getDeployment(
  deploymentUuid: string,
): Promise<CoolifyDeployment> {
  return request<CoolifyDeployment>(`/deployments/${deploymentUuid}`);
}
