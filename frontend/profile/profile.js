// Mock task data with detail (no priority chart used)
const taskStats = {
  due: 7,
  completed: 15,
  overdue: 3,
  categories: {
    Work: 6,
    Personal: 8,
    Study: 7,
    Health: 4,
    Other: 0,
  },
};

// DOM references
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const saveBtn = document.getElementById('save-btn');
const darkModeToggle = document.getElementById('dark-mode-toggle');

const colorSchemeSelect = document.getElementById('colorScheme');
const fontSizeSelect = document.getElementById('fontSize');

// Handle dark mode toggle (click)
darkModeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');

  if (document.body.classList.contains('dark')) {
    localStorage.setItem('darkMode', 'enabled');
    darkModeToggle.textContent = '☀️';
  } else {
    localStorage.setItem('darkMode', 'disabled');
    darkModeToggle.textContent = '🌙';
  }
});

// Load saved profile data and theme from localStorage (if any)
function loadProfile() {
  const profile = JSON.parse(localStorage.getItem('userProfile'));
  if (profile) {
    nameInput.value = profile.name || '';
    emailInput.value = profile.email || '';
    phoneInput.value = profile.phone || '';
  }

  const theme = localStorage.getItem('themeSettings');
  if (theme) {
    const { colorScheme, fontSize } = JSON.parse(theme);
    applyTheme(colorScheme, fontSize);
    colorSchemeSelect.value = colorScheme;
    fontSizeSelect.value = fontSize;
  } else {
    // default
    applyTheme('blue', 'medium');
  }

  // Load dark mode setting
  if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark');
    darkModeToggle.textContent = '☀️';
  } else {
    darkModeToggle.textContent = '🌙';
  }
}

// Save profile data
saveBtn.addEventListener('click', () => {
  const profile = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    phone: phoneInput.value.trim(),
  };
  localStorage.setItem('userProfile', JSON.stringify(profile));
  alert('Profile info saved!');
});

// Theme change handlers
colorSchemeSelect.addEventListener('change', () => {
  applyTheme(colorSchemeSelect.value, fontSizeSelect.value);
  saveThemeSettings(colorSchemeSelect.value, fontSizeSelect.value);
});
fontSizeSelect.addEventListener('change', () => {
  applyTheme(colorSchemeSelect.value, fontSizeSelect.value);
  saveThemeSettings(colorSchemeSelect.value, fontSizeSelect.value);
});

function applyTheme(colorScheme, fontSize) {
  document.body.classList.remove('theme-blue', 'theme-green', 'theme-purple', 'theme-orange');
  document.body.classList.add(`theme-${colorScheme}`);

  document.body.classList.remove('font-small', 'font-medium', 'font-large');
  document.body.classList.add(`font-${fontSize}`);
}

function saveThemeSettings(colorScheme, fontSize) {
  const theme = { colorScheme, fontSize };
  localStorage.setItem('themeSettings', JSON.stringify(theme));
}

// Create Charts
function createCharts() {
  // Main Task Chart (Due, Completed, Overdue)
  const ctxMain = document.getElementById('mainTaskChart').getContext('2d');
  new Chart(ctxMain, {
    type: 'bar',
    data: {
      labels: ['Due', 'Completed', 'Overdue'],
      datasets: [{
        label: 'Number of Tasks',
        data: [taskStats.due, taskStats.completed, taskStats.overdue],
        backgroundColor: ['#3498db', '#2ecc71', '#e74c3c'],
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.6
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false }, tooltip: { enabled: true } },
      scales: {
        y: { beginAtZero: true, stepSize: 1, max: Math.max(taskStats.due, taskStats.completed, taskStats.overdue) + 2 }
      }
    }
  });

  // Category Chart
  const ctxCategory = document.getElementById('categoryChart').getContext('2d');
  new Chart(ctxCategory, {
    type: 'doughnut',
    data: {
      labels: Object.keys(taskStats.categories),
      datasets: [{
        label: 'Tasks by Category',
        data: Object.values(taskStats.categories),
        backgroundColor: ['#3498db', '#9b59b6', '#2ecc71', '#e67e22', '#95a5a6'],
        borderWidth: 0,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 14, padding: 15 } },
        tooltip: { enabled: true }
      }
    }
  });
}

// On load
window.addEventListener('DOMContentLoaded', () => {
  loadProfile();
  createCharts();
});
