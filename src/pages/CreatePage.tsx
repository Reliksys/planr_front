import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, FileText, ArrowLeft } from 'lucide-react';
import { eventsApi } from '../api/events';

export const CreatePage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
  });

  // Проверка, что все обязательные поля заполнены
  const isFormValid = () => {
    return (
      formData.title.trim() !== '' &&
      formData.location.trim() !== '' &&
      formData.startTime !== '' &&
      formData.endTime !== ''
    );
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;
    
    setIsSubmitting(true);
    
    try {
      await eventsApi.create({
        title: formData.title,
        description: formData.description,
        location: formData.location,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
      });
      
      navigate('/');
    } catch (err) {
      alert('Ошибка при создании события: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#0E9243] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center">
          <button 
            onClick={() => navigate('/')}
            className="text-white/80 hover:text-white transition flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            <span>Назад</span>
          </button>
          <div className="flex-1 text-center text-white font-semibold text-lg">
            Создать событие
          </div>
          <div className="w-20" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <form onSubmit={handleCreateEvent} className="bg-white rounded-xl border p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Новое событие</h1>
          
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Название события *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E9243] focus:border-transparent outline-none"
              placeholder="Конференция ТПУ "
            />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin size={16} className="inline mr-1" />
              Место проведения *
            </label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E9243] focus:border-transparent outline-none"
              placeholder="Бабкина, 37"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-1" />
                Начало *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E9243] focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-1" />
                Конец *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E9243] focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText size={16} className="inline mr-1" />
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E9243] focus:border-transparent outline-none resize-none"
              placeholder="Расскажите подробнее о событии..."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={!isFormValid() || isSubmitting}
              className={`flex-1 px-4 py-2 rounded-lg transition flex items-center justify-center gap-2 ${
                !isFormValid() || isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#0E9243] text-white hover:bg-[#0c7d3a]'
              }`}
            >
              {isSubmitting ? 'Создание...' : 'Создать событие'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};