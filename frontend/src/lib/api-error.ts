export async function extractErrorDetail(response: Response, fallback = 'Request failed'): Promise<string> {
  try {
    const body = await response.json();
    if (body?.detail) return body.detail;
    if (body?.error) return body.error;
  } catch { /* not JSON */ }
  return fallback;
}
