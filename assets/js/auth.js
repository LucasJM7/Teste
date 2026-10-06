/* ============================================================
   MÓDULO DE AUTENTICAÇÃO - CrecheNow
   Responsável por: login, validação de credenciais,
   gerenciamento de sessão e logout.
   ============================================================ */

/*
   O módulo é encapsulado em uma IIFE (Immediately Invoked Function Expression)
   para evitar poluir o escopo global. Tudo fica dentro do objeto CrecheNowAuth.
*/
const CrecheNowAuth = (() => {

  /* ----------------------------------------------------------
     USUÁRIOS DE TESTE (simulação do banco de dados)
     No futuro, isso será substituído por uma chamada fetch()
     ao backend (ex: POST /api/auth/login).
     
     Cada usuário tem:
     - email: identificador único
     - senha: em produção, seria um hash (bcrypt)
     - name: nome exibido na interface
     - role: define qual dashboard o usuário verá
     - class: turma vinculada (apenas para professores)
     - lgpdConsent: se o usuário aceitou a política de privacidade
     ---------------------------------------------------------- */
  const MOCK_USERS = [
    {
      email: 'pai@email.com',
      senha: '123456',
      name: 'Carlos Silva',
      role: 'parent',
      class: null,
      lgpdConsent: true
    },
    {
      email: 'mae@email.com',
      senha: '123456',
      name: 'Ana Souza',
      role: 'parent',
      class: null,
      lgpdConsent: true
    },
    {
      email: 'pai2@email.com',
      senha: '123456',
      name: 'Roberto Santos',
      role: 'parent',
      class: null,
      lgpdConsent: true
    },
    {
      email: 'mae2@email.com',
      senha: '123456',
      name: 'Julia Oliveira',
      role: 'parent',
      class: null,
      lgpdConsent: true
    },
    {
      email: 'professor@email.com',
      senha: '123456',
      name: 'Prof. Mariana',
      role: 'teacher',
      class: 'A',
      lgpdConsent: true
    },
    {
      email: 'secretaria@email.com',
      senha: '123456',
      name: 'Secretaria',
      role: 'secretary',
      class: null,
      lgpdConsent: true
    }
  ];

  /* ----------------------------------------------------------
     MAPA DE REDIRECIONAMENTO
     Define qual página cada perfil deve acessar após o login.
     Se adicionar um novo perfil no futuro (ex: 'director'),
     basta adicionar uma nova entrada aqui.
     ---------------------------------------------------------- */
  const ROLE_ROUTES = {
    parent: '/pages/dashboard-parent.html',
    teacher: '/pages/dashboard-teacher.html',
    secretary: '/pages/dashboard-staff.html'
  };

  /* ----------------------------------------------------------
     FUNÇÃO: validarEmail
     Verifica se o e-mail tem formato válido usando regex.
     Retorna true se válido, false caso contrário.
     ---------------------------------------------------------- */
  const validarEmail = (email) => {
    /* Regex padrão para validação de e-mail */
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  /* ----------------------------------------------------------
     FUNÇÃO: buscarUsuario
     Simula uma consulta ao banco de dados.
     No futuro, será substituída por:
       const res = await fetch('/api/auth/login', { method: 'POST', body: ... });
       return res.json();
     ---------------------------------------------------------- */
  const buscarUsuario = (email, senha) => {
    /* Procura um usuário com email e senha correspondentes */
    const usuario = MOCK_USERS.find(
      (u) => u.email === email && u.senha === senha
    );
    /* Retorna o usuário encontrado ou null se não existir */
    return usuario || null;
  };

  /* ----------------------------------------------------------
     FUNÇÃO: criarSessao
     Armazena os dados do usuário logado no localStorage.
     A sessão é usada por todos os dashboards para saber
     quem está logado e o que ele pode fazer.
     ---------------------------------------------------------- */
  const criarSessao = (usuario) => {
    /* Monta o objeto de sessão com apenas os dados necessários */
    const sessao = {
      email: usuario.email,
      name: usuario.name,
      role: usuario.role,
      class: usuario.class || null,
      loginAt: new Date().toISOString()
    };

    /* Salva no localStorage (persiste entre recarregamentos) */
    CrecheNowStorage.set('session', sessao);

    /* Retorna a sessão criada */
    return sessao;
  };

  /* ----------------------------------------------------------
     FUNÇÃO: obterSessao
     Lê a sessão atual do localStorage.
     Retorna null se não houver usuário logado.
     ---------------------------------------------------------- */
  const obterSessao = () => {
    return CrecheNowStorage.get('session');
  };

  /* ----------------------------------------------------------
     FUNÇÃO: limparSessao
     Remove a sessão do localStorage.
     Usada no logout.
     ---------------------------------------------------------- */
  const limparSessao = () => {
    CrecheNowStorage.set('session', null);
  };

  /* ----------------------------------------------------------
     FUNÇÃO PÚBLICA: login
     Realiza o processo completo de autenticação.
     
     Parâmetros:
     - email: string, e-mail digitado pelo usuário
     - senha: string, senha digitada pelo usuário
     - lgpdConsent: boolean, se o usuário aceitou a política
     
     Retorna:
     - { success: true, session: {...} } em caso de sucesso
     - { success: false, msg: '...' } em caso de erro
     ---------------------------------------------------------- */
  const login = (email, senha, lgpdConsent) => {
    /* 1. Valida se o e-mail foi preenchido */
    if (!email || email.trim() === '') {
      return { success: false, msg: 'Por favor, informe seu e-mail.' };
    }

    /* 2. Valida o formato do e-mail */
    if (!validarEmail(email)) {
      return { success: false, msg: 'E-mail inválido.' };
    }

    /* 3. Valida se a senha foi preenchida */
    if (!senha || senha.trim() === '') {
      return { success: false, msg: 'Por favor, informe sua senha.' };
    }

    /* 4. Valida tamanho mínimo da senha */
    if (senha.length < 6) {
      return { success: false, msg: 'Senha deve ter no mínimo 6 caracteres.' };
    }

    /* 5. Valida consentimento LGPD (obrigatório por lei) */
    if (!lgpdConsent) {
      return {
        success: false,
        msg: 'Você precisa concordar com a Política de Privacidade.'
      };
    }

    /* 6. Busca o usuário no "banco de dados" simulado */
    const usuario = buscarUsuario(email.trim().toLowerCase(), senha);

    /* 7. Se não encontrou, retorna erro genérico (não revela se o email existe) */
    if (!usuario) {
      return { success: false, msg: 'E-mail ou senha incorretos.' };
    }

    /* 8. Cria a sessão no localStorage */
    const sessao = criarSessao(usuario);

    /* 9. Retorna sucesso com os dados da sessão */
    return { success: true, session: sessao };
  };

  /* ----------------------------------------------------------
     FUNÇÃO PÚBLICA: logout
     Encerra a sessão do usuário e redireciona para o login.
     ---------------------------------------------------------- */
  const logout = () => {
    /* Remove a sessão do localStorage */
    limparSessao();

    /* Redireciona para a página de login */
    window.location.href = '/index.html';
  };

  /* ----------------------------------------------------------
     FUNÇÃO PÚBLICA: verificarSessao
     Verifica se há uma sessão ativa.
     Se não houver, redireciona para o login.
     Se houver, mas a rota não for permitida para aquele perfil,
     também redireciona.
     
     Deve ser chamada no início de cada dashboard.
     ---------------------------------------------------------- */
  const verificarSessao = () => {
    /* Lê a sessão atual */
    const sessao = obterSessao();

    /* Se não há sessão, volta para o login */
    if (!sessao) {
      window.location.href = '/index.html';
      return false;
    }

    /* Verifica se o perfil tem acesso à página atual */
    const paginaAtual = window.location.pathname;
    const rotaPermitida = ROLE_ROUTES[sessao.role];

    /* Se a página atual não é a rota permitida para este perfil, redireciona */
    if (rotaPermitida && !paginaAtual.includes(rotaPermitida.split('/').pop())) {
      window.location.href = rotaPermitida;
      return false;
    }

    /* Sessão válida e perfil correto */
    return true;
  };

  /* ----------------------------------------------------------
     FUNÇÃO PÚBLICA: obterUsuarioAtual
     Retorna os dados do usuário logado.
     Útil para exibir nome, turma, etc. na interface.
     ---------------------------------------------------------- */
  const obterUsuarioAtual = () => {
    return obterSessao();
  };

  /* ----------------------------------------------------------
     FUNÇÃO PÚBLICA: ehPerfil
     Verifica se o usuário logado tem um determinado perfil.
     Ex: ehPerfil('teacher') retorna true se for professor.
     ---------------------------------------------------------- */
  const ehPerfil = (role) => {
    const sessao = obterSessao();
    return sessao && sessao.role === role;
  };

  /* ----------------------------------------------------------
     EXPORTAÇÃO: torna as funções públicas acessíveis
     ---------------------------------------------------------- */
  return {
    login: login,
    logout: logout,
    verificarSessao: verificarSessao,
    obterUsuarioAtual: obterUsuarioAtual,
    ehPerfil: ehPerfil
  };
})();
