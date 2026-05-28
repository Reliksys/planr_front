const API_BASE = '/api';

const getToken = (): string | null => {
  return localStorage.getItem('token');
};

const getHeaders = (): HeadersInit => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

export interface User {
  id: string;
  name: string;
  role: 'USER' | 'ADMIN';
  socials: Array<{
    tgId: string;
    vkId: string;
  }>;
  createdAt: string;
}

export const usersApi = {
  // Получить всех пользователей (если нужно)
  getAll: async (): Promise<User[]> => {
    const response = await fetch(`${API_BASE}/users`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error(`Ошибка загрузки пользователей: ${response.status}`);
    return response.json();
  },

  // Получить текущего пользователя (нужно уточнить эндпоинт)
  getMe: async (): Promise<User> => {
    // Если нет отдельного /me, берем всех и ищем по токену
    // Или спроси у бэкендера есть ли GET /api/users/me
    const users = await usersApi.getAll();
    // Возвращаем первого? Не очень надежно.
    // Лучше попросить бэкендера добавить /me
    return users[0];
  },
};