import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tgId, setTgId] = useState('');
  const [vkId, setVkId] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams();
      if (tgId) params.append('tgId', tgId);
      if (vkId) params.append('vkId', vkId);
      
      console.log('Запрос:', `/api/auth/sign-in?${params.toString()}`);
      
      const response = await fetch(`/api/auth/sign-in?${params.toString()}`, {
        method: 'GET',
      });
      
      console.log('Статус:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Ошибка:', errorText);
        throw new Error('Ошибка входа. Проверьте tgId или vkId');
      }
      
      const token = await response.text();
      localStorage.setItem('token', token);
      
      const userResponse = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (userResponse.ok) {
        const user = await userResponse.json();
        localStorage.setItem('user', JSON.stringify(user));
        console.log('Вход выполнен:', user);
      }
      
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-[#0E9243] mb-2">Лого</div>
          <h1 className="text-2xl font-semibold text-gray-800">Вход</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telegram ID
            </label>
            <input
              type="text"
              value={tgId}
              onChange={(e) => setTgId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E9243] focus:border-transparent outline-none"
              placeholder="tg123456"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              VK ID
            </label>
            <input
              type="text"
              value={vkId}
              onChange={(e) => setVkId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E9243] focus:border-transparent outline-none"
              placeholder="vk123456"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0E9243] text-white py-2 rounded-lg hover:bg-[#0c7d3a] transition disabled:opacity-50"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        
        <div className="mt-4 text-center text-xs text-gray-400">
          <p>Используйте tgId или vkId, которые указали при регистрации</p>
        </div>
      </div>
    </div>
  );
};