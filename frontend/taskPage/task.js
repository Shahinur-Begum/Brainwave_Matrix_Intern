// ===== Navbar controls =====
const profileLink = document.getElementById('profile-link');
const calendarLink = document.getElementById('calendar-link');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const logoutLink = document.getElementById('logout-link');

profileLink.addEventListener('click', e => {
  e.preventDefault();
  window.location.href = '../profile/profile.html';
});
calendarLink.addEventListener('click', e => {
  e.preventDefault();
  window.location.href = '../calendar/calendar.html';
});

darkModeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  darkModeToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
});

logoutLink.addEventListener('click', e => {
  e.preventDefault();
  localStorage.removeItem('email');
  localStorage.removeItem('password');
  localStorage.removeItem('tasks');
  window.location.href = '../welcome/welcome.html';
});

// ===== Task Manager =====
const taskForm = document.getElementById('quick-add');
const taskInput = document.getElementById('task-input');
const dueDateInput = document.getElementById('due-date');
const prioritySelect = document.getElementById('priority');
const categorySelect = document.getElementById('category');
const recurringSelect = document.getElementById('recurring');
const taskList = document.getElementById('task-list');
const searchInput = document.getElementById('search-input');
const clearCompletedBtn = document.getElementById('clear-completed-btn');

// Summary
const totalTasksSpan = document.getElementById('total-tasks');
const doneTasksSpan = document.getElementById('done-tasks');
const overdueTasksSpan = document.getElementById('overdue-tasks');
const upcomingTasksSpan = document.getElementById('upcoming-tasks');

// Load tasks
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// Utilities
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}
function generateId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}
function formatDate(date) {
  const d = new Date(date);
  if (isNaN(d)) return null;
  return d.toISOString().split('T')[0];
}
function isOverdue(dueDate) {
  if (!dueDate) return false;
  const today = new Date();
  const due = new Date(dueDate);
  return due < new Date(today.toDateString());
}
function sortTasks(a, b) {
  if (!a.dueDate && !b.dueDate) return 0;
  if (!a.dueDate) return 1;
  if (!b.dueDate) return -1;
  return new Date(a.dueDate) - new Date(b.dueDate);
}
function autoSetPriority(dueDate) {
  if (!dueDate) return 'Chill';
  const today = new Date();
  const due = new Date(dueDate);
  const diffDays = Math.floor((due - today) / (1000*60*60*24));
  if (diffDays < 0) return 'Urgent';
  if (diffDays <= 3) return 'Important';
  return 'Chill';
}
function updateSummary() {
  const total = tasks.length;
  const doneCount = tasks.filter(t => t.done).length;
  const overdueCount = tasks.filter(t => !t.done && isOverdue(t.dueDate)).length;
  const upcomingCount = total - doneCount - overdueCount;

  totalTasksSpan.textContent = total;
  doneTasksSpan.textContent = doneCount;
  overdueTasksSpan.textContent = overdueCount;
  upcomingTasksSpan.textContent = upcomingCount;
}
function checkReminders() {
  const now = new Date();
  tasks.forEach(task => {
    if (!task.done && task.priority === 'Urgent' && task.dueDate) {
      const due = new Date(task.dueDate);
      if (due <= now) alert(`Reminder: Task "${task.desc}" is urgent and due today or overdue!`);
    }
  });
}

// Render tasks
function renderTasks() {
  const filterText = searchInput.value.trim().toLowerCase();
  tasks.sort(sortTasks);
  taskList.innerHTML = '';

  tasks.forEach(task => {
    if (filterText && !task.desc.toLowerCase().includes(filterText)) return;

    const li = document.createElement('li');
    li.classList.toggle('done', task.done);
    li.classList.toggle('overdue', !task.done && isOverdue(task.dueDate));

    const taskInfo = document.createElement('div');
    taskInfo.className = 'task-info';

    const descSpan = document.createElement('span');
    descSpan.className = 'task-desc';
    descSpan.contentEditable = !task.done;
    descSpan.spellcheck = false;
    descSpan.textContent = task.desc;
    descSpan.title = task.done ? '' : 'Click to edit';
    descSpan.addEventListener('blur', () => {
      if (!task.done) {
        const newDesc = descSpan.textContent.trim();
        if (newDesc) task.desc = newDesc;
        else alert('Task description cannot be empty!');
        saveTasks(); renderTasks();
      }
    });
    taskInfo.appendChild(descSpan);

    if (task.dueDate) {
      const dueDateSpan = document.createElement('span');
      dueDateSpan.className = 'due-date';
      dueDateSpan.textContent = `Due: ${formatDate(task.dueDate)}`;
      taskInfo.appendChild(dueDateSpan);
    }

    const prioritySpan = document.createElement('span');
    prioritySpan.className = 'priority ' + task.priority;
    prioritySpan.textContent = task.priority;
    taskInfo.appendChild(prioritySpan);

    const categorySpan = document.createElement('span');
    categorySpan.className = 'category ' + task.category;
    categorySpan.textContent = task.category;
    taskInfo.appendChild(categorySpan);

    if (task.recurring && task.recurring !== 'none') {
      const recurringSpan = document.createElement('span');
      recurringSpan.className = 'recurring';
      recurringSpan.textContent = `(${task.recurring})`;
      taskInfo.appendChild(recurringSpan);
    }

    li.appendChild(taskInfo);

    const btnContainer = document.createElement('div');

    if (!task.done) {
      const doneBtn = document.createElement('button');
      doneBtn.className = 'done-btn';
      doneBtn.textContent = 'Done';
      doneBtn.onclick = () => markDone(task.id);
      btnContainer.appendChild(doneBtn);
    }

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.textContent = 'Delete';
    delBtn.onclick = () => deleteTask(task.id);
    btnContainer.appendChild(delBtn);

    li.appendChild(btnContainer);
    taskList.appendChild(li);
  });

  updateSummary();
  saveTasks();
}

// Actions
function markDone(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.done = true;

  if (task.recurring && task.recurring !== 'none' && task.dueDate) {
    let nextDue = new Date(task.dueDate);
    if (task.recurring === 'daily') nextDue.setDate(nextDue.getDate()+1);
    if (task.recurring === 'weekly') nextDue.setDate(nextDue.getDate()+7);
    if (task.recurring === 'monthly') nextDue.setMonth(nextDue.getMonth()+1);

    tasks.push({
      id: generateId(),
      desc: task.desc,
      dueDate: formatDate(nextDue),
      priority: autoSetPriority(formatDate(nextDue)),
      category: task.category,
      recurring: task.recurring,
      done: false,
    });
  }
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  renderTasks();
}

// Event listeners
clearCompletedBtn.addEventListener('click', () => {
  tasks = tasks.filter(t => !t.done);
  renderTasks();
});

searchInput.addEventListener('input', renderTasks);

taskForm.addEventListener('submit', e => {
  e.preventDefault();
  const desc = taskInput.value.trim();
  if (!desc) return alert('Please enter a task description');

  const dueDateVal = dueDateInput.value || null;
  let priority = prioritySelect.value;
  const category = categorySelect.value || 'General';
  const recurring = recurringSelect.value || 'none';

  if (!priority || priority === '') priority = dueDateVal ? autoSetPriority(dueDateVal) : null;

  tasks.push({
    id: generateId(),
    desc,
    dueDate: dueDateVal,
    priority,
    category,
    recurring,
    done: false
  });

  taskInput.value = '';
  dueDateInput.value = '';
  prioritySelect.value = '';
  categorySelect.value = 'General';
  recurringSelect.value = 'none';

  renderTasks();
  checkReminders();
});

// Initial render
renderTasks();
