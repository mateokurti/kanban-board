async function handleJsonResponse(res) {
  if (res.ok) return res.json();
  let payload = { error: 'Unknown error' };
  try {
    payload = await res.json();
  } catch (e) {
    // ignore
  }
  throw new Error(payload.error || payload.message || 'Request failed');
}

export async function getProjects(params = {}) {
  const qs = new URLSearchParams();
  if (params.teamId) qs.set('teamId', params.teamId);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const res = await fetch(`/api/projects${suffix}`, { cache: 'no-store' });
  const data = await handleJsonResponse(res);
  return data.projects || [];
}

export async function createProject(payload) {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await handleJsonResponse(res);
  return data.project;
}

export async function updateProject(id, payload) {
  const res = await fetch(`/api/projects/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await handleJsonResponse(res);
  return data.project;
}

export async function deleteProject(id) {
  const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
  await handleJsonResponse(res);
  return true;
}