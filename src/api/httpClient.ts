const originalFetch = window.fetch;

window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  
  if (response.status === 401) {
    console.log('🔴 Получен 401, НО редирект отключён для отладки');
    // localStorage.removeItem('token');
    // localStorage.removeItem('user');
    // if (!window.location.pathname.includes('/login')) {
    //   window.location.href = '/login';
    // }
  }
  
  return response;
};