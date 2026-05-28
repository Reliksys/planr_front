import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { eventsApi } from '../api/events';

interface ParticipantInfo {
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
}

interface ParticipantsModalProps {
  eventId: string;
  eventTitle: string;
  currentUserId: string;
  onClose: () => void;
  onParticipantsChange?: () => void;
}

export const ParticipantsModal = ({ 
  eventId, 
  eventTitle, 
  currentUserId, 
  onClose, 
  onParticipantsChange 
}: ParticipantsModalProps) => {
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadParticipants = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await eventsApi.getParticipants(eventId);
      setTotalCount(data.count || 0);
      setParticipants(data.participants || []);
    } catch (err) {
      console.error('Error loading participants:', err);
      setError('Не удалось загрузить участников');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParticipants();
  }, [eventId]);

  const handleRemoveParticipant = async (participantId: string, participantName: string) => {
    if (!confirm(`Исключить участника "${participantName}" из события?`)) return;
    
    setRemovingId(participantId);
    try {
      await eventsApi.removeParticipants(eventId, [participantId]);
      await loadParticipants();
      onParticipantsChange?.();
    } catch (err) {
      console.error('Error removing participant:', err);
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при удалении участника';
      if (errorMessage.includes('409') || errorMessage.includes('не является участником')) {
        alert('Участник уже покинул событие или не подтвердил участие');
      } else {
        alert(errorMessage);
      }
    } finally {
      setRemovingId(null);
    }
  };

  const isCurrentUser = (participant: ParticipantInfo) => {
    return participant.participant?.id === currentUserId;
  };

  // Фильтруем только подтверждённых участников (role === 'PARTICIPANT')
  const confirmedParticipants = participants.filter(p => p.role === 'PARTICIPANT');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Участники</h2>
            <p className="text-sm text-gray-500 mt-1">{eventTitle}</p>
            <p className="text-xs text-gray-400 mt-0.5">Всего: {totalCount}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Загрузка...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : confirmedParticipants.length === 0 ? (
            <div className="text-center py-8 text-gray-400">Нет участников</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {confirmedParticipants.map((p) => {
                const isMe = isCurrentUser(p);
                return (
                  <li key={p.participantId} className="py-3 flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-800">
                        {p.participant?.name || 'Без имени'}
                        {isMe && (
                          <span className="ml-2 text-xs text-gray-400">(это вы)</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {p.role === 'PARTICIPANT' ? 'Участник' : p.role}
                      </div>
                      {p.participant?.tgConnected && (
                        <div className="text-xs text-green-600 mt-0.5">Telegram подключён</div>
                      )}
                      {p.participant?.vkConnected && (
                        <div className="text-xs text-blue-600 mt-0.5">VK подключён</div>
                      )}
                    </div>
                    {!isMe && (
                      <button
                        onClick={() => handleRemoveParticipant(p.participantId, p.participant?.name || 'Участника')}
                        disabled={removingId === p.participantId}
                        className="text-red-400 hover:text-red-600 transition disabled:opacity-50"
                        title="Исключить из события"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};