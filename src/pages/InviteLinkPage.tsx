import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { eventsApi } from '../api/events';

export const InviteLinkPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventInfo, setEventInfo] = useState<any>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const loadEvent = async () => {
      if (!eventId) {
        setError('Недействительная ссылка');
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          // Сохраняем eventId и редиректим на логин
          sessionStorage.setItem('pendingInviteEventId', eventId);
          navigate('/login');
          return;
        }

        const event = await eventsApi.getById(eventId);
        setEventInfo(event);
      } catch (err) {
        console.error('Error loading event:', err);
        setError('Событие не найдено');
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [eventId, navigate]);

  const handleAccept = async () => {
    if (!eventId) return;
    
    setSending(true);
    try {
      const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
      await eventsApi.createNamedInvitation({
        eventId: eventId,
        userId: userId,
      });
      alert('Вы присоединились к событию!');
      navigate('/');
    } catch (err) {
      console.error('Error joining event:', err);
      setError('Не удалось присоединиться к событию');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0E9243] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button onClick={() => navigate('/')} className="text-[#0E9243] hover:underline">
            На главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Приглашение на событие</h1>
          <p className="text-gray-600">Вас приглашают присоединиться</p>
        </div>

        {eventInfo && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h2 className="font-semibold text-gray-800 mb-2">{eventInfo.title}</h2>
            <p className="text-sm text-gray-600 mb-1">📍 {eventInfo.location}</p>
            <p className="text-sm text-gray-600">
              🕒 {new Date(eventInfo.startTime).toLocaleString('ru-RU')}
              {eventInfo.endTime && ` - ${new Date(eventInfo.endTime).toLocaleString('ru-RU')}`}
            </p>
            {eventInfo.description && (
              <p className="text-sm text-gray-500 mt-2">{eventInfo.description}</p>
            )}
          </div>
        )}

        <button
          onClick={handleAccept}
          disabled={sending}
          className="w-full bg-[#0E9243] text-white py-3 rounded-lg hover:bg-[#0c7d3a] transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {sending ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Присоединение...
            </>
          ) : (
            'Присоединиться к событию'
          )}
        </button>
      </div>
    </div>
  );
};