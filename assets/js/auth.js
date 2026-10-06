const CrecheNowAuth = (() => {
  const MOCK_USERS = [
    { email: 'pai@email.com', senha: '123456', name: 'Carlos Silva', role: 'parent', class: null },
    { email: 'mae@email.com', senha: '123456', name: 'Ana Souza', role: 'parent', class: null },
    { email: 'pai2@email.com', senha: '123456', name: 'Roberto Santos', role: 'parent', class: null },
    { email: 'mae2@email.com', senha: '123456', name: 'Julia Oliveira', role: 'parent', class: null },
    { email: 'professor@email.com', senha: '123456', name: 'Prof. Mariana', role: 'teacher', class: 'A' },
    { email: 'secretaria@email.com', senha: '123456', name: 'Secretaria', role: 'secretary', class: null }
  ];

  // Caminhos a partir da RAIZ (usado no index.html para redirecionar após login)
  const ROLE_ROUTES = {
    parent: './pages/dashboard-parent.html',
    teacher: './pages/dashboard-teacher.html',
    secretary: './pages/dashboard-staff.html'
  };

  // Caminho para o logout a partir da pasta 'pages/'
  // ../ sobe uma pasta, voltando para a raiz onde está o index.html
  const LOGOUT_URL = '../index.html';

  const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const buscarUsuario = (email, senha) => {
    return MOCK_USERS.find(u => u.email === email.toLowerCase() && u.senha === senha) || null;
  };

  return {
    init: () => console.log('[Auth] Módulo inicializado.'),

    checkSession: () => {
      const sessao = CrecheNowStorage.get('session');
      const pathname = window.location.pathname;
      
      // Se estiver na raiz (index.html) e tiver sessão, redireciona para o dashboard
      if (pathname.endsWith('/') || pathname.endsWith('index.html')) {
        if (sessao && ROLE_ROUTES[sessao.role]) {
          window.location.href = ROLE_ROUTES[sessao.role];
        }
        return;
      }

      // Se estiver em um dashboard e NÃO tiver sessão, volta para a raiz
      if (!sessao && pathname.includes('dashboard')) {
        window.location.href = LOGOUT_URL;
        return;
      }

      // Proteção de rota: se o usuário tentar acessar um dashboard que não é o dele
      if (sessao && ROLE_ROUTES[sessao.role]) {
        const paginaCorreta = ROLE_ROUTES[sessao.role].split('/').pop();
        if (!pathname.includes(paginaCorreta)) {
          window.location.href = ROLE_ROUTES[sessao.role];
        }
      }
    },

    login: (email, senha, lgpdConsent) => {
      if (!email || !validarEmail(email)) return { success: false, msg: 'E-mail inválido.' };
      if (!senha || senha.length < 6) return { success: false, msg: 'Senha deve ter no mínimo 6 caracteres.' };
      if (!lgpdConsent) return { success: false, msg: 'Você precisa concordar com a Política de Privacidade.' };

      const usuario = buscarUsuario(email, senha);
      if (!usuario) return { success: false, msg: 'E-mail ou senha incorretos.' };

      const sessao = {
        email: usuario.email,
        name: usuario.name,
        role: usuario.role,
        class: usuario.class || null,
        loginAt: new Date().toISOString()
      };

      CrecheNowStorage.set('session', sessao);
      return { success: true, session: sessao };
    },

    // CORREÇÃO CRÍTICA: Usa LOGOUT_URL (../index.html) para sair da pasta pages/
    logout: () => {
      CrecheNowStorage.set('session', null);
      window.location.href = LOGOUT_URL;
    }
  };
})();
