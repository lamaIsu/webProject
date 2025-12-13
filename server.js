const express = require('express');
const bodyParser = require('body-parser');
// Import the controller
const usersController = require('./Controllers/usersController');
const tasksController = require('./Controllers/tasksController');
const coursesController = require('./Controllers/coursesController');
const app = express();
const PORT = 3000;

app.use(express.static('View'));
// Use body-parser to parse JSON request bodies
app.use(bodyParser.json());

// --- RESTful API ROUTES ---
// Connect the routes to the controller functions

// CREATE
app.post('/api/users', usersController.handleAddUser);
app.post("/api/login", usersController.handleLogin);

app.post("/api/tasks", tasksController.handleCreateTask);
app.get("/api/tasks", tasksController.handleGetTasks);
app.put("/api/tasks/:taskId", tasksController.handleUpdateTask);

app.post("/api/courses", coursesController.handleCreateCourse);
app.get("/api/courses", coursesController.handleGetCourses);
app.get("/api/courses/:courseId", coursesController.handleGetCourseDetails);
app.post("/api/course-tasks", coursesController.handleAddCourseTask);
app.put("/api/course-tasks/:taskId", coursesController.handleUpdateCourseTaskStatus);
app.put("/api/course-tasks/:taskId/grade", coursesController.handleUpdateCourseTaskGrade);


// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
