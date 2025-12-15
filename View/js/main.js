// Welocme page (index)

function initIndex() {
  qs('#btn-login')?.addEventListener('click', () => location.href = 'login.html');
  qs('#btn-signup')?.addEventListener('click', () => location.href = 'signup.html');
}


const signUpForm = document.getElementById('signup-form');
const loginForm = document.getElementById("login-form");

//signup page create new user
if (signUpForm) {
  signUpForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const userData = {
      name: signUpForm.name.value,
      email: signUpForm.email.value,
      pass: signUpForm.pass.value,
    };

    fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    })

      .then(response => response.json())
      .then(data => {
        document.getElementById("su-message").textContent = data.message;
        signUpForm.reset();

      });
  });
}

//login page 
if (loginForm) {

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const loginData = {
      email: loginForm.querySelector("#login-email").value,
      pass: loginForm.querySelector("#login-pass").value,
    };

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('username', data.name);
        if (data.userId) {
          localStorage.setItem('userId', data.userId);
        } else {
          // 💡 إذا ظهر هذا الخطأ في الكونسول، فالمشكلة في الكنترولر (الخطوة 2)
          console.error("User ID missing in server response data after successful login!");
        }
        window.location.href = "homePage.html";
      } else {

        loginMsg.textContent = data.message;
      }
    } catch (error) {
      loginMsg.textContent = "Error connecting to server.";
      console.error(error);
    }
  });
}

// add user name in home page 

document.addEventListener('DOMContentLoaded', () => {
  const isProtectedPage = document.body.classList.contains('home-page') ||
                          document.body.classList.contains('tasks-page') ||
                          document.body.classList.contains('courses-page') ||
                          document.body.classList.contains('course-details-page') ||
                          document.body.classList.contains('friends-page') ||
                          document.body.classList.contains('groups-page') ||
                          document.body.classList.contains('profile-page');

  if (!isProtectedPage) return; // لا تفعل شيء في الصفحات غير المحمية

  const userName = localStorage.getItem('username');
  if (!userName) {
    window.location.href = 'login.html';
    return;
  }

  const home = document.getElementById("homeUserName");
  const side = document.getElementById("sidebarUserName");

  if (home) home.textContent = userName || "User";
  if (side) side.textContent = userName || "User";
});

//create tasks

document.addEventListener("DOMContentLoaded", () => {

  // --- عناصر المودال الأساسية (لإظهار/إخفاء الفورم) ---
  const modal = document.getElementById("taskModal");
  const openBtn = document.getElementById("openFormBtn");
  const closeBtn = document.getElementById("closeFormBtn");

  if (openBtn) {
    openBtn.addEventListener("click", () => modal.style.display = "flex");
    closeBtn.addEventListener("click", () => modal.style.display = "none");
    window.addEventListener("click", (e) => {
      if (e.target === modal) modal.style.display = "none";
    });
  }
  if (document.querySelector('.tasks-page')) {
    fetchAndRenderTasks();
  }
  // --- 🔑 ربط زر "Add" بإرسال المهمة (المعالجة المفقودة) ---
  const addTaskBtn = document.getElementById('addTaskBtn');
  const taskNameInput = document.getElementById('taskName');
  const taskDateInput = document.getElementById('taskDate');


  if (addTaskBtn) {
    // إضافة مستمع حدث عند النقر على زر "Add"
    addTaskBtn.addEventListener('click', async () => {
      const currentUserId = localStorage.getItem('userId');
      const taskData = {
        title: taskNameInput.value,
        dueDate: taskDateInput.value || new Date().toISOString().slice(0, 10),
        userId: currentUserId // يتم إرسال الـ ID المخزن محلياً
      };

      // تحقق من البيانات (ضروري)
      if (!taskData.title) {
        alert("Please enter a task name.");
        return;
      }
      if (!taskData.userId) {
        alert("You must be logged in. Please log in again.");
        console.error("Task creation failed: User ID is missing in localStorage.");
        return;
      }

      try {
        // إرسال طلب POST إلى الكنترولر
        const response = await fetch('/api/tasks', { // تأكد من أن هذا هو المسار الصحيح
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData)
        });

        const data = await response.json();

        if (response.ok) {
          alert(`Task added successfully: ${data.message}`);
          // 1. تنظيف الحقول وإغلاق المودال
          taskNameInput.value = '';
          taskDateInput.value = '';
          modal.style.display = "none";

          await fetchAndRenderTasks();
        } else {
          alert(`Failed to add task: ${data.message} (Status: ${response.status})`);
          console.error("Server Error Response:", data);
        }

      } catch (error) {
        console.error("Fetch error (Network/CORS):", error);
        alert("Could not connect to the server or API path is wrong.");
      }
    });
  }

});

function createTaskElement(task) {
  // هذه الدالة تنشئ العنصر HTML لكل مهمة
  const taskDiv = document.createElement('div');
  taskDiv.className = 'task-item';
  taskDiv.setAttribute('data-task-id', task._id);

  taskDiv.innerHTML = `
    <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTaskStatus('${task._id}', this.checked)">
    <span class="task-title ${task.completed ? 'completed' : ''}">${task.title}</span>
    <span class="task-date">${task.dueDate || 'N/A'}</span>
`;
  return taskDiv;
}

function renderTasks(tasks) {
  const pendingList = document.getElementById('pendingList');
  const completedList = document.getElementById('completedList');

  // تنظيف القوائم
  pendingList.innerHTML = '';
  completedList.innerHTML = '';

  let pendingCount = 0;
  let completedCount = 0;

  tasks.forEach(task => {
    const taskElement = createTaskElement(task);
    if (task.completed) {
      completedList.appendChild(taskElement);
      completedCount++;
    } else {
      pendingList.appendChild(taskElement);
      pendingCount++;
    }
  });

  // تحديث الإحصائيات (في tasks.html)
  document.getElementById('totalCount').textContent = tasks.length;
  document.getElementById('pendingCount').textContent = pendingCount;
  document.getElementById('completedCount').textContent = completedCount;
}

// دالة جلب المهام من الخادم ورسمها
async function fetchAndRenderTasks() {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    location.href = "login.html";
    return;
  }

  console.log("Fetching tasks for userId:", userId);

  try {
    // نرسل userId كـ query parameter
    const response = await fetch(`/api/tasks?userId=${userId}`);
    const data = await response.json();

    console.log("Tasks API response:", response.status, data);

    if (response.ok && data.success) {
      console.log("Rendering tasks:", data.tasks);
      renderTasks(data.tasks); // عرض المهام
    } else {
      console.error("Failed to fetch tasks:", data.message);
    }

  } catch (error) {
    console.error("Network error fetching tasks:", error);
  }
}


// دالة لمعالجة تحديث حالة المهمة
async function toggleTaskStatus(taskId, isCompleted) {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    alert("You must be logged in to update task status.");
    return;
  }

  try {
    // نرسل طلب PUT إلى مسار التحديث الجديد
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userId,
        completed: isCompleted // الحالة الجديدة (True/False)
      })
    });

    if (response.ok) {
      // إذا نجح التحديث، نُعيد عرض المهام لتحديث مكان المهمة
      await fetchAndRenderTasks();
    } else {
      const data = await response.json();
      alert(`Failed to update task: ${data.message}`);
    }
  } catch (error) {
    console.error("Network error during task update:", error);
    alert("Could not connect to the server to update the task.");
  }
}

// ----------------------------------------------------
// منطق الكورسات (Courses Logic)
// ----------------------------------------------------
function getCourseIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

async function loadCourseDetails() {
  const courseTitleElement = document.getElementById('courseTitle'); // السطر المهم
  const courseId = getCourseIdFromUrl();
  const userId = localStorage.getItem('userId');

  if (!courseTitleElement) {
    console.error("Error: Element with ID 'courseTitle' not found in HTML.");
    return;
  }
  if (!courseId || !userId) {
    courseTitleElement.textContent = "Error: Course ID or User not found.";
    return;
  }
  console.log("✅ IDs FOUND. Attempting to fetch details...");
  console.log("  - Course ID:", courseId);
  console.log("  - User ID:", userId);
  try {
    // نرسل طلب GET إلى المسار الجديد
    const response = await fetch(`/api/courses/${courseId}?userId=${userId}`, {
      cache: 'no-cache' // ✅ تم تصحيح الموضع داخل الأقواس المعقوفة للـ options
    });


    if (response.status === 304) {
      console.warn("Received 304 Not Modified. Trying to load cached data...");
      return;
    }
    const data = await response.json();

    if (response.ok && data.success) {
      const course = data.course;

      // 💡 ملء العناصر ببيانات الكورس
      document.getElementById('courseTitle').textContent = course.name;
      document.getElementById('projectsCount').textContent = course.numProjects;
      document.getElementById('examsCount').textContent = course.numExams;

      renderCourseTasks(course);
      // يمكنك إضافة المزيد من المنطق هنا لعرض قائمة المشاريع الفعلية والاختبارات

    } else {
      document.getElementById('courseTitle').textContent = `Error: ${data.message || 'Could not fetch course details.'}`;
    }
  } catch (error) {
    console.error("Network error during course details fetch:", error);
    document.getElementById('courseTitle').textContent = "Server connection error.";
  }
}
// دوال العرض
function createCourseElement(course) {
  const courseDiv = document.createElement('a'); // استخدام <a> لجعلها قابلة للنقر
  courseDiv.className = 'course-card';
  courseDiv.href = `courseDetails.html?id=${course._id}`; // التوجيه لصفحة التفاصيل
  courseDiv.setAttribute('data-course-id', course._id);

  // تصميم بطاقة الكورس
  courseDiv.innerHTML = `
        <div class="course-icon"></div>
        <h4>${course.name}</h4>
        <p>📜 ${course.numProjects} Projects</p>
        <p>📅 ${course.numExams} Exams</p>
        
        `;
  return courseDiv;
}

function renderCourses(courses) {
  const coursesGrid = document.getElementById('coursesGrid');
  if (!coursesGrid) return;

  coursesGrid.innerHTML = '';
  courses.forEach(course => {
    const courseElement = createCourseElement(course);
    coursesGrid.appendChild(courseElement);
  });
}

async function fetchAndRenderCourses() {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    location.href = "login.html";
    return;
  }

  console.log("Fetching courses for userId:", userId);

  try {
    const response = await fetch(`/api/courses?userId=${userId}`);
    const data = await response.json();

    console.log("Courses API response:", response.status, data);

    if (response.ok && data.success) {
      console.log("Rendering courses:", data.courses);
      renderCourses(data.courses);
    } else {
      console.error("Failed to fetch courses:", data.message);
    }
  } catch (error) {
    console.error("Network error fetching courses:", error);
  }
}

async function submitCourseTask(event) {
  event.preventDefault();

  const courseTaskForm = event.target;

  // جلب المعرفات ونوع المهمة
  const courseId = getCourseIdFromUrl();
  const userId = localStorage.getItem('userId');
  // نفترض أن المودال هو العنصر الأب الأكبر الذي يحمل البيانات (قد يحتاج لتعديل المسار)
  const modalElement = document.getElementById('courseTaskModal');
  const taskType = modalElement ? modalElement.getAttribute('data-current-type') : 'project';

  // 🚨 التعديل هنا: استخدام المعرّفات الصحيحة لحقول الإدخال
  const taskTitle = courseTaskForm.querySelector('#courseTaskName').value; // ✅ تم التعديل
  const taskDate = courseTaskForm.querySelector('#courseTaskDate').value;  // ✅ تم التعديل

  // ------------------------------------
  // التحقق من المعرفات الأساسية
  // ------------------------------------
  if (!courseId || !userId) {
    alert("Error: Missing Course ID or User ID. Please check the URL and your login status.");
    return;
  }
  if (!taskTitle) {
    alert("Task Title cannot be empty.");
    return;
  }

  const taskData = {
    courseId: courseId,
    userId: userId,
    title: taskTitle,
    dueDate: taskDate,
    type: taskType
  };

  try {
    const response = await fetch('/api/course-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-cache',
      body: JSON.stringify(taskData)
    });

    const data = await response.json();

    if (response.ok && data.success) {
      alert(`${taskType} added successfully!`);
      courseTaskForm.reset();
      modalElement.style.display = 'none';

      // تحديث عدادات الكورس
      await loadCourseDetails();

    } else {
      alert(`Failed to add task: ${data.message} (Status: ${response.status})`);
    }

  } catch (error) {
    console.error("Fetch error during task submission:", error);
    alert("Could not connect to server to submit task.");
  }
}


// ----------------------------------------------------
// ربط الأحداث (ضمن DOMContentLoaded)
// ----------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {

  // ... (كود المصادقة وفتح مودال المهام) ...

  // --- متغيرات الكورسات ---
  const courseModal = document.getElementById("courseModal");
  const openCourseBtn = document.getElementById("openCourseModalBtn");
  const closeCourseBtn = document.getElementById("closeCourseModalBtn");
  const addCourseBtn = document.getElementById('addCourseBtn');
  const courseNameInput = document.getElementById('courseName');
  const openProjectModalBtn = document.getElementById('openProjectModalBtn');
  const openExamModalBtn = document.getElementById('openExamModalBtn');
  const closeCourseTaskModalBtn = document.getElementById('closeCourseTaskModalBtn');
  const courseTaskModal = document.getElementById('courseTaskModal');
  const courseTaskForm = document.getElementById('courseTaskForm');

  // 💡 جلب الكورسات عند تحميل الصفحة
  if (document.querySelector('.courses-page')) {
    fetchAndRenderCourses();
  }
  if (document.querySelector('.details-page')) {
    loadCourseDetails();
  }

  // --- منطق فتح وإغلاق مودال الكورسات ---
  if (openCourseBtn) {
    openCourseBtn.addEventListener("click", () => courseModal.style.display = "flex");
    closeCourseBtn.addEventListener("click", () => courseModal.style.display = "none");
    window.addEventListener("click", (e) => {
      if (e.target === courseModal) courseModal.style.display = "none";
    });
  }

  // --- منطق إضافة كورس جديد ---
  if (addCourseBtn) {
    addCourseBtn.addEventListener('click', async () => {
      const currentUserId = localStorage.getItem('userId');
      const courseName = courseNameInput.value;

      if (!courseName || !currentUserId) {
        alert("Course name and login are required.");
        return;
      }

      const courseData = {
        name: courseName,
        numProjects: 0,
        numExams: 0,
        userId: currentUserId
      };

      try {
        const response = await fetch('/api/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(courseData)
        });

        const data = await response.json();

        if (response.ok) {
          alert(`Course added: ${data.course.name}`);
          courseNameInput.value = '';
          courseModal.style.display = "none";

          // تحديث قائمة الكورسات
          await fetchAndRenderCourses();
        } else {
          alert(`Failed to add course: ${data.message}`);
        }

      } catch (error) {
        console.error("Fetch error (Course):", error);
      }
    });
  }
  if (openProjectModalBtn) {
    openProjectModalBtn.addEventListener('click', () => {
      openCourseTaskModal('project'); // يتم تمرير 'project'
    });
  }

  // فتح مودال الاختبار
  if (openExamModalBtn) {
    openExamModalBtn.addEventListener('click', () => {
      openCourseTaskModal('exam'); // يتم تمرير 'exam'
    });
  }
  if (closeCourseTaskModalBtn) {
    closeCourseTaskModalBtn.addEventListener('click', () => {
      if (courseTaskModal && courseTaskForm) {
        // 1. إخفاء المودال
        courseTaskModal.style.display = 'none';
        // 2. إعادة تعيين حقول النموذج
        courseTaskForm.reset();
      }
    });
  }
  if (courseTaskForm) {
    // 💡 الربط: عند إرسال النموذج، استدعاء دالة submitCourseTask
    courseTaskForm.addEventListener('submit', submitCourseTask);
  }
});

const courseTaskModal = document.getElementById('courseTaskModal');

function openCourseTaskModal(type) {
  if (!courseTaskModal) {
    console.error("Course Task Modal element not found.");
    return;
  }

  // 1. جلب ID الكورس الحالي
  const courseId = getCourseIdFromUrl();

  if (!courseId) {
    alert("Error: Could not determine current Course ID.");
    return;
  }

  // 2. تحديث العنوان (Project أو Exam)
  const title = type === 'project' ? 'Add New Assignment' : 'Add New Exam';
  document.getElementById('courseTaskModalTitle').textContent = title;

  // 3. تخزين النوع و ID الكورس في بيانات النموذج (هذا ضروري للإرسال للخادم لاحقًا)
  courseTaskModal.setAttribute('data-current-type', type);
  courseTaskModal.setAttribute('data-course-id', courseId);

  // 4. فتح المودال
  courseTaskModal.style.display = 'flex';
}

// ----------------------------------------------------
// دوال عرض المهام المضمنة (يجب أن تضاف هنا)
// ----------------------------------------------------

// main.js

// 💡 يجب أن تستقبل الدالة المعامل الثالث (isGradingView)
function createCourseTaskElement(task, type, isGradingView = false) { 
    const taskDiv = document.createElement('div');
    // إذا كانت للعرض في قسم الدرجات، أضف كلاس مختلف
    taskDiv.className = `${type}-item task-strip ${isGradingView ? 'grade-strip' : ''}`; 
    taskDiv.setAttribute('data-id', task._id);

    // تحويل التاريخ إلى صيغة مقروءة
    const dateText = task.dueDate 
        ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
        : 'N/A';
    
    // تحديد حالة مربع الاختيار
    const taskTitleClass = task.completed ? 'completed-text' : '';

    let taskContent;
    
    if (isGradingView) {
        // 💡 البنية الخاصة بقسم الدرجات (تتضمن حقل الدرجة)
        // يجب أن تحتوي المهمة على حقل grade
        const currentGrade = task.grade !== undefined ? task.grade : '';

        taskContent = `
            <span class="task-title-strip ${taskTitleClass}">${task.title}</span>
            
            <div class="task-metadata-strip grading-metadata">
                <span class="task-date-strip">📅 ${dateText}</span>
                
                <div class="grade-input-container">
                    <label for="grade-${task._id}">Grade:</label>
                    <input type="number" 
                           id="grade-${task._id}" 
                           class="grade-input" 
                           value="${currentGrade}" 
                           placeholder="Max 100"
                           min="0"
                           max="100"
                           onchange="updateCourseTaskGrade('${task._id}', this.value)"
                    />
                </div>
            </div>
        `;
    } else {
        // البنية العادية للمهام غير المنجزة (مربع اختيار فقط)
        const isChecked = task.completed ? 'checked' : ''; // يجب أن يكون هنا لكي يتم استخدامه
        
        taskContent = `
            <span class="task-title-strip ${taskTitleClass}">${task.title}</span>
            
            <div class="task-metadata-strip">
                <span class="task-date-strip">📅 ${dateText}</span>
                
                <input type="checkbox" 
                       class="task-completion-check"
                       ${isChecked}
                       onchange="toggleCourseTaskStatus('${task._id}', this.checked)"
                />
            </div>
        `;
    }
    
    taskDiv.innerHTML = taskContent;
    return taskDiv;
}

function renderCourseTasks(course) {
  // 1. جلب الحاويات من courseDetails.html
  // 💡 نستخدم الأيدي المطابقة لملف HTML الذي أرسلته (#projectsList, #examsList, #gradesList)
  const projectsList = document.getElementById('projectsList');
  const examsList = document.getElementById('examsList');
  const gradesList = document.getElementById('gradesList'); 

  if (!projectsList || !examsList || !gradesList) {
    console.error("Could not find required task list elements in the DOM.");
    // يمكنك إضافة رسالة خطأ للمستخدم هنا
    return;
  }

  // 2. تنظيف جميع الحاويات قبل البدء بالعرض (إزالة العناصر القديمة)
  projectsList.innerHTML = '';
  examsList.innerHTML = '';
  gradesList.innerHTML = '';

  // 3. دمج المشاريع والاختبارات في قائمة واحدة لتوزيعها
  const allTasks = [
    // إضافة جميع المشاريع وتحديد نوعها
    ...(course.projects || []).map(t => ({ ...t, type: 'project' })),
    // إضافة جميع الاختبارات وتحديد نوعها
    ...(course.exams || []).map(t => ({ ...t, type: 'exam' }))
  ];

  // 4. التوزيع والتصنيف
  let pendingProjectsCount = 0;
  let pendingExamsCount = 0;

  allTasks.forEach(task => {
    
    // 🛑 الشرط الحاسم: إذا كانت المهمة مكتملة (completed: true)
    if (task.completed) { 
      // 1. إرسالها إلى قسم الدرجات
      // نرسل 'true' للمعامل الثالث (isGradingView) لتفعيل وضع إدخال الدرجة في دالة createCourseTaskElement
      const element = createCourseTaskElement(task, task.type, true); 
      gradesList.appendChild(element);
      
    } else {
      // 2. إذا لم تكن مكتملة: إرسالها إلى قائمتها الأصلية
      const element = createCourseTaskElement(task, task.type, false); // نرسل 'false' للوضع العادي
      
      if (task.type === 'project') {
        projectsList.appendChild(element);
        pendingProjectsCount++;
      } else if (task.type === 'exam') {
        examsList.appendChild(element);
        pendingExamsCount++;
      }
    }
  });
  
  // 5. تحديث العدادات المعروضة في العناوين
  document.getElementById('projectsCount').textContent = pendingProjectsCount;
  document.getElementById('examsCount').textContent = pendingExamsCount;
}
async function toggleCourseTaskStatus(taskId, isCompleted) {
    const userId = localStorage.getItem('userId');
    const courseId = getCourseIdFromUrl();
    if (!userId) {
        alert("You must be logged in to update task status.");
        return;
    }
    if (!courseId || courseId.length !== 24 || taskId.length !== 24) {
        console.error("Critical IDs Check Failed:", { userId, courseId, taskId });
        alert("Error: Missing or Invalid Course/Task ID. Cannot update status.");
        // إذا فشل هذا التحقق، يجب أن تتوقف هنا!
        return; 
    }
    try {
        console.log("SENDING PUT:", { taskId, userId, courseId, completed: isCompleted }); // 💡 طباعة البيانات المرسلة
        const response = await fetch(`/api/course-tasks/${taskId}`, {
            method: 'PUT', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId, 
                completed: isCompleted,
                courseId: courseId // نرسل ID الكورس أيضاً لتسهيل التحديث في الموديل
            })
        });

        if (response.ok) {
            // تحديث عرض تفاصيل الكورس (لإعادة رسم القوائم وتطبيق تنسيق completed)
            await loadCourseDetails(); 
        } else {
          const data = await response.json();
            alert(`Failed to update task status: ${data.message}`);
            
            // 🛑 إزالة الكود المسبب للخطأ، وترك العنصر على حاله
            // لأن مربع الاختيار لم يتغير بعد أن نقر عليه المستخدم، فلنحاول إعادته لحالته السابقة
            
            // محاولة إرجاع حالة مربع الاختيار يدوياً (لتجنب انتظار المستخدم)
            try {
                const checkbox = document.querySelector(`.task-strip[data-id="${taskId}"] .task-completion-check`);
                if (checkbox) {
                   checkbox.checked = !isCompleted;
                }
            } catch (e) {
                console.warn("Could not find checkbox to revert status:", e);
                // إذا فشل، لا مشكلة، سيتم تصحيحه يدوياً بالنقر مرة أخرى أو إعادة التحميل
            }
        }
    } catch (error) {
        console.error("Network error during course task update:", error);
    }
}

async function updateCourseTaskGrade(taskId, gradeValue) {
    const userId = localStorage.getItem('userId');
    const courseId = getCourseIdFromUrl();
    
    // التحقق الأساسي: IDs يجب أن تكون موجودة
    if (!userId || !courseId || !taskId) return;
    
    // التأكد من أن الدرجة قيمة عددية
    const grade = parseFloat(gradeValue);
    if (isNaN(grade)) {
        console.warn("Grade input is not a valid number, skipping update.");
        return;
    }

    try {
        const response = await fetch(`/api/course-tasks/${taskId}/grade`, {
            method: 'PUT', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId, 
                courseId: courseId, 
                grade: grade // إرسال الدرجة كعدد
            })
        });

        if (response.ok) {
            console.log(`Grade for task ${taskId} updated to ${grade}`);
            
            // 🛑 الخطوة الحاسمة: إعادة تحميل تفاصيل الكورس لتحديث العرض وحساب المعدل
            await loadCourseDetails(); 
            
        } else {
            const data = await response.json();
            alert(`Failed to update grade: ${data.message}`);
        }
    } catch (error) {
        console.error("Network error during grade update:", error);
        alert("Could not connect to the server to update the grade.");
    }
}

/* ============================================
   PROGRESS CHART - مع API
   ============================================ */
async function renderProgressChart() {
  const ctx = document.getElementById("progressChart");
  if (!ctx) return;

  const userId = localStorage.getItem("userId");
  if (!userId) {
    console.log("No userId found, using demo data");
    renderDemoChart(ctx);
    return;
  }

  try {
    const res = await fetch(`/api/tasks?userId=${userId}`, { cache: "no-store" });
    const data = await res.json();
    
    console.log("Chart API Response:", data);

    if (!res.ok || !data.success) {
      console.error("API error:", data.message);
      renderDemoChart(ctx);
      return;
    }

    const tasks = data.tasks || [];

    // حساب آخر 7 أيام
    const days = [];
    const counts = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);

      days.push(d.toLocaleDateString("en-US", { weekday: "short" }));
      
      // عدّ المهام اللي انعملت في هذا اليوم
      const dayTasks = tasks.filter(t => {
        const createdDate = t.createdAt?.slice(0, 10);
        return createdDate === key;
      });

      counts.push(dayTasks.length);
    }

    console.log("Chart Days:", days);
    console.log("Chart Counts:", counts);

    renderChart(ctx, days, counts);

  } catch (error) {
    console.error("Error fetching tasks for chart:", error);
    renderDemoChart(ctx);
  }
}

// رسم الشارت بالبيانات
function renderChart(ctx, days, counts) {
  // إنشاء gradient
  const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(96, 165, 250, 0.4)');
  gradient.addColorStop(0.5, 'rgba(147, 197, 253, 0.2)');
  gradient.addColorStop(1, 'rgba(191, 219, 254, 0.05)');

  new Chart(ctx, {
    type: "line",
    data: {
      labels: days,
      datasets: [{
        label: 'Tasks',
        data: counts,
        fill: true,
        borderColor: '#3b82f6',
        borderWidth: 2.5,
        backgroundColor: gradient,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: '#3b82f6',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#6b7280',
          bodyColor: '#111827',
          borderColor: '#e5e7eb',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          displayColors: false,
          titleFont: {
            size: 11,
            weight: 'normal'
          },
          bodyFont: {
            size: 13,
            weight: '600'
          },
          callbacks: {
            title: function (context) {
              return context[0].label;
            },
            label: function (context) {
              const value = context.parsed.y;
              return `${value} ${value === 1 ? 'task' : 'tasks'}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false,
            drawBorder: false,
          },
          ticks: {
            color: '#9ca3af',
            font: {
              size: 11,
              family: 'system-ui, -apple-system, sans-serif'
            },
            padding: 8,
          },
          border: {
            display: false
          }
        },
        y: {
          min: 0,
          max: 8,
          ticks: {
            stepSize: 2,
            color: '#9ca3af',
            font: {
              size: 11,
              family: 'system-ui, -apple-system, sans-serif'
            },
            padding: 8,
          },
          grid: {
            color: 'rgba(229, 231, 235, 0.5)',
            drawBorder: false,
          },
          border: {
            display: false
          },
          title: {
            display: true,
            text: 'Tasks',
            color: '#6b7280',
            font: {
              size: 11,
              weight: '500'
            },
            padding: {
              bottom: 10
            }
          }
        }
      }
    }
  });
}

// بيانات تجريبية لو فشل الـ API
function renderDemoChart(ctx) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const counts = [2, 3, 2, 4, 3, 5, 4];
  renderChart(ctx, days, counts);
}

/* ============================================
   HOME DASHBOARD DATA - مع API
   ============================================ */

// Helper: تنسيق التاريخ
const prettyDate = (d) => {
  try {
    if (!d) return "N/A";
    const x = new Date(d);
    if (Number.isNaN(x.getTime())) return "N/A";
    return x.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "N/A";
  }
};

// Helper: تحويل للـ ISO date
const toISODate = (d) => {
  try {
    if (!d) return "";
    const x = new Date(d);
    if (Number.isNaN(x.getTime())) return "";
    return x.toISOString().slice(0, 10);
  } catch {
    return "";
  }
};

// HTML للعناصر
const itemHTML = (title, course, due, type) => `
  <div class="mini-item mini-${type}">
    <div class="mini-left">
      <div class="mini-title">${title}</div>
      <div class="mini-meta">${course ? course : "—"}${due ? ` • Due: ${due}` : ""}</div>
    </div>
    <div class="mini-badge">${type}</div>
  </div>
`;

/* ============================================
   MAIN DASHBOARD FUNCTION
   ============================================ */
(async function homeDashboard() {
  if (!document.body.classList.contains("home-page")) return;

  const userId = localStorage.getItem("userId");
  const userName = localStorage.getItem("username");

  console.log("Dashboard - userId:", userId);
  console.log("Dashboard - userName:", userName);

  // عرض اسم المستخدم
  if (userName) {
    document.querySelectorAll(".user-name").forEach(el => el.textContent = userName);
    const homeUserName = document.getElementById("homeUserName");
    if (homeUserName) homeUserName.textContent = userName;
  }

  if (!userId) {
    console.warn("No userId found - user not logged in");
    // location.href = "login.html";
    // return;
  }

  // العناصر في الصفحة
  const statCourses = document.getElementById("statCourses");
  const statExams = document.getElementById("statExams");
  const statPending = document.getElementById("statPending");
  const statProgress = document.getElementById("statProgress");

  const examsList = document.getElementById("homeExamsList");
  const projectsList = document.getElementById("homeProjectsList");
  const todayList = document.getElementById("homeTodayTasks");

  // =============== 1. Fetch Courses ===============
  let courses = [];
  try {
    const res = await fetch(`/api/courses?userId=${userId}`, { cache: "no-store" });
    const data = await res.json();
    
    console.log("Courses API Response:", res.status, data);

    if (res.ok && data.success && Array.isArray(data.courses)) {
      courses = data.courses;
    }
  } catch (error) {
    console.error("Error fetching courses:", error);
  }

  if (statCourses) {
    statCourses.textContent = String(courses.length);
  }

  // =============== 2. Fetch Tasks ===============
  let tasks = [];
  try {
    const res = await fetch(`/api/tasks?userId=${userId}`, { cache: "no-store" });
    const data = await res.json();
    
    console.log("Tasks API Response:", res.status, data);

    if (res.ok && data.success && Array.isArray(data.tasks)) {
      tasks = data.tasks;
    }
  } catch (error) {
    console.error("Error fetching tasks:", error);
  }

  const isDone = (t) => t?.completed === true;
  const pendingTasks = tasks.filter(t => !isDone(t));
  const doneCount = tasks.filter(isDone).length;

  if (statPending) {
    statPending.textContent = String(pendingTasks.length);
  }

  if (statProgress) {
    const total = tasks.length;
    const p = total ? Math.round((doneCount / total) * 100) : 0;
    statProgress.textContent = `${p}%`;
  }

  // =============== 3. Today's Tasks ===============
  if (todayList) {
    const today = new Date().toISOString().slice(0, 10);
    
    console.log("Today's date:", today);

    const todayTasks = pendingTasks.filter(t => {
      const taskDate = toISODate(t.dueDate || t.date);
      return taskDate === today;
    }).slice(0, 4);

    console.log("Today's tasks:", todayTasks);

    todayList.innerHTML = todayTasks.length
      ? todayTasks.map(t =>
        itemHTML(
          t.title || t.name || "Task",
          "",
          prettyDate(t.dueDate || t.date),
          "task"
        )
      ).join("")
      : `<div class="home-empty">No tasks for today</div>`;
  }

  // =============== 4. Upcoming Exams & Projects ===============
  let upcomingExams = [];
  let upcomingProjects = [];

  // نجيب تفاصيل أول 3 كورسات
  const topCourses = courses.slice(0, 3);
  
  for (const course of topCourses) {
    const courseId = course._id;
    if (!courseId) continue;

    try {
      const res = await fetch(`/api/courses/${courseId}?userId=${userId}`, { cache: "no-store" });
      const data = await res.json();
      
      console.log(`Course ${courseId} details:`, res.status, data);

      if (!(res.ok && data.success && data.course)) continue;

      const courseName = course.name || "Course";
      const projects = Array.isArray(data.course.projects) ? data.course.projects : [];
      const exams = Array.isArray(data.course.exams) ? data.course.exams : [];

      // أضف المشاريع اللي ما انتهت
      projects.forEach(p => {
        if (!p.completed) {
          upcomingProjects.push({ 
            ...p, 
            course: courseName,
            dueDate: p.date || p.dueDate
          });
        }
      });

      // أضف الامتحانات اللي ما انتهت
      exams.forEach(e => {
        if (!e.completed) {
          upcomingExams.push({ 
            ...e, 
            course: courseName,
            dueDate: e.date || e.dueDate
          });
        }
      });

    } catch (error) {
      console.error(`Error fetching course ${courseId}:`, error);
    }
  }

  // ترتيب حسب التاريخ
  const sortByDate = (a, b) => {
    const dateA = new Date(a.dueDate || a.date || 0);
    const dateB = new Date(b.dueDate || b.date || 0);
    return dateA - dateB;
  };

  upcomingExams = upcomingExams.sort(sortByDate).slice(0, 3);
  upcomingProjects = upcomingProjects.sort(sortByDate).slice(0, 3);

  console.log("Upcoming Exams:", upcomingExams);
  console.log("Upcoming Projects:", upcomingProjects);

  if (statExams) {
    statExams.textContent = String(upcomingExams.length);
  }

  // عرض الامتحانات
  if (examsList) {
    examsList.innerHTML = upcomingExams.length
      ? upcomingExams.map(x =>
        itemHTML(
          x.title || x.name || "Exam",
          x.course,
          prettyDate(x.dueDate || x.date),
          "exam"
        )
      ).join("")
      : `<div class="home-empty">No upcoming exams</div>`;
  }

  // عرض المشاريع
  if (projectsList) {
    projectsList.innerHTML = upcomingProjects.length
      ? upcomingProjects.map(x =>
        itemHTML(
          x.title || x.name || "Project",
          x.course,
          prettyDate(x.dueDate || x.date),
          "project"
        )
      ).join("")
      : `<div class="home-empty">No project deadlines</div>`;
  }

  // =============== 5. Render Chart ===============
  await renderProgressChart();

})();

/* ============================================
   SEARCH FUNCTIONALITY
   ============================================ */
(function initSearch() {
  if (!document.body.classList.contains("home-page")) return;

  const searchInput = document.querySelector(".home-search input");
  if (!searchInput) return;

  // Debounce function عشان ما يبحث مع كل حرف
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // البحث
  async function performSearch(query) {
    const trimmedQuery = query.trim().toLowerCase();

    // إذا فاضي، أرجع كل شي للوضع الطبيعي
    if (!trimmedQuery) {
      clearSearch();
      return;
    }

    const userId = localStorage.getItem("userId");
    if (!userId) return;

    try {
      // بحث في الكورسات
      const coursesRes = await fetch(`/api/courses?userId=${userId}`, { cache: "no-store" });
      const coursesData = await coursesRes.json();
      const courses = coursesData.courses || [];

      // بحث في المهام
      const tasksRes = await fetch(`/api/tasks?userId=${userId}`, { cache: "no-store" });
      const tasksData = await tasksRes.json();
      const tasks = tasksData.tasks || [];

      // فلترة النتائج
      const filteredCourses = courses.filter(c => 
        (c.name || "").toLowerCase().includes(trimmedQuery)
      );

      const filteredTasks = tasks.filter(t => 
        (t.title || t.name || "").toLowerCase().includes(trimmedQuery)
      );

      // عرض النتائج
      displaySearchResults(filteredCourses, filteredTasks, trimmedQuery);

    } catch (error) {
      console.error("Search error:", error);
    }
  }

  // عرض نتائج البحث
  function displaySearchResults(courses, tasks, query) {
    // إخفاء الـ panels الأصلية
    const panels = document.querySelector(".home-panels");
    const bottomRow = document.querySelector(".home-bottom-row");
    
    if (panels) panels.style.display = "none";
    if (bottomRow) bottomRow.style.display = "none";

    // شيل نتائج البحث القديمة
    let searchResults = document.querySelector(".search-results");
    if (searchResults) {
      searchResults.remove();
    }

    // إنشاء div جديد للنتائج
    searchResults = document.createElement("div");
    searchResults.className = "search-results";

    const totalResults = courses.length + tasks.length;

    searchResults.innerHTML = `
      <div class="search-header">
        <h3>Search Results for "${query}"</h3>
        <p class="search-count">${totalResults} result${totalResults !== 1 ? 's' : ''} found</p>
      </div>

      ${courses.length > 0 ? `
        <div class="search-section">
          <h4>📚 Courses (${courses.length})</h4>
          <div class="search-grid">
            ${courses.map(course => `
              <a href="courseDetails.html?id=${course._id}" class="search-item">
                <div class="search-item-icon" style="background: ${course.color || '#6366f1'}20; color: ${course.color || '#6366f1'}">
                  <i data-lucide="book-open"></i>
                </div>
                <div class="search-item-content">
                  <div class="search-item-title">${course.name}</div>
                  <div class="search-item-meta">Course</div>
                </div>
                <i data-lucide="chevron-right" class="search-item-arrow"></i>
              </a>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${tasks.length > 0 ? `
        <div class="search-section">
          <h4>✓ Tasks (${tasks.length})</h4>
          <div class="search-grid">
            ${tasks.map(task => `
              <a href="tasks.html?id=${task._id}" class="search-item">
                <div class="search-item-icon" style="background: ${task.completed ? '#10b98120' : '#f59e0b20'}; color: ${task.completed ? '#10b981' : '#f59e0b'}">
                  <i data-lucide="${task.completed ? 'check-circle' : 'circle'}"></i>
                </div>
                <div class="search-item-content">
                  <div class="search-item-title">${task.title || task.name}</div>
                  <div class="search-item-meta">
                    ${task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'Task'}
                  </div>
                </div>
                <i data-lucide="chevron-right" class="search-item-arrow"></i>
              </a>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${totalResults === 0 ? `
        <div class="search-empty">
          <div class="search-empty-icon">🔍</div>
          <p>No results found for "${query}"</p>
          <p class="search-empty-sub">Try searching for courses or tasks</p>
        </div>
      ` : ''}
    `;

    // أضف النتائج بعد الـ stats cards
    const statsCards = document.querySelector(".home-cards");
    if (statsCards) {
      statsCards.after(searchResults);
    }

    // Initialize icons
    if (window.lucide) {
      lucide.createIcons();
    }
  }

  // مسح البحث
  function clearSearch() {
    const searchResults = document.querySelector(".search-results");
    if (searchResults) {
      searchResults.remove();
    }

    const panels = document.querySelector(".home-panels");
    const bottomRow = document.querySelector(".home-bottom-row");
    
    if (panels) panels.style.display = "grid";
    if (bottomRow) bottomRow.style.display = "";
  }

  // Event listeners
  searchInput.addEventListener("input", debounce((e) => {
    performSearch(e.target.value);
  }, 300));

  // مسح البحث عند الضغط على Escape
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      searchInput.value = "";
      clearSearch();
      searchInput.blur();
    }
  });

})();


(function initProfilePage() {
  if (!document.body.classList.contains("profile-page")) return;

  const userId = localStorage.getItem("userId");
  const username = localStorage.getItem("username") || "User";

  // ===== Elements =====
  const sidebarName = document.getElementById("sidebarUserName");
  const avatarImg = document.getElementById("avatarImg");
  const avatarLetter = document.getElementById("avatarLetter");
  const nameText = document.getElementById("profileNameText");
  const emailText = document.getElementById("profileEmailText");
  const idText = document.getElementById("profileUserId");

  // ===== Initialize =====
  if (sidebarName) sidebarName.textContent = username;
  if (avatarLetter) avatarLetter.textContent = (username.trim()[0] || "U").toUpperCase();
  if (nameText) nameText.textContent = username;
  if (idText) idText.textContent = userId || "—";

  // Load saved avatar
  const savedAvatar = localStorage.getItem("userAvatar");
  if (savedAvatar && avatarImg && avatarLetter) {
    avatarImg.src = savedAvatar;
    avatarImg.style.display = "block";
    avatarLetter.style.display = "none";
  }

  // ===== Load user info =====
  if (userId) {
    (async () => {
      try {
        const res = await fetch(`/api/users/${userId}`, { cache: "no-store" });
        if (!res.ok) return;

        const data = await res.json();
        const u = data.user || data.data || data;

        const name = u.name || username;
        const email = u.email || "";
        const userAvatar = u.avatar || savedAvatar;

        if (nameText) nameText.textContent = name;
        if (emailText) emailText.textContent = email || "—";

        // Update avatar
        if (userAvatar && avatarImg && avatarLetter) {
          avatarImg.src = userAvatar;
          avatarImg.style.display = "block";
          avatarLetter.style.display = "none";
          localStorage.setItem("userAvatar", userAvatar);
        } else if (avatarLetter) {
          avatarLetter.textContent = (String(name).trim()[0] || "U").toUpperCase();
        }
      } catch (e) {
        console.warn("User profile GET failed:", e);
      }
    })();
  }

  // ===== Change Avatar Modal =====
  const avatarModal = document.getElementById("avatarModal");
  const btnChangeAvatar = document.getElementById("btnChangeAvatar");
  const btnCloseAvatar = document.getElementById("btnCloseAvatar");
  const btnCloseAvatar2 = document.getElementById("btnCloseAvatar2");
  const btnGenerateAvatar = document.getElementById("btnGenerateAvatar");
  const btnUploadAvatar = document.getElementById("btnUploadAvatar");
  const avatarFileInput = document.getElementById("avatarFileInput");
  const avatarMsg = document.getElementById("avatarMsg");

  const avatarPreviewImg = document.getElementById("avatarPreviewImg");
  const avatarPreviewLetter = document.getElementById("avatarPreviewLetter");

  // Open modal
  if (btnChangeAvatar && avatarModal) {
    btnChangeAvatar.addEventListener("click", () => {
      if (avatarMsg) avatarMsg.textContent = "";
      avatarModal.style.display = "flex";

      // Update preview
      const currentSaved = localStorage.getItem("userAvatar");
      if (currentSaved && avatarPreviewImg && avatarPreviewLetter) {
        avatarPreviewImg.src = currentSaved;
        avatarPreviewImg.style.display = "block";
        avatarPreviewLetter.style.display = "none";
      } else if (avatarPreviewLetter) {
        avatarPreviewLetter.textContent = (username[0] || "U").toUpperCase();
      }
    });
  }

  // Close modal
  if (btnCloseAvatar && avatarModal) {
    btnCloseAvatar.addEventListener("click", () => closeModal(avatarModal));
  }
  if (btnCloseAvatar2 && avatarModal) {
    btnCloseAvatar2.addEventListener("click", () => closeModal(avatarModal));
  }

  // Generate avatar
  if (btnGenerateAvatar) {
    btnGenerateAvatar.addEventListener("click", () => {
      const currentName = localStorage.getItem("username") || "User";
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        currentName
      )}&size=256&background=4a1f80&color=fff&bold=true&font-size=0.4`;

      updateAvatar(avatarUrl);
      if (userId) saveAvatarToBackend(avatarUrl);

      if (avatarMsg) {
        avatarMsg.textContent = "✓ Avatar generated successfully!";
        avatarMsg.style.background = "#f0fdf4";
        avatarMsg.style.borderColor = "#bbf7d0";
        avatarMsg.style.color = "#166534";
      }

      setTimeout(() => closeModal(avatarModal), 1200);
    });
  }

  // Upload avatar
  if (btnUploadAvatar && avatarFileInput) {
    btnUploadAvatar.addEventListener("click", () => {
      avatarFileInput.click();
    });

    avatarFileInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        if (avatarMsg) {
          avatarMsg.textContent = "⚠ Please select an image file.";
          avatarMsg.style.background = "#fef2f2";
          avatarMsg.style.borderColor = "#fecaca";
          avatarMsg.style.color = "#991b1b";
        }
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        if (avatarMsg) {
          avatarMsg.textContent = "⚠ Image must be less than 2MB.";
          avatarMsg.style.background = "#fef2f2";
          avatarMsg.style.borderColor = "#fecaca";
          avatarMsg.style.color = "#991b1b";
        }
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result;

        updateAvatar(base64);
        if (userId) saveAvatarToBackend(base64);

        if (avatarMsg) {
          avatarMsg.textContent = "✓ Avatar uploaded successfully!";
          avatarMsg.style.background = "#f0fdf4";
          avatarMsg.style.borderColor = "#bbf7d0";
          avatarMsg.style.color = "#166534";
        }

        setTimeout(() => closeModal(avatarModal), 1200);
      };
      reader.readAsDataURL(file);
    });
  }

  function updateAvatar(url) {
    if (avatarImg && avatarLetter) {
      avatarImg.src = url;
      avatarImg.style.display = "block";
      avatarLetter.style.display = "none";
    }

    if (avatarPreviewImg && avatarPreviewLetter) {
      avatarPreviewImg.src = url;
      avatarPreviewImg.style.display = "block";
      avatarPreviewLetter.style.display = "none";
    }

    localStorage.setItem("userAvatar", url);
  }

  async function saveAvatarToBackend(avatarUrl) {
    try {
      await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: avatarUrl }),
      });
    } catch (e) {
      console.warn("Could not save avatar to backend:", e);
    }
  }

  // Close modals on outside click (only avatar modal)
  [avatarModal].forEach((modal) => {
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal(modal);
      });
    }
  });

  function closeModal(modal) {
    if (modal) modal.style.display = "none";
  }

  // ===== Logout =====
  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      if (confirm("Are you sure you want to log out?")) {
        localStorage.removeItem("userId");
        localStorage.removeItem("username");
        localStorage.removeItem("userAvatar");
        window.location.href = "login.html";
      }
    });
  }

  // ===== Delete Account =====
  const btnDelete = document.getElementById("btnDeleteAccount");
  if (btnDelete) {
    btnDelete.addEventListener("click", async () => {
      const confirmation = prompt('Type "DELETE" to confirm account deletion:');
      if (confirmation !== "DELETE") {
        alert("Account deletion cancelled.");
        return;
      }

      const finalConfirm = confirm("This action cannot be undone. Are you absolutely sure?");
      if (!finalConfirm) return;

      try {
        const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
        const data = await res.json();

        if (res.ok) {
          localStorage.clear();
          alert("Account deleted successfully.");
          window.location.href = "signup.html";
        } else {
          alert(data.message || "Could not delete account.");
        }
      } catch (e) {
        alert("Server connection error.");
      }
    });
  }
  
})();


// **********************************************
// * Pomodoro Page *
// **********************************************

function initQuickTimer() {
  const timerTime = document.getElementById("timer-time");
  if (!timerTime) return; 

  console.log("Smart Pomodoro Timer initialized!");

  const timerRing = document.getElementById("timer-ring");
  const btnPlay = document.getElementById("timer-play");
  const chipQuit = document.getElementById("timer-15"); // Quit button
  const timerTitle = document.querySelector(".qt-title"); // title

  const STUDY_TIME = 25 * 60;
  const BREAK_TIME = 5 * 60;
  
  let timeLeft = STUDY_TIME; 
  let totalTime = STUDY_TIME;
  let timerInterval = null;
  let isRunning = false;
  let currentMode = 'study'; // 'study' or 'break'

  // time format
  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" + s : s}`;
  }

  function updateRing() {
    if (!timerRing) return;
    const percent = timeLeft / totalTime; 
    const deg = (1 - percent) * 360;
    
    const color = currentMode === 'study' ? '#8b5cf6' : '#4b4de0ff'; // colors of study/break ring
    timerRing.style.background = `conic-gradient(${color} ${deg}deg, transparent 0deg)`;
  }

  // switch mode (Study <-> Break)
  function switchMode() {
    if (currentMode === 'study') {
        // switch to break
        currentMode = 'break';
        timeLeft = BREAK_TIME;
        totalTime = BREAK_TIME;
        if (timerTitle) timerTitle.textContent = "Break";
    } else {
        // switch to study
        currentMode = 'study';
        timeLeft = STUDY_TIME;
        totalTime = STUDY_TIME;
        if (timerTitle) timerTitle.textContent = "Study";
    }
    timerTime.textContent = formatTime(timeLeft);
    updateRing();
  }

  // timer 
  function tick() {
    if (timeLeft > 0) {
      timeLeft--;
      timerTime.textContent = formatTime(timeLeft);
      updateRing();
    } else {
      // timeout
      switchMode(); // automatically switch
    }
  }

  // play/pause
  function toggleTimer() {
    if (isRunning) {
      clearInterval(timerInterval);
      isRunning = false;
      if(btnPlay) btnPlay.textContent = "▶";
    } else {
      timerInterval = setInterval(tick, 1000);
      isRunning = true;
      if(btnPlay) btnPlay.textContent = "⏸";
    }
  }

  // Event Listeners
  if (btnPlay) {
    btnPlay.addEventListener("click", toggleTimer);
  }

  // Quit button
  if (chipQuit) {
    chipQuit.addEventListener("click", () => {
        const wasRunning = isRunning;
        clearInterval(timerInterval);
        isRunning = false;
        if(btnPlay) btnPlay.textContent = "▶";

        //quit
        const userConfirmed = confirm("Are you sure you want to quit?");

        if (userConfirmed) {
            window.location.href = "homePage.html";
        }
    });
  }
  
  timerTime.textContent = formatTime(timeLeft);
  updateRing();
}
document.addEventListener('DOMContentLoaded', () => {
    initQuickTimer();
    initFriendsPage(); 
});


// --------------------------------------------------------
// ---------------- FRIENDS PAGE ----------------
// --------------------------------------------------------

let allFriends = []; 
// 2 examples of request
let pendingRequests = [
    { id: 9901, name: ' User 1', username: 'temp_user_1', avatar: 'T1', isMock: true },
    { id: 9902, name: ' User 2', username: 'temp_user_2', avatar: 'T2', isMock: true },
];

// inviting friend to pomodoro session
async function inviteFriendToSession(friendId, friendName, buttonElement) {
    
    const originalText = buttonElement.textContent;
    buttonElement.textContent = 'Sending...';
    buttonElement.disabled = true;
    buttonElement.style.backgroundColor = '#f9c74f'; // temporary

    try {
        const response = await fetch('/api/session/invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                friendId: friendId, 
                sessionId: 'CURRENT_USER_SESSION_ID'
            }),
        });
        if (!response.ok) throw new Error('API failed to send invite');
      
        buttonElement.textContent = 'Invited!';
        buttonElement.style.backgroundColor = '#10b981'; // success 
        
    } catch (error) {
        console.error("Invite error:", error);
        
        // 3. تحديث الزر للفشل
        buttonElement.textContent = 'Failed';
        buttonElement.style.backgroundColor = '#ef4444'; // أحمر للفشل
        buttonElement.disabled = false;
        
        // بعد 3 ثوانٍ، نرجع الزر إلى حالته الأصلية
        setTimeout(() => {
            buttonElement.textContent = originalText;
            buttonElement.style.backgroundColor = ''; 
            buttonElement.disabled = false;
        }, 3000);
    }
}
// --------------------------------------------------------
// 2. MAIN FRIENDS PAGE LOGIC (initFriendsPage)
// --------------------------------------------------------

function initFriendsPage() {
     const friendsPage = document.querySelector('.friends-page')
    if (!friendsPage) return; 

    const friendsListSection = document.getElementById('friendsListSection');
    const friendsList = document.getElementById('friendsList');
    const friendSearchInput = document.getElementById('friendSearchInput');
    const noResultsMessage = document.getElementById('noResultsMessage');
    const notifDot = document.getElementById('notifDot');
    
    const addFriendBtn = document.getElementById('addFriendBtn');
    const requestsBtn = document.getElementById('requestsBtn');
    const addFriendModal = document.getElementById('addFriendModal');
    const requestsModal = document.getElementById('requestsModal');
    
    const requestsList = requestsModal ? requestsModal.querySelector('.requests-list') : null;
    const userSearchInput = document.getElementById('userSearchInput');
    const searchResultsList = document.querySelector('.search-results-list');
    
    // friends list
    async function fetchFriendsData() {
        try {
            const response = await fetch('/api/friends'); 
            if (!response.ok) throw new Error('Failed to fetch friends data');
            const data = await response.json();
            
            allFriends = data.friends || [];
            renderFriends(allFriends);

        } catch (error) {
            console.error("Error loading friends:", error);
            noResultsMessage.innerHTML = 'Failed to load friends list. Please check your connection.';
            renderFriends([]); 
        }
    }

    function renderFriends(friendsToShow, searchTerm = null) {
        if (!friendsList || !noResultsMessage || !friendsListSection) return;

        friendsList.innerHTML = ''; 
        noResultsMessage.style.display = 'none'; 
         friendsListSection.style.display = 'block'; 

        const hasFriendsInDB = allFriends.length > 0;
        const isSearching = searchTerm !== null && searchTerm !== ''; 
        
        if (!hasFriendsInDB && !isSearching) {
            
            friendsList.style.display = 'none'; 
            
            noResultsMessage.style.display = 'block';
            noResultsMessage.innerHTML = `
                You don't have any friends yet :( <br>
                <span>Invite one!</span>
            `;
            return;
        } 

        if (isSearching) {
            friendsList.style.display = 'none';
            // reuslt not found
            noResultsMessage.style.display = 'block';
            noResultsMessage.textContent = `No results found for "${searchTerm}"`;
            return;
        }
        
        // search result
        friendsList.style.display = 'block'; 
        noResultsMessage.style.display = 'none';

        friendsToShow.forEach(friend => {
          const name = friend.name || 'Unknown User';
          const avatarInitials = name.split(' ').map(n => n[0]).join('');
          const li = document.createElement('li');
          li.innerHTML = `
              <div class="friend-info">
                  <span class="friend-avatar">${avatarInitials}</span>
                  <span class="friend-name">${name}</span>
              </div>
              <button class="invite-btn" data-friend-id="${friend.id}">Invite to Session</button>
          `;
          friendsList.appendChild(li);
      });
    }

    // requests
    async function fetchPendingRequests() {
        let mockRequests = pendingRequests.filter(r => r.isMock);
        pendingRequests = [...mockRequests];

        try {
            const response = await fetch('/api/requests'); 
            if (!response.ok) throw new Error('Failed to fetch requests');
            const data = await response.json();
            const realRequests = data.requests.map(req => ({...req, isMock: false}));
            pendingRequests = [...pendingRequests, ...realRequests];
            
        } catch (error) {
            console.error("Error loading requests:", error);
        }
        renderRequests();
    }
    
    // show requests
    function renderRequests() {
        if (!requestsList) return;
        requestsList.innerHTML = '';

        if (pendingRequests.length === 0) {
            requestsList.innerHTML = '<p class="modal-hint" style="text-align: center;">No pending friend requests.</p>';
        } else {
            pendingRequests.forEach(request => {
                const name = request.name || 'Unknown Request';
                const avatarInitials = name.split(' ').map(n => n[0]).join('');
                const li = document.createElement('li');
                li.classList.add('request-item');
                li.innerHTML = `
                    <div class="friend-info">
                        <span class="friend-avatar">${avatarInitials}</span>
                        <span class="friend-name">${name}</span>
                    </div>
                    <div class="request-actions">
                        <button class="btn-accept" data-id="${request.id}">Accept</button>
                        <button class="btn-reject" data-id="${request.id}">Reject</button>
                    </div>
                `;
                requestsList.appendChild(li);
            });
        }
        
        if (notifDot) {
            notifDot.style.display = pendingRequests.length ? 'block' : 'none';
        }
    }


    // handeling requests
    async function handleRequestAction(request, action) {
        
        if (!request) return;
        if (!request.isMock) {
            const endpoint = action === 'accept' ? '/api/requests/accept' : `/api/requests/reject`;
            const method = action === 'accept' ? 'POST' : 'DELETE';
            
            try {
                const response = await fetch(endpoint, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ requestId: request.id }),
                });

                if (!response.ok) throw new Error(`Failed to ${action} request`);

            } catch (error) {
                console.error("API error during request action:", error);
                alert(`Failed to complete action: ${error.message}`);
                return;
            }
        }
        
        const index = pendingRequests.findIndex(req => req.id === request.id);
        if (index !== -1) pendingRequests.splice(index, 1);
        
        if (action === 'accept') {
            allFriends.push(request);
        }
        renderRequests();
        renderFriends(allFriends); 
    }


    // search for users
    async function searchNewUsers() {
        if (!userSearchInput || !searchResultsList) return;
        const term = userSearchInput.value.toLowerCase().trim();
        searchResultsList.innerHTML = '';
        
        if (term.length < 0) {
            searchResultsList.innerHTML = '<p class="modal-hint" style="text-align: center;">Enter username..</p>';
            return;
        }
        searchResultsList.innerHTML = '<p class="modal-hint" style="text-align: center;">Searching...</p>';

        try {
            // search by username
            const response = await fetch(`/api/users/search?username=${encodeURIComponent(term)}`);
            if (!response.ok) throw new Error('Search failed');
            
            const data = await response.json();
            const results = data.users || [];

            if (results.length === 0) {
                searchResultsList.innerHTML = `<p class="modal-hint" style="text-align: center;">No users found matching "${term}".</p>`;
                return;
            }

            searchResultsList.innerHTML = '';
            results.forEach(user => {
                const name = user.name || user.username;
                const avatarInitials = name.split(' ').map(n => n[0]).join('');
                const li = document.createElement('li');
                li.classList.add('result-item');
                
                let buttonHtml = '';
                
                if (user.status === 'not-friend' || !user.status) {
                    buttonHtml = `<button class="btn-primary btn-small send-request-btn" data-id="${user.id}">Send Request</button>`;
                } else if (user.status === 'pending') {
                    buttonHtml = `<button class="btn-primary btn-small sent" disabled>Request Sent</button>`;
                } else if (user.status === 'friend') {
                    buttonHtml = `<span class="modal-hint">Friends</span>`;
                }

                li.innerHTML = `
                    <div class="friend-info">
                        <span class="friend-avatar">${avatarInitials}</span>
                        <span class="friend-name">${name}</span>
                        <span class="modal-hint">(@${user.username})</span>
                    </div>
                    ${buttonHtml}
                `;
                searchResultsList.appendChild(li);
            });
        } catch (error) {
            console.error("Search API error:", error);
            searchResultsList.innerHTML = `<p class="modal-hint" style="text-align: center; color: red;">Search error. Try again later.</p>`;
        }
    }

    //Event Listeners

    if (friendSearchInput) {
        friendSearchInput.addEventListener('keyup', () => renderFriends(allFriends, friendSearchInput.value.toLowerCase().trim()));
    }
    if (addFriendBtn && addFriendModal) {
        addFriendBtn.addEventListener('click', () => {
             addFriendModal.style.display = 'flex'; 
        });
    }
    if (requestsBtn && requestsModal) {
        requestsBtn.addEventListener('click', () => {
            requestsModal.style.display = 'flex'; 
            fetchPendingRequests();
        });
    }
    
    // accept/reject buttons
    if (requestsList) {
        requestsList.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-accept, .btn-reject');
            if (!btn) return;

            const id = parseInt(btn.dataset.id);
            const action = btn.classList.contains('btn-accept') ? 'accept' : 'reject';
            
            const request = pendingRequests.find(req => req.id === id);
            if (request) handleRequestAction(request, action);
        });
    }

    // search to add friend
    if (userSearchInput) {
        let searchTimeout;
        userSearchInput.addEventListener('keyup', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(searchNewUsers, 300);
        });
    }
    
    // Send Request
    if (searchResultsList) {
        searchResultsList.addEventListener('click', async (e) => {
            const sendBtn = e.target.closest('.send-request-btn');
            if (!sendBtn) return;
            const userId = sendBtn.dataset.id;
            sendBtn.textContent = 'Sending...';
            sendBtn.disabled = true;

            try {
                const response = await fetch('/api/requests/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ recipientId: userId }),
                });
                if (!response.ok) throw new Error('Failed to send request');
                sendBtn.textContent = 'Request Sent';
                sendBtn.classList.add('sent');
            } catch (error) {
                console.error("Send request error:", error);
                sendBtn.textContent = 'Failed';
                sendBtn.disabled = false;
            }
        });
    }
    // Invite friend to Session
    if (friendsList) {
        friendsList.addEventListener('click', (e) => {
            const inviteBtn = e.target.closest('.invite-btn');
            if (!inviteBtn) return;
            const friendId = inviteBtn.dataset.friendId;
            const friendName = inviteBtn.parentElement.querySelector('.friend-name').textContent; 
            if (friendId) {
                inviteFriendToSession(friendId, friendName, inviteBtn);
            }
        });
    }
    fetchFriendsData(); 
}
