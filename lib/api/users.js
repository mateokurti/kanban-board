async function handleJsonResponse(res) {
  if (res.ok) return res.json();
  let payload = { error: 'Unknown error' };
  try {
    payload = await res.json();
  } catch (e) {
  }
  throw new Error(payload.error || payload.message || 'Request failed');
}

export async function getUsers() {
  const res = await fetch('/api/users', { cache: 'no-store' });
  const data = await handleJsonResponse(res);
  return data.users || [];
}
