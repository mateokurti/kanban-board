export async function getTasks(filters = {}){
  const qs = new URLSearchParams()
  if (filters.status) qs.set('status', filters.status)
  if (filters.priority) qs.set('priority', filters.priority)
  const res = await fetch('/api/tasks' + (qs.toString() ? `?${qs.toString()}` : ''), { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch tasks')
  const data = await res.json()
  return data.tasks || []
}

export async function createTask(payload){
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    const err = await res.json().catch(()=>({error:'Unknown error'}))
    throw new Error(err.error || err.message || 'Failed to create task')
  }
  const data = await res.json()
  return data.task || data
}

export async function updateTask(id, payload){
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) {
    const err = await res.json().catch(()=>({error:'Unknown error'}))
    throw new Error(err.error || err.message || 'Failed to update task')
  }
  const data = await res.json()
  return data.task || data
}

export async function deleteTask(id){
  const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json().catch(()=>({error:'Unknown error'}))
    throw new Error(err.error || err.message || 'Failed to delete task')
  }
  return res.json()
}
