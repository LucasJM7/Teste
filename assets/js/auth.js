const CrecheNowAuth = (() => {
  const MOCK_USERS = [
    { email: 'pai@email.com', senha: '123456', name: 'Carlos Silva', role: 'parent', class: null },
    { email: 'mae@email.com', senha: '123456', name: 'Ana Souza', role: 'parent', class: null },
    { email: 'pai2@email.com', senha: '123456', name: 'Roberto Santos', role: 'parent', class: null },
    { email: 'mae2@email.com', senha: '123456', name: 'Julia Oliveira', role: 'parent', class: null },
    { email: 'professor@email.com', senha: '123456', name: 'Prof. Mariana', role: 'teacher', class: 'A' },
    { email: 'secretaria@email.com', senha: '123456', name: 'Secretaria', role: 'secretary', class: null }
  ];

  const ROLE_ROUTES = {
    parent: './pages/dashboard-parent.html',
    teacher: './pages/dashboard-teacher.html',
    secretary: './pages/dashboard-staff.html'
  };

  // CORREÇÃO CRÍTICA: Sobe uma pasta para encontrar o index.html na raiz
  const LOGOUT_URL = '../index.html';

  const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const buscarUsuario = (email, senha) => MOCK_USERS.find(u => u.email === email.toLowerCase() && u.senha === senha) || null;

  return {
    init: () => console.log('[Auth] Modulo inicializado.'),
    checkSession: () => {
      const sessao = CrecheNowStorage.get('session');
      const pathname = window.location.pathname;
      if (pathname.endsWith('/') || pathname.endsWith('index.html')) {
        if (sessao && ROLE_ROUTES[sessao.role]) window.location.href = ROLE_ROUTES[sessao.role];
        return;
      }
      if (!sessao && pathname.includes('dashboard')) {
        window.location.href = LOGOUT_URL;
        return;
      }
      if (sessao && ROLE_ROUTES[sessao.role]) {
        const paginaCorreta = ROLE_ROUTES[sessao.role].split('/').pop();
        if (!pathname.includes(paginaCorreta)) window.location.href = ROLE_ROUTES[sessao.role];
      }
    },
    login: (email, senha, lgpdConsent) => {
      if (!email || !validarEmail(email)) return { success: false, msg: 'E-mail invalido.' };
      if (!senha || senha.length < 6) return { success: false, msg: 'Senha deve ter no minimo 6 caracteres.' };
      if (!lgpdConsent) return { success: false, msg: 'Voce precisa concordar com a Politica de Privacidade.' };
      const usuario = buscarUsuario(email, senha);
      if (!usuario) return { success: false, msg: 'E-mail ou senha incorretos.' };
      const sessao = { email: usuario.email, name: usuario.name, role: usuario.role, class: usuario.class || null, loginAt: new Date().toISOString() };
      CrecheNowStorage.set('session', sessao);
      return { success: true, session: sessao };
    },
    logout: () => {
      CrecheNowStorage.set('session', null);
      window.location.href = LOGOUT_URL;
    }
  };
})();
