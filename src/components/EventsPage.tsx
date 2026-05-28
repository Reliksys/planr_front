import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit2, Share2, Users, Info, Trash2, LogOut } from 'lucide-react';
import { eventsApi } from '../api/events';
import type { Event } from '../api/events';
import { EditEventModal } from './EditEventModal';
import { ParticipantsModal } from './ParticipantsModal';
import { EventDetailsModal } from './EventDetailsModal';

const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch(e) {
      console.error('Ошибка парсинга user:', e);
    }
  }
  return null;
};

const getCurrentUserId = (): string | null => {
  const user = getCurrentUser();
  return user?.id || null;
};

export const EventsPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'created' | 'participated'>('created');
  const [participantsCount, setParticipantsCount] = useState<Record<string, number>>({});
  
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [participantsEvent, setParticipantsEvent] = useState<{ id: string; title: string } | null>(null);
  const [detailsEvent, setDetailsEvent] = useState<Event | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [leavingEventId, setLeavingEventId] = useState<string | null>(null);

  const userId = getCurrentUserId();

  const loadEvents = async () => {
    if (!userId) {
      setError('Пользователь не авторизован');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const data = activeTab === 'created' 
        ? await eventsApi.getCreatedByUser()
        : await eventsApi.getParticipatedByUser();
      setEvents(data);
      
      const countsMap: Record<string, number> = {};
      for (const event of data) {
        try {
          const count = await eventsApi.getParticipantsCount(event.id);
          countsMap[event.id] = count;
        } catch (err) {
          console.error(`Failed to load count for ${event.id}:`, err);
          countsMap[event.id] = 0;
        }
      }
      setParticipantsCount(countsMap);
    } catch (err) {
      console.error('Load events error:', err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [activeTab, userId]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadEvents();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [activeTab, userId]);

  const handleUpdateEvent = (updatedEvent: Event) => {
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
  };

  const handleShare = async (event: Event) => {
    try {
      const botUsername = 'planr_tpu_bot';
      const inviteLink = `https://t.me/${botUsername}?start=env_id=${event.id}`;
      await navigator.clipboard.writeText(inviteLink);
      alert(`Ссылка-приглашение скопирована\n\nОтправьте её друзьям: ${inviteLink}`);
    } catch (err) {
      console.error('Share error:', err);
      alert('Ошибка при создании ссылки-приглашения');
    }
  };

  const refreshParticipantsCount = async (eventId: string) => {
    try {
      const count = await eventsApi.getParticipantsCount(eventId);
      setParticipantsCount(prev => ({ ...prev, [eventId]: count }));
    } catch (err) {
      console.error('Failed to refresh participants count:', err);
    }
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    if (confirm(`Удалить событие "${eventTitle}"? Это действие нельзя отменить.`)) {
      setDeletingEventId(eventId);
      try {
        await eventsApi.delete(eventId);
        await loadEvents();
        alert('Событие удалено');
      } catch (err) {
        console.error('Delete error:', err);
        alert('Ошибка при удалении события');
      } finally {
        setDeletingEventId(null);
      }
    }
  };

  const handleLeaveEvent = async (eventId: string, eventTitle: string) => {
    if (confirm(`Выйти из события "${eventTitle}"?`)) {
      setLeavingEventId(eventId);
      try {
        await eventsApi.leaveEvent(eventId);
        await loadEvents();
        alert('Вы вышли из события');
      } catch (err) {
        console.error('Leave event error:', err);
        alert('Ошибка при выходе из события');
      } finally {
        setLeavingEventId(null);
      }
    }
  };

  const formatDate = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'Дата не указана';
    }
    
    const startDate = start.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit' 
    });
    const endDate = end.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit' 
    });
    
    if (startDate === endDate) {
      return startDate;
    }
    
    return `${startDate} — ${endDate}`;
  };

  const isCreator = (event: Event) => {
    return event.creatorId === userId;
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0E9243] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Ожидание авторизации...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#0E9243] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center">
          <div className="text-white font-bold text-xl">Лого</div>
          
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-8">
            <button 
              onClick={() => navigate('/contacts')}
              className="text-white/80 hover:text-white transition-colors text-sm font-medium"
            >
              Контакты
            </button>
            <button className="text-white font-semibold border-b-2 border-white pb-1 text-sm">
              Мои события
            </button>
          </div>
          
          <div className="flex items-center gap-4 ml-auto">
            <button 
              onClick={() => navigate('/create')}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2"
            >
              <Plus size={16} />
              Создать
            </button>
            
            <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1.5">
              <Search size={16} className="text-white/70" />
              <span className="text-white/70 text-sm">Поиск</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="bg-gray-100 rounded-2xl p-2 mb-8 inline-block w-full">
          <div className="flex">
            <button
              onClick={() => setActiveTab('created')}
              className={`flex-1 py-3 text-center text-lg font-semibold rounded-xl transition ${
                activeTab === 'created'
                  ? 'bg-white text-[#0E9243] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Созданные мной
            </button>
            <button
              onClick={() => setActiveTab('participated')}
              className={`flex-1 py-3 text-center text-lg font-semibold rounded-xl transition ${
                activeTab === 'participated'
                  ? 'bg-white text-[#0E9243] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Участвую
            </button>
          </div>
        </div>

        {loading && <div className="text-center py-12 text-gray-500">Загрузка...</div>}
        {error && <div className="text-center py-12 text-red-500">{error}</div>}

        {!loading && !error && (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-500 uppercase">Название</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-500 uppercase">Место</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-500 uppercase">Дата</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-500 uppercase">Участников</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-gray-500 uppercase">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400">Нет событий</td>
                  </tr>
                ) : (
                  events.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-base text-gray-800 font-medium">{event.title}</td>
                      <td className="px-6 py-4 text-base text-gray-500">{event.location}</td>
                      <td className="px-6 py-4 text-base text-gray-500">
                        {formatDate(event.startTime, event.endTime)}
                      </td>
                      <td className="px-6 py-4 text-base text-gray-500">
                        {participantsCount[event.id] !== undefined ? participantsCount[event.id] : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">
                          {isCreator(event) ? (
                            <>
                              <button
                                onClick={() => setEditingEvent(event)}
                                className="text-blue-500 hover:text-blue-700 transition"
                                title="Редактировать"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteEvent(event.id, event.title)}
                                disabled={deletingEventId === event.id}
                                className="text-red-500 hover:text-red-700 transition disabled:opacity-50"
                                title="Удалить событие"
                              >
                                <Trash2 size={18} />
                              </button>
                              <button
                                onClick={() => setParticipantsEvent({ id: event.id, title: event.title })}
                                className="text-green-500 hover:text-green-700 transition"
                                title="Участники"
                              >
                                <Users size={18} />
                              </button>
                              <button
                                onClick={() => handleShare(event)}
                                className="text-gray-500 hover:text-gray-700 transition"
                                title="Поделиться"
                              >
                                <Share2 size={18} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setDetailsEvent(event)}
                                className="text-blue-500 hover:text-blue-700 transition"
                                title="Подробнее о событии"
                              >
                                <Info size={18} />
                              </button>
                              <button
                                onClick={() => handleLeaveEvent(event.id, event.title)}
                                disabled={leavingEventId === event.id}
                                className="text-red-500 hover:text-red-700 transition disabled:opacity-50"
                                title="Выйти из события"
                              >
                                <LogOut size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onUpdate={handleUpdateEvent}
        />
      )}
      
      {participantsEvent && (
        <ParticipantsModal
          eventId={participantsEvent.id}
          eventTitle={participantsEvent.title}
          currentUserId={userId || ''}
          onClose={() => {
            setParticipantsEvent(null);
            refreshParticipantsCount(participantsEvent.id);
          }}
          onParticipantsChange={() => refreshParticipantsCount(participantsEvent.id)}
        />
      )}

      {detailsEvent && (
        <EventDetailsModal
          event={detailsEvent}
          onClose={() => setDetailsEvent(null)}
        />
      )}
    </div>
  );
};