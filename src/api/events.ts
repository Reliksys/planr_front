// Базовый URL
const API_BASE = '/api';

// Функция для получения заголовков с токеном
const getHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  
  // МОК-РЕЖИМ
  if (token?.startsWith('mock-')) {
    console.log('МОК-РЕЖИМ: пропускаем реальный запрос');
    return { 'Content-Type': 'application/json' };
  }
  
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

// Типы данных
export interface Event {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

export interface CreateEventDto {
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
}

export interface UpdateEventDto {
  eventId: string;
  title?: string;
  description?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
}

export interface Invitation {
  id: string;
  target: {
    __type: string;
    eventId: string;
    eventTitle: string;
    eventDescription: string;
    location: string;
    startTime: string;
    endTime: string;
  };
  sender: {
    id: string;
    name: string;
    tgId: string;
    vkId: string;
  };
  receiverType: 'NAMED' | 'UNNAMED';
  receiver: {
    id: string;
    name: string;
    tgId: string;
    vkId: string;
  } | null;
  kind: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  routingKey: string;
  invitedAt: string;
  respondedAt: string | null;
}

// Именное приглашение
export interface NamedInvitation {
  invitationId: string;
  target: {
    event: Event;
  };
  sender: {
    id: string;
    name: string;
    tgConnected: boolean;
    vkConnected: boolean;
    createdAt: string;
  };
  receiver: {
    id: string;
    name: string;
    tgConnected: boolean;
    vkConnected: boolean;
    createdAt: string;
  };
  responseStatus: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  respondedAt: string | null;
  routingKey: string;
  createdAt: string;
}

// DTO для создания именного приглашения
export interface CreateNamedInvitationDto {
  eventId: string;
  userId: string;
  routingKey?: 'telegram' | 'vk' | 'all';
}

// Недавний контакт
export interface RecentContact {
  id: string;
  name: string;
  tgConnected: boolean;
  vkConnected: boolean;
  createdAt: string;
  lastInteractionAt: string;
}

// API методы
export const eventsApi = {
  getCreatedByUser: async (): Promise<Event[]> => {
    const response = await fetch(`${API_BASE}/events/created?limit=100&offset=0`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error(`Ошибка загрузки: ${response.status}`);
    return response.json();
  },

  getParticipatedByUser: async (): Promise<Event[]> => {
    const response = await fetch(`${API_BASE}/events/participated?limit=100&offset=0`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error(`Ошибка загрузки: ${response.status}`);
    return response.json();
  },

  getById: async (eventId: string): Promise<Event> => {
    const response = await fetch(`${API_BASE}/events/${eventId}`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error(`Ошибка загрузки: ${response.status}`);
    return response.json();
  },

  create: async (data: CreateEventDto): Promise<Event> => {
    const body = {
      title: data.title,
      description: data.description || '',
      location: data.location,
      startTime: data.startTime,
      endTime: data.endTime,
      type: 'OPTIONAL',
    };
    
    const response = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`Ошибка создания: ${response.status}`);
    return response.json();
  },

  update: async (data: UpdateEventDto): Promise<Event> => {
    const response = await fetch(`${API_BASE}/events/${data.eventId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        location: data.location,
        startTime: data.startTime,
        endTime: data.endTime,
      }),
    });
    if (!response.ok) throw new Error(`Ошибка обновления: ${response.status}`);
    return response.json();
  },

  delete: async (eventId: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/events/${eventId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error(`Ошибка удаления: ${response.status}`);
  },

  getParticipants: async (eventId: string): Promise<{ count: number; participants: Array<{
    eventId: string;
    participantId: string;
    role: string;
    participant: {
      id: string;
      name: string;
      tgConnected: boolean;
      vkConnected: boolean;
      createdAt: string;
    };
  }> }> => {
    const response = await fetch(`${API_BASE}/events/participants/${eventId}?limit=100&offset=0`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error(`Ошибка загрузки участников: ${response.status}`);
    return response.json();
  },
  
  getParticipantsCount: async (eventId: string): Promise<number> => {
    const response = await fetch(`${API_BASE}/events/participants/${eventId}?limit=100&offset=0`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error(`Ошибка загрузки участников: ${response.status}`);
    const data = await response.json();
    return data.count || 0;
  },

  removeParticipants: async (eventId: string, participantIds: string[]): Promise<void> => {
    console.log('Removing participants:', { eventId, participantIds });
    
    const response = await fetch(`${API_BASE}/events/participants/${eventId}`, {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify(participantIds),
    });
    
    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', responseText);
    
    if (!response.ok) {
      throw new Error(`Ошибка удаления участников: ${response.status} - ${responseText}`);
    }
  },

  createInvitation: async (eventId: string): Promise<Invitation> => {
    const response = await fetch(`${API_BASE}/events/${eventId}/invitations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ receiverType: 'UNNAMED' }),
    });
    if (!response.ok) throw new Error(`Ошибка создания приглашения: ${response.status}`);
    return response.json();
  },

  leaveEvent: async (eventId: string): Promise<void> => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const currentUserId = user?.id;
    
    if (!currentUserId) throw new Error('Пользователь не авторизован');
    
    const response = await fetch(`${API_BASE}/events/participants/${eventId}`, {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify([currentUserId]), // массив строк
    });
    
    const responseText = await response.text();
    console.log('Response status:', response.status);
    console.log('Response body:', responseText);
    
    if (!response.ok) throw new Error(`Ошибка выхода из события: ${response.status} - ${responseText}`);
  },
  createNamedInvitation: async (data: CreateNamedInvitationDto): Promise<void> => {
    const response = await fetch(`${API_BASE}/events/participants/${data.eventId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify([data.userId]),
    });
    if (!response.ok) throw new Error(`Ошибка создания именного приглашения: ${response.status}`);
  },

  

  answerInvitation: async (invitationId: string, status: 'ACCEPTED' | 'DECLINED'): Promise<void> => {
    const response = await fetch(`${API_BASE}/invitations/${invitationId}/answer?status=${status}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error(`Ошибка ответа на приглашение: ${response.status}`);
  },

  getMyNamedInvitations: async (): Promise<NamedInvitation[]> => {
    const response = await fetch(`${API_BASE}/invitations`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error(`Ошибка загрузки приглашений: ${response.status}`);
    return response.json();
  },

  getRecentContacts: async (limit: number = 20, offset: number = 0): Promise<RecentContact[]> => {
    const response = await fetch(`${API_BASE}/recent-contacts?limit=${limit}&offset=${offset}`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error(`Ошибка загрузки контактов: ${response.status}`);
    const data = await response.json();
    
    console.log('Raw contacts response:', data);
    
    // Формат ответа: { ownerId: "...", contacts: { [userId]: { ... } } }
    if (data.contacts && typeof data.contacts === 'object') {
      const contactsArray = Object.values(data.contacts).map((contact: any) => ({
        id: contact.userId,
        name: contact.user?.name || 'Без имени',
        tgConnected: contact.user?.tgConnected || false,
        vkConnected: contact.user?.vkConnected || false,
        createdAt: contact.user?.createdAt || new Date().toISOString(),
        lastInteractionAt: contact.lastInteractionAt || new Date().toISOString(),
      }));
      
      console.log('Transformed contacts:', contactsArray);
      return contactsArray;
    }
    
    if (Array.isArray(data)) return data;
    if (data.items && Array.isArray(data.items)) return data.items;
    
    return [];
  },

  deleteRecentContact: async (contactId: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/recent-contacts/remove?contactId=${contactId}`, {
      method: 'PATCH',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error(`Ошибка удаления контакта: ${response.status}`);
  },
};