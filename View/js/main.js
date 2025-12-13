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
  const userName = localStorage.getItem('username');

  if (userName) {
    const userNameEl = document.querySelector('.user-name');
    const topnavTitleEl = document.querySelector('.topnav .title');

    userNameEl.textContent = userName;
    topnavTitleEl.textContent = `Welcome, ${userName}!`;
  } else {
    // إذا لم يكن هناك اسم، أعد توجيه المستخدم لصفحة تسجيل الدخول
    window.location.href = 'login.html';
  }
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
        dueDate: taskDateInput.value,
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
  if (!userId) return; // لا تفعل شيئًا إذا لم يكن هناك مستخدم مسجل دخوله

  try {
    // نرسل userId كـ query parameter
    const response = await fetch(`/api/tasks?userId=${userId}`);
    const data = await response.json();

    if (response.ok && data.success) {
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
  if (!userId) return;

  try {
    const response = await fetch(`/api/courses?userId=${userId}`);
    const data = await response.json();

    if (response.ok && data.success) {
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