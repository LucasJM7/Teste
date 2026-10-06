const CrecheNowStorage = (() => {
  const QUEUE_KEY = 'crechenow_offline_queue';
  const DEFAULT_STUDENTS = [
    { id: 1, name: 'Joao Silva', class: 'A', parentEmail: 'pai@email.com' },
    { id: 2, name: 'Maria Souza', class: 'A', parentEmail: 'mae@email.com' },
    { id: 3, name: 'Pedro Santos', class: 'B', parentEmail: 'pai2@email.com' },
    { id: 4, name: 'Ana Oliveira', class: 'B', parentEmail: 'mae2@email.com' }
  ];
  const DEFAULT_AGENDA = [
    { day: 'Seg', time: '08:00', title: 'Roda de conversa', icon: 'Musica' },
    { day: 'Ter', time: '10:30', title: 'Psicomotora', icon: 'Atividade' },
    { day: 'Qua', time: '14:00', title: 'Soneca e Historias', icon: 'Leitura' },
    { day: 'Qui', time: '09:00', title: 'Artes e pintura', icon: 'Arte' },
    { day: 'Sex', time: '15:00', title: 'Dia da Familia', icon: 'Evento' }
  ];
  const DEFAULT_CARDPIO = [
    { day: 'Seg', meal: 'Arroz, feijao, frango grelhado e salada.' },
    { day: 'Ter', meal: 'Macarrao ao sugo, carne moida e legumes.' },
    { day: 'Qua', meal: 'Arroz, lentilha, peixe assado e brocolis.' },
    { day: 'Qui', meal: 'Risoto de legumes com frango desfiado.' },
    { day: 'Sex', meal: 'Feijoada light, arroz e couve refogada.' }
  ];

  return {
    get: (key) => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
    set: (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } },
    clear: () => localStorage.clear(),
    getNotifications: () => CrecheNowStorage.get('crechenow_notifications') || [],
    addNotification: (notif) => {
      const notifs = CrecheNowStorage.getNotifications();
      notifs.unshift({ ...notif, id: Date.now(), read: false, date: new Date().toISOString() });
      CrecheNowStorage.set('crechenow_notifications', notifs);
    },
    markAsRead: (id) => {
      const notifs = CrecheNowStorage.getNotifications();
      const item = notifs.find(n => n.id === id);
      if (item) { item.read = true; CrecheNowStorage.set('crechenow_notifications', notifs); }
    },
    getMessages: () => CrecheNowStorage.get('crechenow_parent_messages') || [],
    addMessage: (msg) => {
      const msgs = CrecheNowStorage.getMessages();
      msgs.unshift({ ...msg, id: Date.now(), read: false, date: new Date().toISOString() });
      CrecheNowStorage.set('crechenow_parent_messages', msgs);
    },
    markMessageAsRead: (id) => {
      const msgs = CrecheNowStorage.getMessages();
      const item = msgs.find(m => m.id === id);
      if (item) { item.read = true; CrecheNowStorage.set('crechenow_parent_messages', msgs); }
    },
    getAgenda: () => CrecheNowStorage.get('crechenow_agenda') || DEFAULT_AGENDA,
    setAgenda: (agenda) => CrecheNowStorage.set('crechenow_agenda', agenda),
    getCardapio: () => CrecheNowStorage.get('crechenow_cardapio') || DEFAULT_CARDPIO,
    setCardapio: (cardapio) => CrecheNowStorage.set('crechenow_cardapio', cardapio),
    getStudents: () => CrecheNowStorage.get('crechenow_students') || DEFAULT_STUDENTS,
    setStudents: (students) => CrecheNowStorage.set('crechenow_students', students),
    addStudent: (student) => {
      const students = CrecheNowStorage.getStudents();
      student.id = Date.now();
      students.push(student);
      CrecheNowStorage.setStudents(students);
    },
    removeStudent: (id) => {
      let students = CrecheNowStorage.getStudents();
      students = students.filter(s => s.id !== id);
      CrecheNowStorage.setStudents(students);
    },
    updateStudentClass: (id, newClass) => {
      const students = CrecheNowStorage.getStudents();
      const student = students.find(s => s.id === id);
      if (student) { student.class = newClass; CrecheNowStorage.setStudents(students); }
    },
    getRoutines: () => CrecheNowStorage.get('crechenow_routines') || [],
    addRoutine: (routine) => {
      const routines = CrecheNowStorage.getRoutines();
      routines.unshift({ ...routine, id: Date.now(), date: new Date().toISOString() });
      CrecheNowStorage.set('crechenow_routines', routines);
    },
    getRoutinesByStudent: (studentId) => {
      return CrecheNowStorage.getRoutines().filter(r => r.studentId === studentId).sort((a,b) => new Date(b.date) - new Date(a.date));
    },
    queueAction: (action) => {
      const queue = CrecheNowStorage.get(QUEUE_KEY) || [];
      queue.push({ ...action, timestamp: Date.now() });
      CrecheNowStorage.set(QUEUE_KEY, queue);
    },
    processQueue: async () => {
      const queue = CrecheNowStorage.get(QUEUE_KEY) || [];
      if (!queue.length || !navigator.onLine) return;
      console.log('Sincronizando fila offline:', queue.length, 'acoes');
      CrecheNowStorage.set(QUEUE_KEY, []);
    }
  };
})();
