const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  };
  
  if (body !== null && body !== undefined) options.body = JSON.stringify(body);

  const response = await fetch(`${API_URL}${endpoint}`, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Помилка запиту до сервера');
  }
  return response.json();
}

export async function apiUpload(endpoint, formData, method = 'PUT') {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    credentials: 'include',
    body: formData,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Помилка запиту до сервера');
  }
  return response.json();
}
