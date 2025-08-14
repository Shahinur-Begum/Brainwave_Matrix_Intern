// --- Navigation ---
const darkModeToggle = document.getElementById('dark-mode-toggle');
const logoutLink = document.getElementById('logout-link');
const tasksLink = document.getElementById('tasks-link');

// --- Calendar Elements ---
const calendarGrid = document.getElementById("calendarGrid");
const monthYear = document.getElementById("monthYear");
const prevMonthBtn = document.getElementById("prev-month");
const nextMonthBtn = document.getElementById("next-month");

const selectedDateSpan = document.getElementById("selectedDate");
const tasksList = document.getElementById("tasksList");
const taskInputContainer = document.getElementById("taskInputContainer");
const newTaskInput = document.getElementById("newTaskInput");
const addTaskBtn = document.getElementById("addTaskBtn");

let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
let selectedDate = null;

// --- Tasks Storage ---
let tasks = [];

// Load tasks from localStorage (only those with dueDate)
function loadTasks() {
  const saved = localStorage.getItem('tasks');
  tasks = saved ? JSON.parse(saved).filter(t => t.dueDate) : [];
}

// Save tasks
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Tasks for a specific date
function getTasksForDate(date) {
  return tasks.filter(task => task.dueDate === date);
}

// Add task
function addTask(date, text) {
  tasks.push({ id: '_' + Math.random().toString(36).substr(2,9), desc: text, dueDate: date });
  saveTasks();
  renderTasksForDate(date);
  renderCalendar(currentMonth, currentYear);
}

// Delete task
function deleteTask(date, id) {
  tasks = tasks.filter(t => !(t.dueDate === date && t.id === id));
  saveTasks();
  renderTasksForDate(date);
  renderCalendar(currentMonth, currentYear);
}

// --- Calendar ---
const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function renderCalendar(month, year) {
  calendarGrid.innerHTML = "";
  monthYear.textContent = `${months[month]} ${year}`;

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const totalCells = 42;
  let dateNum = 1;

  for (let i=0;i<totalCells;i++){
    const cell = document.createElement("div");

    if(i<firstDayIndex || dateNum>daysInMonth){
      cell.classList.add("inactive");
      cell.textContent="";
    }else{
      cell.textContent=dateNum;
      const fullDate=`${year}-${String(month+1).padStart(2,'0')}-${String(dateNum).padStart(2,'0')}`;

      const today = new Date();
      if(dateNum===today.getDate() && month===today.getMonth() && year===today.getFullYear()){
        cell.classList.add("today");
      }

      if(getTasksForDate(fullDate).length>0) cell.classList.add("has-task");

      if(selectedDate===fullDate) cell.classList.add("selected");

      cell.addEventListener("click",()=>{
        selectedDate=fullDate;
        selectedDateSpan.textContent=fullDate;
        renderTasksForDate(fullDate);
        taskInputContainer.style.display="flex";
        newTaskInput.focus();
        renderCalendar(currentMonth,currentYear);
      });

      dateNum++;
    }

    calendarGrid.appendChild(cell);
  }
}

// --- Tasks Rendering ---
function renderTasksForDate(date){
  tasksList.innerHTML="";
  const dailyTasks=getTasksForDate(date);
  if(dailyTasks.length===0){
    tasksList.innerHTML='<p class="no-tasks">No tasks for this date.</p>';
    return;
  }

  dailyTasks.forEach(task=>{
    const taskDiv=document.createElement("div");
    taskDiv.classList.add("task-item");
    taskDiv.textContent=task.desc;

    const delBtn=document.createElement("button");
    delBtn.textContent="Delete";
    delBtn.addEventListener("click",()=>deleteTask(date,task.id));

    taskDiv.appendChild(delBtn);
    tasksList.appendChild(taskDiv);
  });
}

// --- Event Listeners ---
darkModeToggle.addEventListener("click",()=>{
  document.body.classList.toggle("dark");
  darkModeToggle.textContent=document.body.classList.contains("dark")?"☀️":"🌙";
});

logoutLink.addEventListener("click",e=>{
  e.preventDefault();
  localStorage.removeItem("email");
  localStorage.removeItem("password");
  localStorage.removeItem("tasks");
  window.location.href="../welcome/welcome.html";
});

tasksLink.addEventListener("click",e=>{
  e.preventDefault();
  window.location.href="../taskPage/task.html";
});

prevMonthBtn.addEventListener("click",()=>{
  currentMonth--;
  if(currentMonth<0){currentMonth=11;currentYear--;}
  renderCalendar(currentMonth,currentYear);
});

nextMonthBtn.addEventListener("click",()=>{
  currentMonth++;
  if(currentMonth>11){currentMonth=0;currentYear++;}
  renderCalendar(currentMonth,currentYear);
});

addTaskBtn.addEventListener("click",()=>{
  const text=newTaskInput.value.trim();
  if(!selectedDate){alert("Please select a date first."); return;}
  if(!text){alert("Please enter a task."); return;}
  addTask(selectedDate,text);
  newTaskInput.value="";
});

// --- Initialize ---
loadTasks();
renderCalendar(currentMonth,currentYear);
