const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const prioritySelect = document.getElementById('priority-select');
const categorySelect = document.getElementById('category-select');
const customCategoryInput = document.getElementById('custom-category');
const taskList = document.getElementById('task-list');
const progressCount = document.getElementById('progress-count');
const progressTotal = document.getElementById('progress-total');
const manageBtn = document.getElementById('manage-categories-btn');
const modal = document.getElementById('category-manager');
const closeModal = document.getElementById('close-category-manager');
const customList = document.getElementById('custom-category-list');
const exportBtn = document.getElementById('export-btn');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function updateProgress() {
  const total = tasks.length;
  const done = tasks.filter(task => task.completed).length;
  progressCount.textContent = done;
  progressTotal.textContent = total;
}

function renderTasks() {
  taskList.innerHTML = '';
  tasks.forEach((task, index) => {
    const taskDiv = document.createElement('div');
    taskDiv.className = `task ${task.priority} ${task.completed ? 'done' : ''}`;
    taskDiv.draggable = true;
    taskDiv.dataset.index = index;

    taskDiv.innerHTML = `
    <div class="info">
        <div>${task.text}</div>
        <div class="category">${task.category || ''}</div>
    </div>
    <div class="actions">
        <button class="complete-btn">${task.completed ? 'Undo' : 'Done'}</button>
        <button class="delete-btn">Delete</button>
    </div>
    `;

    taskDiv.querySelector('.complete-btn').onclick = () => {
      task.completed = !task.completed;
      saveTasks();
      renderTasks();
    };

    taskDiv.querySelector('.delete-btn').onclick = () => {
        if (confirm('Delete this task?')) {
          tasks.splice(index, 1);
          saveTasks();
          renderTasks();
        }
      };    

    taskDiv.addEventListener('dragstart', () => {
      taskDiv.classList.add('dragging');
    });

    taskDiv.addEventListener('dragend', () => {
      taskDiv.classList.remove('dragging');
    });

    taskList.appendChild(taskDiv);
  });

  addDragDropHandlers();
  updateProgress();
}

function addDragDropHandlers() {
  let draggingElem;

  taskList.addEventListener('dragstart', e => {
    if (e.target.classList.contains('task')) {
      draggingElem = e.target;
    }
  });

  taskList.addEventListener('dragover', e => {
    e.preventDefault();
    const afterElement = getDragAfterElement(taskList, e.clientY);
    if (afterElement == null) {
      taskList.appendChild(draggingElem);
    } else {
      taskList.insertBefore(draggingElem, afterElement);
    }
  });

  taskList.addEventListener('dragend', () => {
    const newTasks = [];
    document.querySelectorAll('.task').forEach(taskEl => {
      newTasks.push(tasks[taskEl.dataset.index]);
    });
    tasks = newTasks;
    saveTasks();
    renderTasks();
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.task:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

taskForm.addEventListener('submit', e => {
  e.preventDefault();

  let category = '';
  if (categorySelect.value === '__custom__') {
    category = customCategoryInput.value.trim();
    if (category && !customCategories.includes(category)) {
      customCategories.push(category);
      localStorage.setItem('customCategories', JSON.stringify(customCategories));
      updateCategoryDropdown();
    }
  } else {
    category = categorySelect.value;
  }

  const newTask = {
    text: taskInput.value,
    priority: prioritySelect.value,
    category: category,
    completed: false
  };

  tasks.push(newTask);
  saveTasks();
  renderTasks();

  taskForm.reset();
  customCategoryInput.style.display = 'none';

});

let customCategories = JSON.parse(localStorage.getItem('customCategories')) || [];

function updateCategoryDropdown() {
  const customOptions = [...categorySelect.querySelectorAll('.custom-option')];
  customOptions.forEach(opt => opt.remove());

  const customIndex = [...categorySelect.options].findIndex(opt => opt.value === '__custom__');
  customCategories.forEach(cat => {
    const option = document.createElement('option');
    option.textContent = cat;
    option.value = cat;
    option.classList.add('custom-option');
    categorySelect.insertBefore(option, categorySelect.options[customIndex]);
  });
}

categorySelect.addEventListener('change', () => {
    if (categorySelect.value === '__custom__') {
      customCategoryInput.style.display = 'inline-block';
    } else {
      customCategoryInput.style.display = 'none';
    }
  });

  manageBtn.addEventListener('click', () => {
    renderCustomCategoryList();
    modal.style.display = 'flex';
  });
  
  closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  function renderCustomCategoryList() {
    customList.innerHTML = '';
    if (customCategories.length === 0) {
      customList.innerHTML = '<li>No custom categories</li>';
      return;
    }
  
    customCategories.forEach((cat, index) => {
      const li = document.createElement('li');
      li.innerHTML = `
        ${cat}
        <button onclick="deleteCustomCategory(${index})">Delete</button>
      `;
      customList.appendChild(li);
    });
  }
  
  window.deleteCustomCategory = function(index) {
    if (!confirm(`Delete category "${customCategories[index]}"?`)) return;
  
    const removed = customCategories.splice(index, 1);
    localStorage.setItem('customCategories', JSON.stringify(customCategories));
    updateCategoryDropdown();
    renderCustomCategoryList();
  
    // If deleted category was selected, clear it
    if (categorySelect.value === removed[0]) {
      categorySelect.value = '';
      customCategoryInput.style.display = 'none';
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    const exportBtn = document.getElementById('export-btn');
  
    exportBtn.addEventListener('click', () => {
      if (tasks.length === 0) {
        alert("No tasks to export.");
        return;
      }
  
      const worksheetData = tasks.map((task, i) => ({
        '#': i + 1,
        Task: task.text,
        Priority: task.priority,
        Category: task.category,
        Completed: task.completed ? 'Yes' : 'No'
      }));
  
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Tasks");
  
      XLSX.writeFile(workbook, "tasks.xlsx");
    });
  });
  
  
  

renderTasks();
updateCategoryDropdown();
