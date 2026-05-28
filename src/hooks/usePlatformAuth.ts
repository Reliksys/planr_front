import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import vkBridge from '@vkontakte/vk-bridge';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        initData: string;
        initDataUnsafe: any;
      };
    };
  }
}

export const usePlatformAuth = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleBackendResponse = async (response: Response) => {
    if (response.status === 200) {
      const token = await response.text();
      localStorage.setItem('token', token);
      // Получаем профиль пользователя
      const userRes = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (userRes.ok) {
        const user = await userRes.json();
        localStorage.setItem('user', JSON.stringify(user));
      }
      navigate('/');
    } else if (response.status === 404) {
      const userData = await response.json();
      sessionStorage.setItem('pendingRegistrationData', JSON.stringify(userData));
      // Сохраняем, через какую платформу пришли (tg/vk)
      sessionStorage.setItem('pendingPlatform', new URLSearchParams(window.location.search).get('platform') || 'tg');
      navigate('/signup');
    } else {
      console.error('Auth error:', response.status);
      navigate('/login-fallback'); // можно на страницу с ручным входом как fallback
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const platform = urlParams.get('platform');

    // --- Telegram ---
    if (platform === 'tg') {
      const initData = window.Telegram?.WebApp?.initData;
      if (initData && initData !== '') {
        console.log('Валидный вход через Telegram');
        // Инициализируем Telegram WebApp
        window.Telegram?.WebApp?.ready();
        fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData }),
        })
          .then(handleBackendResponse)
          .catch(console.error)
          .finally(() => setLoading(false));
      } else {
        console.error('Попытка подмены платформы Telegram');
        setLoading(false);
      }
      return;
    }

    // --- VK ---
    if (platform === 'vk') {
      const vkSign = urlParams.get('vk_sign');
      if (vkSign && vkSign !== '') {
        console.log('Валидный вход через VK');
        // Инициализация VK Bridge
        vkBridge.send('VKWebAppInit', {}).catch(e => console.error('VK Bridge init error', e));
        const launchParams = window.location.search;
        fetch('/api/auth/vk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ launchParams }),
        })
          .then(handleBackendResponse)
          .catch(console.error)
          .finally(() => setLoading(false));
      } else {
        console.error('Попытка подмены платформы VK');
        setLoading(false);
      }
      return;
    }

    // --- Обычный браузер / нет платформы ---
    console.log('Обычный браузер, авторизация не требуется');
    setLoading(false);
  }, [navigate]);

  return { loading };
};