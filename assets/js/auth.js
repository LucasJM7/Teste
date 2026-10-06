/* ============================================================
   MÓDULO DE AUTENTICAÇÃO - CrecheNow
   Responsável por: Login, validação de credenciais, 
   gerenciamento de sessão e logout.
   ============================================================ */

const CrecheNowAuth = (() => {
  // Banco de dados simulado de usuários (sem emojis)
  const MOCK_USERS = [
    { email: 'pai@email.com', senha: '123456', name: 'Carlos Silva', role: 'parent', class: null },
    { email: 'mae@email.com', senha: '123456', name: 'Ana Souza', role: 'parent', class: null },
    { email: 'pai2@email.com', senha: '123456', name: 'Roberto Santos', role: 'parent', class: null },
    { email: 'mae2@email.com', senha: '123456', name: 'Julia Oliveira', role: 'parent', class: null },
    { email: 'professor@email.com', senha: '123456', name: 'Prof. Mariana', role: 'teacher', class: 'A' },
    { email: 'secretaria@email.com', senha: '123456', name: 'Secretaria', role: 'secretary', class: null }
  ];

  // Mapeamento de qual página cada perfil deve acessar
  const ROLE_ROUTES = {
    parent: '/pages/dashboard-parent.html',
    teacher: '/pages/dashboard-teacher.html',
    secretary: '/pages/dashboard-staff.html'
  };

  // Valida formato de e-mail usando expressão regular
  const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Busca usuário no array simulado (case-insensitive para o e-mail)
  const buscarUsuario = (email, senha) => {
    return MOCK_USERS.find(u => u.email === email.toLowerCase() && u.senha === senha) || null;
  };

  return {
    // Inicializa o módulo (chamado pelo app.js)
    init: () => {
      console.log('[Auth] Modulo de autenticacao inicializado.');
    },

    // Verifica se o usuário tem permissão para estar na página atual
    checkSession: () => {
      const sessao = CrecheNowStorage.get('session');
      const paginaAtual = window.location.pathname;

      // Se estiver na página de login e já tiver sessão válida, redireciona para o dashboard
      if (paginaAtual.includes('index.html') || paginaAtual === '/') {
        if (sessao && ROLE_ROUTES[sessao.role]) {
          window.location.href = ROLE_ROUTES[sessao.role];
        }
        return;
      }

      // Se estiver em um dashboard e NÃO tiver sessão, expulsa para o login
      if (!sessao && paginaAtual.includes('dashboard')) {
        window.location.href = '/index.html';
        return;
      }

      // Se tiver sessão, mas tentar acessar um dashboard de outro perfil, redireciona
      if (sessao && ROLE_ROUTES[sessao.role] && !paginaAtual.includes(ROLE_ROUTES[sessao.role].split('/').pop())) {
        window.location.href = ROLE_ROUTES[sessao.role];
      }
    },

    // Realiza o processo de login
    login: (email, senha, lgpdConsent) => {
      if (!email || !validarEmail(email)) {
        return { success: false, msg: 'E-mail invalido.' };
      }
      if (!senha || senha.length < 6) {
        return { success: false, msg: 'Senha deve ter no minimo 6 caracteres.' };
      }
      if (!lgpdConsent) {
        return { success: false, msg: 'Voce precisa concordar com a Politica de Privacidade.' };
      }

      const usuario = buscarUsuario(email, senha);
      if (!usuario) {
        return { success: false, msg: 'E-mail ou senha incorretos.' };
      }

      // Cria o objeto de sessão
      const sessao = {
        email: usuario.email,
        name: usuario.name,
        role: usuario.role,
        class: usuario.class || null,
        loginAt: new Date().toISOString()
      };

      // Salva no localStorage
      CrecheNowStorage.set('session', sessao);
      return { success: true, session: sessao };
    },

    // Realiza o logout
    logout: () => {
      CrecheNowStorage.set('session', null); // Remove a sessão
      window.location.href = '/index.html';  // Redireciona para o login
    }
  };
})();
