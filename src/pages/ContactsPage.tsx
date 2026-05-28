import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Clock, ArrowLeft, RefreshCw, Trash2 } from 'lucide-react';
import { eventsApi } from '../api/events';
import type { Event, RecentContact } from '../api/events';

export const ContactsPage = () => {
  const navigate = useNavigate();
  const [recentContacts, setRecentContacts] = useState<RecentContact[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);

  // Загружаем события пользователя
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await eventsApi.getCreatedByUser();
        setEvents(data);
        if (data.length > 0) {
          setSelectedEvent(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load events:', err);
      }
    };
    loadEvents();
  }, []);

  const handleDeleteContact = async (contactId: string, contactName: string) => {
    if (confirm(`Удалить контакт "${contactName}" из недавних?`)) {
      setDeletingContactId(contactId);
      try {
        await eventsApi.deleteRecentContact(contactId);
        await loadRecentContacts(); // обновляем список
        setMessage({ text: 'Контакт удалён', type: 'success' });
        setTimeout(() => setMessage(null), 2000);
      } catch (err) {
        console.error('Delete contact error:', err);
        setMessage({ text: 'Ошибка при удалении контакта', type: 'error' });
      } finally {
        setDeletingContactId(null);
      }
    }
  };

  
  // Загружаем недавние контакты с бэкенда
  const loadRecentContacts = async () => {
    console.log('🔄 Загрузка контактов...');
        setLoadingContacts(true);
        try {
            const contacts = await eventsApi.getRecentContacts(20, 0);
            console.log('✅ Получены контакты:', contacts);
            console.log('📊 Количество контактов:', contacts.length);
            setRecentContacts(contacts);
        } catch (err) {
            console.error('❌ Ошибка загрузки контактов:', err);
        } finally {
            setLoadingContacts(false);
        }
  };

  useEffect(() => {
    loadRecentContacts();
  }, []);

  const handleSendInvite = async (userId: string, userName: string) => {
    if (!selectedEvent) {
      setMessage({ text: 'Выберите событие', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await eventsApi.createNamedInvitation({
        eventId: selectedEvent,
        userId: userId,
        routingKey: 'all',
      });

      setMessage({ text: `Приглашение отправлено пользователю ${userName}`, type: 'success' });
      
      // Обновляем список контактов
      setTimeout(() => loadRecentContacts(), 1000);
      
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Failed to send invite:', err);
      setMessage({ text: 'Ошибка при отправке приглашения', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Верхняя панель */}
      <div className="bg-[#0E9243] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center">
          <button 
            onClick={() => navigate('/')}
            className="text-white/80 hover:text-white transition flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            <span>Назад</span>
          </button>
          <div className="flex-1 text-center text-white font-semibold text-lg">Контакты</div>
          <button 
            onClick={loadRecentContacts}
            className="text-white/80 hover:text-white transition"
            title="Обновить список"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Выбор события */}
        <div className="bg-gray-50 rounded-xl p-5 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Выберите событие для приглашения
          </label>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E9243] focus:border-transparent outline-none"
          >
            {events.length === 0 ? (
              <option value="">Нет созданных событий</option>
            ) : (
              events.map(event => (
                <option key={event.id} value={event.id}>{event.title}</option>
              ))
            )}
          </select>
        </div>

        {/* Сообщение об успехе/ошибке */}
        {message && (
          <div className={`mb-6 p-3 rounded-lg text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}>
            {message.text}
          </div>
        )}

        {/* Недавние контакты */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-[#0E9243]" />
            Недавние контакты
          </h2>
          
          {loadingContacts ? (
            <p className="text-gray-400 text-center py-6">Загрузка...</p>
          ) : recentContacts.length === 0 ? (
            <p className="text-gray-400 text-center py-6">
              Нет недавних контактов. Когда кто-то примет ваше безымянное приглашение, он появится здесь.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentContacts.map((contact) => (
                <li key={contact.id} className="py-3 flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-800">{contact.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {contact.tgConnected && <span className="mr-2">Telegram ✓</span>}
                      {contact.vkConnected && <span>VK ✓</span>}
                    </div>
                    <div className="text-xs text-gray-400">
                      Последнее взаимодействие: {formatDate(contact.lastInteractionAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSendInvite(contact.id, contact.name)}
                    disabled={loading || !selectedEvent}
                    className="text-[#0E9243] hover:text-[#0c7d3a] transition disabled:opacity-50"
                    title="Отправить приглашение"
                  >
                    <Send size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteContact(contact.id, contact.name)}
                    disabled={deletingContactId === contact.id}
                    className="text-red-400 hover:text-red-600 transition disabled:opacity-50"
                    title="Удалить из контактов"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};