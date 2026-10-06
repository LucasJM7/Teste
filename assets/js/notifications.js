/* ============================================================
   MÓDULO DE NOTIFICAÇÕES E UI - CrecheNow
   Responsável por: Renderizar dados no DOM, controlar modais,
   exibir toasts e atualizar badges de notificação.
   ============================================================ */

const CrecheNowNotifications = (() => {
  
  // --- FUNÇÕES UTILITÁRIAS DE UI ---
  
  // Abre um modal adicionando a classe 'active'
  const openModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  };

  // Fecha um modal removendo a classe 'active'
  const closeModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  };

  // Exibe uma mensagem temporária (toast) no canto da tela
  const showToast = (message, type = 'success') => {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toastId = 'toast-' + Date.now();
    const bgClass = type === 'danger' ? 'bg-danger text-white' : (type === 'warning' ? 'bg-warning text-dark' : 'bg-success text-white');
    
    const toastHtml = `
      <div id="${toastId}" class="toast align-items-center ${bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">${message}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fechar"></button>
        </div>
      </div>
    `;
    
    container.insertAdjacentHTML('beforeend', toastHtml);
    const toastElement = document.getElementById(toastId);
    const bsToast = new bootstrap.Toast(toastElement, { delay: 3000 });
    bsToast.show();
    
    // Remove o elemento do DOM após ser escondido
    toastElement.addEventListener('hidden.bs.toast', () => toastElement.remove());
  };

  // --- RENDERIZAÇÃO ESPECÍFICA POR TELA ---

  // Renderiza o carrossel de comunicados (Pais)
  const renderFeed = (filter = 'todos') => {
    const container = document.getElementById('notificationsFeed');
    if (!container) return;

    let notifs = CrecheNowStorage.getNotifications();
    if (filter !== 'todos') {
      notifs = notifs.filter(n => n.type === filter);
    }

    if (notifs.length === 0) {
      container.innerHTML = '<p class="text-muted text-center p-4">Nenhum comunicado encontrado.</p>';
      return;
    }

    // Gera o HTML de cada item do carrossel
    container.innerHTML = notifs.map((n, index) => `
      <div class="carousel-item ${index === 0 ? 'active' : ''}">
        <div class="notify-card ${n.read ? '' : 'unread'}" data-type="${n.type}">
          <h5 class="fw-bold">${n.title}</h5>
          <p class="mb-1">${n.body}</p>
          <small class="text-muted">${new Date(n.date).toLocaleDateString('pt-BR')} as ${new Date(n.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</small>
        </div>
      </div>
    `).join('');
  };

  // Renderiza a agenda semanal (Pais/Secretaria)
  const renderAgenda = () => {
    const container = document.getElementById('agendaContainer');
    if (!container) return;
    const agenda = CrecheNowStorage.getAgenda();
    
    container.innerHTML = agenda.map(item => `
      <div class="agenda-card d-flex justify-content-between align-items-center">
        <div>
          <strong>${item.day}</strong> - ${item.time}
          <div class="text-muted small">${item.title}</div>
        </div>
        <span class="badge bg-primary">${item.icon}</span>
      </div>
    `).join('');
  };

  // Renderiza o cardápio semanal (Pais/Secretaria)
  const renderCardapio = () => {
    const container = document.getElementById('cardapioContainer');
    if (!container) return;
    const cardapio = CrecheNowStorage.getCardapio();
    
    container.innerHTML = cardapio.map(item => `
      <div class="cardapio-item d-flex justify-content-between align-items-center">
        <div>
          <strong>${item.day}</strong>
          <div class="text-muted small">${item.meal}</div>
        </div>
      </div>
    `).join('');
  };

  // Renderiza histórico de comunicados enviados (Secretaria)
  const renderSent = () => {
    const tbody = document.getElementById('sentNotificationsList');
    if (!tbody) return;
    const notifs = CrecheNowStorage.getNotifications();

    if (notifs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Nenhum comunicado enviado.</td></tr>';
      return;
    }

    tbody.innerHTML = notifs.map(n => `
      <tr>
        <td>${n.title}</td>
        <td><span class="badge bg-secondary">${n.type}</span></td>
        <td>${new Date(n.date).toLocaleString('pt-BR')}</td>
      </tr>
    `).join('');
  };

  // Renderiza gestão de alunos (Secretaria)
  const renderStudentManagement = () => {
    const tbody = document.getElementById('studentsList');
    if (!tbody) return;
    const students = CrecheNowStorage.getStudents();

    tbody.innerHTML = students.map(s => `
      <tr>
        <td>${s.name}</td>
        <td>Turma ${s.class}</td>
        <td>
          <button class="btn btn-sm btn-outline-danger" onclick="CrecheNowStorage.removeStudent(${s.id}); CrecheNowNotifications.renderStudentManagement();">Remover</button>
        </td>
      </tr>
    `).join('');
  };

  // Renderiza o dashboard do professor (lista de alunos e últimos registros)
  const renderTeacherDashboard = () => {
    const session = CrecheNowStorage.get('session');
    if (!session || session.role !== 'teacher') return;

    // Filtra alunos da turma do professor
    const myStudents = CrecheNowStorage.getStudents().filter(s => s.class === session.class);
    
    // Atualiza select do formulário de rotina
    const select = document.getElementById('routineStudentSelect');
    if (select) {
      select.innerHTML = '<option value="">Escolha um aluno...</option>' + 
        myStudents.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    }

    // Atualiza select do modal de recado
    const msgSelect = document.getElementById('teacherMsgStudent');
    if (msgSelect) {
      msgSelect.innerHTML = '<option value="">Escolha um aluno...</option>' + 
        myStudents.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    }

    // Renderiza tabela lateral de alunos
    const tbody = document.getElementById('teacherStudentsList');
    if (tbody) {
      tbody.innerHTML = myStudents.map(s => `
        <tr>
          <td>${s.name}</td>
          <td><span class="badge bg-success">Registrado</span></td>
        </tr>
      `).join('');
    }
  };

  // Renderiza a caixa de mensagens (Pais)
  const renderInbox = (tab) => {
    const container = document.getElementById('inbox-content');
    if (!container) return;
    const session = CrecheNowStorage.get('session');
    const msgs = CrecheNowStorage.getMessages();

    let filteredMsgs = [];
    if (tab === 'received') {
      // Mensagens enviadas pela escola/professor para este pai
      filteredMsgs = msgs.filter(m => m.parentEmail === session.email && m.isTeacherMessage);
    } else {
      // Mensagens enviadas por este pai
      filteredMsgs = msgs.filter(m => m.parentEmail === session.email && !m.isTeacherMessage);
    }

    if (filteredMsgs.length === 0) {
      container.innerHTML = '<p class="text-muted text-center p-3">Nenhuma mensagem.</p>';
      return;
    }

    container.innerHTML = filteredMsgs.map(m => `
      <div class="message-item ${m.read ? '' : 'unread'} ${m.isTeacherMessage ? '' : 'sent'}">
        <div class="msg-header">
          <strong>${m.isTeacherMessage ? 'Da Escola' : 'Para a Escola'}</strong>
          <span>${new Date(m.date).toLocaleDateString('pt-BR')}</span>
        </div>
        <div class="msg-body">${m.message}</div>
        <div class="text-muted small mt-1">Referente a: ${m.childName}</div>
      </div>
    `).join('');
  };

  // Renderiza recados dos pais para a secretaria ver
  const renderParentMessagesForStaff = () => {
    const container = document.getElementById('parentMsgsContent');
    if (!container) return;
    const msgs = CrecheNowStorage.getMessages().filter(m => !m.isTeacherMessage);

    if (msgs.length === 0) {
      container.innerHTML = '<p class="text-muted text-center p-3">Nenhum recado recebido.</p>';
      return;
    }

    container.innerHTML = msgs.map(m => `
      <div class="message-item ${m.read ? '' : 'unread'}">
        <div class="msg-header">
          <strong>De: ${m.parentName}</strong>
          <span>${new Date(m.date).toLocaleDateString('pt-BR')}</span>
        </div>
        <div class="msg-body">${m.message}</div>
        <div class="text-muted small mt-1">Aluno: ${m.childName}</div>
      </div>
    `).join('');
  };

  // Atualiza o badge (bolinha vermelha) de mensagens não lidas
  const updateInboxBadge = () => {
    const session = CrecheNowStorage.get('session');
    if (!session) return;
    
    const msgs = CrecheNowStorage.getMessages();
    let unreadCount = 0;
    
    if (session.role === 'parent') {
      unreadCount = msgs.filter(m => m.parentEmail === session.email && m.isTeacherMessage && !m.read).length;
    } else if (session.role === 'secretary') {
      unreadCount = msgs.filter(m => !m.isTeacherMessage && !m.read).length;
    }

    const badge = document.getElementById('inboxBadge') || document.getElementById('parentMsgsBadge');
    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.classList.remove('d-none');
      } else {
        badge.classList.add('d-none');
      }
    }
  };

  // Inicializa os listeners de fechamento de modais (clique no X ou fora do modal)
  const initModalHandlers = () => {
    // Fecha modal ao clicar no botão com data-close-modal
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-overlay');
        if (modal) modal.classList.remove('active');
      });
    });

    // Fecha modal ao clicar no fundo escuro (overlay)
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });
  };

  // Simula sincronização em tempo real (recarrega dados periodicamente)
  const initRealTimeSync = () => {
    setInterval(() => {
      if (window.location.pathname.includes('dashboard')) {
        renderFeed();
        renderAgenda();
        renderCardapio();
        updateInboxBadge();
      }
    }, 10000); // A cada 10 segundos
  };

  // Exporta as funções públicas
  return {
    openModal,
    closeModal,
    showToast,
    renderFeed,
    renderAgenda,
    renderCardapio,
    renderSent,
    renderStudentManagement,
    renderTeacherDashboard,
    renderInbox,
    renderParentMessagesForStaff,
    updateInboxBadge,
    initModalHandlers,
    initRealTimeSync
  };
})();
