/* ============================================================
   MODULO DE ORQUESTRACAO - CrecheNow
   Caminhos relativos para GitHub Pages
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  CrecheNowAuth.init();
  CrecheNowAuth.checkSession();

  if (typeof CrecheNowNotifications !== 'undefined') {
    CrecheNowNotifications.initRealTimeSync();
    CrecheNowNotifications.initModalHandlers();
  }

  const session = CrecheNowStorage.get('session');
  if (session) {
    const nameDisplay = document.getElementById('userNameDisplay') || document.getElementById('teacherInfo');
    if (nameDisplay) {
      nameDisplay.textContent = session.name + (session.class ? ` (Turma ${session.class})` : '');
    }
  }

  // LOGIN
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!loginForm.checkValidity()) { loginForm.classList.add('was-validated'); return; }

      const email = document.getElementById('email').value;
      const senha = document.getElementById('senha').value;
      const lgpd = document.getElementById('lgpdConsent').checked;

      const res = CrecheNowAuth.login(email, senha, lgpd);

      if (res.success) {
        const newSession = CrecheNowStorage.get('session');
        const roleMap = {
          'parent': './pages/dashboard-parent.html',
          'secretary': './pages/dashboard-staff.html',
          'teacher': './pages/dashboard-teacher.html'
        };
        window.location.href = roleMap[newSession.role];
      } else {
        CrecheNowNotifications.showToast(res.msg, 'danger');
      }
    });

    document.getElementById('demoAccess')?.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('email').value = 'pai@email.com';
      document.getElementById('senha').value = '123456';
      document.getElementById('lgpdConsent').checked = true;
    });
  }

  // SECRETARIA
  const staffForm = document.getElementById('staffForm');
  if (staffForm) {
    const notifyDateInput = document.getElementById('notifyDate');
    const notifyTimeInput = document.getElementById('notifyTime');
    if (notifyDateInput && notifyTimeInput) {
      const now = new Date();
      notifyDateInput.value = now.toISOString().split('T')[0];
      notifyTimeInput.value = now.toTimeString().slice(0, 5);
    }

    staffForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!staffForm.checkValidity()) { staffForm.classList.add('was-validated'); return; }

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

      const now = new Date();
      notifyDateInput.value = now.toISOString().split('T')[0];
      notifyTimeInput.value = now.toTimeString().slice(0, 5);

      CrecheNowNotifications.showToast('Comunicado enviado com sucesso!');
      CrecheNowNotifications.renderSent();
    });

    CrecheNowNotifications.renderStudentManagement();
  }

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

  document.getElementById('openParentMsgsBtn')?.addEventListener('click', () => {
    CrecheNowNotifications.renderParentMessagesForStaff();
    CrecheNowNotifications.openModal('parentMsgsModal');
  });

  // PROFESSOR
  const teacherRoutineForm = document.getElementById('teacherRoutineForm');
  if (teacherRoutineForm) {
    CrecheNowNotifications.renderTeacherDashboard();

    const attendanceCheckbox = document.getElementById('routineAttendance');
    const questionsContainer = document.getElementById('routineQuestionsContainer');

    const toggleQuestions = () => {
      questionsContainer.style.display = attendanceCheckbox.checked ? 'block' : 'none';
    };

    attendanceCheckbox.addEventListener('change', toggleQuestions);
    toggleQuestions();

    teacherRoutineForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const studentId = parseInt(document.getElementById('routineStudentSelect').value);

      if (!studentId) {
        CrecheNowNotifications.showToast('Selecione um aluno.', 'warning');
        return;
      }

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

  const teacherMsgForm = document.getElementById('teacherMsgForm');
  if (teacherMsgForm) {
    teacherMsgForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!teacherMsgForm.checkValidity()) { teacherMsgForm.classList.add('was-validated'); return; }

      const studentId = parseInt(document.getElementById('teacherMsgStudent').value);
      const student = CrecheNowStorage.getStudents().find(s => s.id === studentId);

      CrecheNowStorage.addMessage({
        parentName: 'Prof. ' + session.name,
        teacherEmail: session.email,
        message: document.getElementById('teacherMessage').value,
        childName: student ? student.name : 'Aluno',
        childId: studentId,
        isTeacherMessage: true
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

  // PAIS
  if (session?.role === 'parent') {
    const student = CrecheNowStorage.getStudents().find(s => s.parentEmail === session.email) || CrecheNowStorage.getStudents()[0];

    if (student) {
      document.getElementById('childName').value = student.name;
    }

    document.getElementById('openMsgModalBtn')?.addEventListener('click', () => {
      CrecheNowNotifications.openModal('msgModal');
    });

    document.getElementById('openInboxModalBtn')?.addEventListener('click', () => {
      CrecheNowNotifications.renderInbox('received');

      const notifs = CrecheNowStorage.getNotifications().filter(n => !n.read);
      notifs.forEach(n => CrecheNowStorage.markAsRead(n.id));

      CrecheNowNotifications.updateInboxBadge();
      CrecheNowNotifications.openModal('inboxModal');
    });

    document.querySelectorAll('[data-inbox-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-inbox-tab]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        CrecheNowNotifications.renderInbox(btn.dataset.inboxTab);
      });
    });

    document.getElementById('toggleRoutineHistory')?.addEventListener('click', () => {
      document.getElementById('routine-history').classList.toggle('d-none');
    });

    const parentMsgForm = document.getElementById('parentMsgForm');
    if (parentMsgForm) {
      parentMsgForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!parentMsgForm.checkValidity()) { parentMsgForm.classList.add('was-validated'); return; }

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

  // GLOBAL
  document.getElementById('logoutBtn')?.addEventListener('click', CrecheNowAuth.logout);

  document.querySelectorAll('[data-filter]')?.forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      CrecheNowNotifications.renderFeed(btn.dataset.filter);
    });
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
      .then(() => console.log('Service Worker registrado com sucesso.'))
      .catch(err => console.error('Falha ao registrar Service Worker:', err));
  }

  if (window.location.pathname.includes('dashboard')) {
    CrecheNowNotifications.renderFeed();
    CrecheNowNotifications.renderAgenda();
    CrecheNowNotifications.renderCardapio();
    CrecheNowNotifications.updateInboxBadge();
    setInterval(CrecheNowStorage.processQueue, 60000);
  }

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      if (confirm('MODO TESTE: Limpar todos os dados salvos e recarregar a pagina?')) {
        localStorage.clear();
        window.location.reload();
      }
    }
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    }
  });
});
