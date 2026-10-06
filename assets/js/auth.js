/* ============================================================
   MÓDULO DE AUTENTICAÇÃO - CrecheNow
   Caminhos RELATIVOS para funcionar no GitHub Pages
   ============================================================ */

const CrecheNowAuth = (() => {
  // Banco de dados simulado de usuários
  const MOCK_USERS = [
    { email: 'pai@email.com', senha: '123456', name: 'Carlos Silva', role: 'parent', class: null },
    { email: 'mae@email.com', senha: '123456', name: 'Ana Souza', role: 'parent', class: null },
    { email: 'pai2@email.com', senha: '123456', name: 'Roberto Santos', role: 'parent', class: null },
    { email: 'mae2@email.com', senha: '123456', name: 'Julia Oliveira', role: 'parent', class: null },
    { email: 'professor@email.com', senha: '123456', name: 'Prof. Mariana', role: 'teacher', class: 'A' },
    { email: 'secretaria@email.com', senha: '123456', name: 'Secretaria', role: 'secretary', class: null }
  ];

  // ⚠️ CAMINHOS RELATIVOS (./) - Essencial para GitHub Pages
  const ROLE_ROUTES = {
    parent: './pages/dashboard-parent.html',
    teacher: './pages/dashboard-teacher.html',
    secretary: './pages/dashboard-staff.html'
  };

  const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const buscarUsuario = (email, senha) => {
    return MOCK_USERS.find(u => u.email === email.toLowerCase() && u.senha === senha) || null;
  };

  return {
    init: () => {
      console.log('[Auth] Módulo inicializado.');
    },

    checkSession: () => {
      const sessao = CrecheNowStorage.get('session');
      const paginaAtual = window.location.pathname;

      // Se estiver na página de login e já tiver sessão, redireciona
      if (paginaAtual.includes('index.html') || paginaAtual === '/' || paginaAtual.endsWith('/Teste/')) {
        if (sessao && ROLE_ROUTES[sessao.role]) {
          window.location.href = ROLE_ROUTES[sessao.role];
        }
        return;
      }

      // Se estiver em dashboard e NÃO tiver sessão, volta pro login
      if (!sessao && paginaAtual.includes('dashboard')) {
        window.location.href = './index.html';
        return;
      }

      // Se tiver sessão mas tentar acessar dashboard errado
      if (sessao && ROLE_ROUTES[sessao.role]) {
        const rotaCorreta = ROLE_ROUTES[sessao.role].split('/').pop();
        if (!paginaAtual.includes(rotaCorreta)) {
          window.location.href = ROLE_ROUTES[sessao.role];
        }
      }
    },

    login: (email, senha, lgpdConsent) => {
      if (!email || !validarEmail(email)) {
        return { success: false, msg: 'E-mail inválido.' };
      }
      if (!senha || senha.length < 6) {
        return { success: false, msg: 'Senha deve ter no mínimo 6 caracteres.' };
      }
      if (!lgpdConsent) {
        return { success: false, msg: 'Você precisa concordar com a Política de Privacidade.' };
      }

      const usuario = buscarUsuario(email, senha);
      if (!usuario) {
        return { success: false, msg: 'E-mail ou senha incorretos.' };
      }

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

    // ⚠️ LOGOUT CORRIGIDO - usa ./index.html (relativo)
    logout: () => {
      CrecheNowStorage.set('session', null);
      window.location.href = './index.html';
    }
  };
})();
