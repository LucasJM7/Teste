/* ============================================================
   MÓDULO DE ORQUESTRAÇÃO (APP) - CrecheNow
   Responsável por: Ouvir eventos do DOM (cliques, submits), 
   validar formulários e chamar os módulos de Auth, Storage e UI.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Inicializa os módulos principais
  CrecheNowAuth.init();
  CrecheNowAuth.checkSession(); // Protege as rotas imediatamente
  
  if (typeof CrecheNowNotifications !== 'undefined') {
    CrecheNowNotifications.initRealTimeSync();
    CrecheNowNotifications.initModalHandlers();
  }

  // 2. Exibe o nome do usuário logado no header (se aplicável)
  const session = CrecheNowStorage.get('session');
  if (session) {
    const nameDisplay = document.getElementById('userNameDisplay') || document.getElementById('teacherInfo');
    if (nameDisplay) {
      nameDisplay.textContent = session.name + (session.class ? ` (Turma ${session.class})` : '');
    }
  }

  // ==========================================================
  // LÓGICA DA PÁGINA DE LOGIN (index.html)
  // ==========================================================
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault(); // Impede o recarregamento da página
      
      // Validação visual do Bootstrap
      if (!loginForm.checkValidity()) { 
        loginForm.classList.add('was-validated'); 
        return; 
      }

      const email = document.getElementById('email').value;
      const senha = document.getElementById('senha').value;
      const lgpd = document.getElementById('lgpdConsent').checked;

      // Chama o módulo de autenticação
      const res = CrecheNowAuth.login(email, senha, lgpd);

      if (res.success) {
        // Redireciona com base no perfil do usuário
        const newSession = CrecheNowStorage.get('session');
        const roleMap = { 
          'parent': '/pages/dashboard-parent.html', 
          'secretary': '/pages/dashboard-staff.html', 
          'teacher': '/pages/dashboard-teacher.html' 
        };
        window.location.href = roleMap[newSession.role];
      } else {
        // Exibe erro em um toast
        CrecheNowNotifications.showToast(res.msg, 'danger');
      }
    });

    // Preenche dados automaticamente para testes
    document.getElementById('demoAccess')?.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('email').value = 'pai@email.com';
      document.getElementById('senha').value = '123456';
      document.getElementById('lgpdConsent').checked = true;
    });
  }

  // ==========================================================
  // LÓGICA DA SECRETARIA (dashboard-staff.html)
  // ==========================================================
  const staffForm = document.getElementById('staffForm');
  if (staffForm) {
    // Define data e hora atuais como padrão nos inputs
    const notifyDateInput = document.getElementById('notifyDate');
    const notifyTimeInput = document.getElementById('notifyTime');
    if (notifyDateInput && notifyTimeInput) {
      const now = new Date();
      notifyDateInput.value = now.toISOString().split('T')[0];
      notifyTimeInput.value = now.toTimeString().slice(0, 5);
    }

    staffForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!staffForm.checkValidity()) { 
        staffForm.classList.add('was-validated'); 
        return; 
      }

      // Captura o valor do radio button selecionado
      const notifyType = document.querySelector('input[name="notifyType"]:checked').value;

      const dateVal = document.getElementById('notifyDate').value;
      const timeVal = document.getElementById('notifyTime').value;
      const customDateTime = new Date(`${dateVal}T${timeVal}:00`);

      const newNotif = {
        title: document.getElementById('notifyTitle').value,
        body: document.getElementById('notifyBody').value,
        type: notifyType,
        target: document.getElementById('notifyTarget').value,
        date: customDateTime.toISOString()
      };

      CrecheNowStorage.addNotification(newNotif);
      staffForm.reset(); 
      staffForm.classList.remove('was-validated');
      
      // Restaura data/hora para "agora"
      const now = new Date();
      notifyDateInput.value = now.toISOString().split('T')[0];
      notifyTimeInput.value = now.toTimeString().slice(0, 5);
      
      CrecheNowNotifications.showToast('Comunicado enviado com sucesso!');
      CrecheNowNotifications.renderSent();
    });

    // Renderiza a tabela de alunos ao carregar
    CrecheNowNotifications.renderStudentManagement();
  }

  // Botão para abrir modal de adicionar aluno
  document.getElementById('openAddStudentBtn')?.addEventListener('click', () => {
    CrecheNowNotifications.openModal('addStudentModal');
  });
  
  document.getElementById('openAddStudentBtn2')?.addEventListener('click', () => {
    CrecheNowNotifications.openModal('addStudentModal');
  });

  const addStudentForm = document.getElementById('addStudentForm');
  if (addStudentForm) {
    addStudentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      CrecheNowStorage.addStudent({
        name: document.getElementById('newStudentName').value,
        class: document.getElementById('newStudentClass').value,
        parentEmail: document.getElementById('newStudentParentEmail').value
      });
      addStudentForm.reset();
      CrecheNowNotifications.showToast('Aluno cadastrado com sucesso!');
      CrecheNowNotifications.renderStudentManagement();
      CrecheNowNotifications.closeModal('addStudentModal');
    });
  }

  // Botão para abrir recados dos pais (Secretaria)
  document.getElementById('openParentMsgsBtn')?.addEventListener('click', () => {
    CrecheNowNotifications.renderParentMessagesForStaff();
    CrecheNowNotifications.openModal('parentMsgsModal');
  });

  // ==========================================================
  // LÓGICA DO PROFESSOR (dashboard-teacher.html)
  // ==========================================================
  const teacherRoutineForm = document.getElementById('teacherRoutineForm');
  if (teacherRoutineForm) {
    CrecheNowNotifications.renderTeacherDashboard();

    // Lógica para esconder/mostrar perguntas se o aluno estiver ausente
    const attendanceCheckbox = document.getElementById('routineAttendance');
    const questionsContainer = document.getElementById('routineQuestionsContainer');
    
    const toggleQuestions = () => {
      if (attendanceCheckbox.checked) {
        questionsContainer.style.display = 'block';
      } else {
        questionsContainer.style.display = 'none';
      }
    };
    
    attendanceCheckbox.addEventListener('change', toggleQuestions);
    toggleQuestions(); // Executa uma vez ao carregar

    teacherRoutineForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const studentId = parseInt(document.getElementById('routineStudentSelect').value);
      
      if (!studentId) {
        CrecheNowNotifications.showToast('Selecione um aluno.', 'warning');
        return;
      }

      // Função auxiliar para pegar o valor do radio button marcado
      const getRadio = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value || 'nao';

      const newRoutine = {
        studentId: studentId,
        teacherEmail: session.email,
        attendance: attendanceCheckbox.checked,
        questions: attendanceCheckbox.checked ? {
          behaved: getRadio('q1'),
          attention: getRadio('q2'),
          homework: getRadio('q3'),
          peers: getRadio('q4'),
          food: getRadio('q5')
        } : null,
        comment: attendanceCheckbox.checked ? document.getElementById('routineComment').value : ''
      };

      CrecheNowStorage.addRoutine(newRoutine);
      teacherRoutineForm.reset();
      attendanceCheckbox.checked = true;
      toggleQuestions();
      
      CrecheNowNotifications.showToast('Rotina registrada com sucesso!');
      CrecheNowNotifications.renderTeacherDashboard();
    });
  }

  // Envio de recado pelo professor
  const teacherMsgForm = document.getElementById('teacherMsgForm');
  if (teacherMsgForm) {
    teacherMsgForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!teacherMsgForm.checkValidity()) { 
        teacherMsgForm.classList.add('was-validated'); 
        return; 
      }

      const studentId = parseInt(document.getElementById('teacherMsgStudent').value);
      const student = CrecheNowStorage.getStudents().find(s => s.id === studentId);

      CrecheNowStorage.addMessage({
        parentName: 'Prof. ' + session.name,
        teacherEmail: session.email,
        message: document.getElementById('teacherMessage').value,
        childName: student ? student.name : 'Aluno',
        childId: studentId,
        isTeacherMessage: true // Flag para identificar que veio do professor
      });

      teacherMsgForm.reset();
      teacherMsgForm.classList.remove('was-validated');
      CrecheNowNotifications.showToast('Recado enviado ao responsavel!');
      CrecheNowNotifications.closeModal('teacherMsgModal');
    });
  }

  document.getElementById('openTeacherMsgModalBtn')?.addEventListener('click', () => {
    CrecheNowNotifications.openModal('teacherMsgModal');
  });

  // ==========================================================
  // LÓGICA DOS PAIS (dashboard-parent.html)
  // ==========================================================
  if (session?.role === 'parent') {
    // Encontra o filho do pai logado
    const student = CrecheNowStorage.getStudents().find(s => s.parentEmail === session.email) || CrecheNowStorage.getStudents()[0];
    
    if (student) {
      document.getElementById('childName').value = student.name;
      // Aqui futuramente renderizaremos a rotina específica deste aluno
    }

    document.getElementById('openMsgModalBtn')?.addEventListener('click', () => {
      CrecheNowNotifications.openModal('msgModal');
    });

    document.getElementById('openInboxModalBtn')?.addEventListener('click', () => {
      CrecheNowNotifications.renderInbox('received');
      
      // Marca todas as notificações como lidas ao abrir a caixa
      const notifs = CrecheNowStorage.getNotifications().filter(n => !n.read);
      notifs.forEach(n => CrecheNowStorage.markAsRead(n.id));
      
      CrecheNowNotifications.updateInboxBadge();
      CrecheNowNotifications.openModal('inboxModal');
    });

    // Abas da caixa de mensagens (Recebidas / Enviadas)
    document.querySelectorAll('[data-inbox-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-inbox-tab]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        CrecheNowNotifications.renderInbox(btn.dataset.inboxTab);
      });
    });

    // Alternar visualização do histórico de rotinas
    document.getElementById('toggleRoutineHistory')?.addEventListener('click', () => {
      const hist = document.getElementById('routine-history');
      hist.classList.toggle('d-none');
    });

    // Envio de recado pelo pai
    const parentMsgForm = document.getElementById('parentMsgForm');
    if (parentMsgForm) {
      parentMsgForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!parentMsgForm.checkValidity()) { 
          parentMsgForm.classList.add('was-validated'); 
          return; 
        }

        CrecheNowStorage.addMessage({
          parentName: session.name,
          parentEmail: session.email,
          message: document.getElementById('parentMessage').value,
          childName: document.getElementById('childName').value,
          childId: student ? student.id : null,
          isTeacherMessage: false
        });

        parentMsgForm.reset();
        parentMsgForm.classList.remove('was-validated');
        CrecheNowNotifications.showToast('Recado enviado para a creche!');
        CrecheNowNotifications.closeModal('msgModal');
      });
    }
    
    CrecheNowNotifications.updateInboxBadge();
  }

  // ==========================================================
  // LÓGICA GLOBAL (Todos os dashboards)
  // ==========================================================
  
  // Botão de Logout
  document.getElementById('logoutBtn')?.addEventListener('click', CrecheNowAuth.logout);

  // Filtros de comunicados (Pais)
  document.querySelectorAll('[data-filter]')?.forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      CrecheNowNotifications.renderFeed(btn.dataset.filter);
    });
  });

  // Registro do Service Worker (PWA)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(() => console.log('Service Worker registrado com sucesso.'))
      .catch(err => console.error('Falha ao registrar Service Worker:', err));
  }

  // Renderização inicial dos dashboards (se já estiver logado)
  if (window.location.pathname.includes('dashboard')) {
    CrecheNowNotifications.renderFeed();
    CrecheNowNotifications.renderAgenda();
    CrecheNowNotifications.renderCardapio();
    CrecheNowNotifications.updateInboxBadge();
    
    // Processa fila offline a cada 60 segundos
    setInterval(CrecheNowStorage.processQueue, 60000);
  }

  // Atalho de teclado para desenvolvedores: Ctrl + Shift + L limpa o localStorage
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      if (confirm('MODO TESTE: Limpar todos os dados salvos e recarregar a pagina?')) {
        localStorage.clear();
        window.location.reload();
      }
    }
    // Fecha modais ao pressionar ESC
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    }
  });
});
