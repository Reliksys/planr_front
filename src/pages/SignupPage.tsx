import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const SignupPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const pendingData = sessionStorage.getItem('pendingRegistrationData');
    if (pendingData) {
      const user = JSON.parse(pendingData);
      if (user.first_name) setName(user.first_name);
      else if (user.name) setName(user.name);
      else if (user.username) setName(user.username);
    } else {
      navigate('/');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const pendingData = sessionStorage.getItem('pendingRegistrationData');
      const storedPlatform = sessionStorage.getItem('pendingPlatform');

      let socials: any = {};
      if (storedPlatform === 'tg') {
        const tgUser = JSON.parse(pendingData!);
        socials = {
          tgId: tgUser.id?.toString(),
          tgUsername: tgUser.username,
        };
      } else if (storedPlatform === 'vk') {
        const vkUser = JSON.parse(pendingData!);
        socials = {
          vkId: vkUser.vkUserId,
        };
      }

      const signupRes = await fetch('/api/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, socials }),
      });
      
      if (!signupRes.ok) throw new Error('Ошибка регистрации');

      let authUrl = '';
      let body = {};
      if (storedPlatform === 'tg') {
        authUrl = '/api/auth/telegram';
        body = { initData: sessionStorage.getItem('pendingInitData') };
      } else {
        authUrl = '/api/auth/vk';
        body = { launchParams: sessionStorage.getItem('pendingInitData') };
      }
      
      const authRes = await fetch(authUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (authRes.status === 200) {
        const token = await authRes.text();
        localStorage.setItem('token', token);
        const userRes = await fetch('/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (userRes.ok) {
          const user = await userRes.json();
          localStorage.setItem('user', JSON.stringify(user));
        }
        navigate('/');
      } else {
        throw new Error('Не удалось получить токен после регистрации');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-[#0E9243] mb-2">Лого</div>
          <h1 className="text-2xl font-semibold text-gray-800">Завершите регистрацию</h1>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Ваше имя</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E9243] focus:border-transparent outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0E9243] text-white py-2 rounded-lg hover:bg-[#0c7d3a] transition disabled:opacity-50"
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
      </div>
    </div>
  );
};