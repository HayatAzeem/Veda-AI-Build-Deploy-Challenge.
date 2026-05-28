import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
});

export async function fetchAssignments() {
  const { data } = await api.get('/api/assignments');
  return data;
}

export async function fetchAssignment(id: string) {
  const { data } = await api.get(`/api/assignments/${id}`);
  return data;
}

export async function createAssignment(formData: FormData) {
  const { data } = await api.post('/api/assignments', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteAssignment(id: string) {
  const { data } = await api.delete(`/api/assignments/${id}`);
  return data;
}

export async function regenerateAssignment(id: string) {
  const { data } = await api.post(`/api/assignments/${id}/regenerate`);
  return data;
}

export default api;
