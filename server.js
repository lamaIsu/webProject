const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const usersController = require("./Controllers/usersController");
const tasksController = require("./Controllers/tasksController");
const coursesController = require("./Controllers/coursesController");
const calendarController = require("./Controllers/calendarController");

const app = express();
const PORT = 3000;

app.use(express.static("View"));
app.use(bodyParser.json());

// ✅ Mongo connect (عدلي اسم الداتابيس لو تبين)
mongoose
  .connect("mongodb://127.0.0.1:27017/studease")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB error:", err.message));

// --- API ROUTES ---
app.post("/api/users", usersController.handleAddUser);
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

// ✅ Calendar Notes
app.get("/api/calendar-notes", calendarController.handleGetNotes);
app.post("/api/calendar-notes", calendarController.handleCreateNote);
app.delete("/api/calendar-notes/:id", calendarController.handleDeleteNote);
app.delete("/api/calendar-notes", calendarController.handleClearAllNotes);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
