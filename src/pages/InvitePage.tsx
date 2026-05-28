import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, X, Loader2 } from 'lucide-react';
import { eventsApi } from '../api/events';

export const InvitePage = () => {
  const { invitationId } = useParams<{ invitationId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventInfo, setEventInfo] = useState<any>(null);

  useEffect(() => {
    const processInvitation = async () => {
      if (!invitationId) {
        setError('Недействительная ссылка приглашения');
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          localStorage.setItem('pendingInvite', invitationId);
          navigate('/login');
          return;
        }

        const event = await eventsApi.getById(invitationId);
        setEventInfo(event);
        setLoading(false);
      } catch (err) {
        console.error('Error loading invitation:', err);
        setError('Приглашение не найдено или истекло');
        setLoading(false);
      }
    };

    processInvitation();
  }, [invitationId, navigate]);

  const handleResponse = async (status: 'ACCEPTED' | 'DECLINED') => {
    if (!invitationId) return;
    
    setLoading(true);
    try {
      await eventsApi.answerInvitation(invitationId, status);
      
      if (status === 'ACCEPTED') {
        // ========== ДОБАВИТЬ ЭТУ СТРОКУ ==========
        sessionStorage.setItem('joinedEventId', invitationId);
        // =========================================
        alert('Вы присоединились к событию');
        navigate('/');
      } else {
        alert('Вы отклонили приглашение');
        navigate('/');
      }
    } catch (err) {
      console.error('Error answering invitation:', err);
      setError('Ошибка при ответе на приглашение');
      setLoading(false);
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
          <h1 className="text-xl font-semibold text-gray-800 mb-2">{error}</h1>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-[#0E9243] hover:underline"
          >
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
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Приглашение на событие
          </h1>
          <p className="text-gray-600">
            Вас приглашают присоединиться
          </p>
        </div>

        {eventInfo && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h2 className="font-semibold text-gray-800 mb-2">{eventInfo.title}</h2>
            <p className="text-sm text-gray-600 mb-1">Место: {eventInfo.location}</p>
            <p className="text-sm text-gray-600">
              Время: {new Date(eventInfo.startTime).toLocaleString('ru-RU')}
              {eventInfo.endTime && ` - ${new Date(eventInfo.endTime).toLocaleString('ru-RU')}`}
            </p>
            {eventInfo.description && (
              <p className="text-sm text-gray-500 mt-2">{eventInfo.description}</p>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => handleResponse('DECLINED')}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
          >
            <X size={18} />
            Отклонить
          </button>
          <button
            onClick={() => handleResponse('ACCEPTED')}
            className="flex-1 bg-[#0E9243] text-white px-4 py-2 rounded-lg hover:bg-[#0c7d3a] transition flex items-center justify-center gap-2"
          >
            <Check size={18} />
            Принять
          </button>
        </div>
      </div>
    </div>
  );
};