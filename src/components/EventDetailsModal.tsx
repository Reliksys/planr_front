import { X, Calendar, MapPin, Clock, FileText } from 'lucide-react';
import type { Event } from '../api/events';

interface EventDetailsModalProps {
  event: Event;
  onClose: () => void;
}

export const EventDetailsModal = ({ event, onClose }: EventDetailsModalProps) => {
  const formatFullDateTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    const startFull = start.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const endFull = end.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return { startFull, endFull };
  };

  const { startFull, endFull } = formatFullDateTime(event.startTime, event.endTime);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b">
          <h2 className="text-lg font-semibold text-gray-800">О событии</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5 space-y-4">
          {/* Название */}
          <div>
            <h3 className="text-xl font-bold text-gray-800">{event.title}</h3>
          </div>
          
          {/* Место */}
          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Место проведения</p>
              <p className="text-gray-800">{event.location}</p>
            </div>
          </div>
          
          {/* Дата и время начала */}
          <div className="flex items-start gap-3">
            <Calendar size={18} className="text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Начало</p>
              <p className="text-gray-800">{startFull}</p>
            </div>
          </div>
          
          {/* Дата и время окончания */}
          <div className="flex items-start gap-3">
            <Clock size={18} className="text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Окончание</p>
              <p className="text-gray-800">{endFull}</p>
            </div>
          </div>
          
          {/* Описание */}
          {event.description && (
            <div className="flex items-start gap-3">
              <FileText size={18} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Описание</p>
                <p className="text-gray-800 whitespace-pre-wrap">{event.description}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};