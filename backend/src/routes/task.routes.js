const express = require("express");
const router = express.Router();
const taskController = require("../controllers/task.controller");

const {
  verifyToken,
  requireMinimumRole,
} = require("../middleware/auth.middleware");

// All task routes require authentication
router.use(verifyToken);

// Viewers and above can view tasks
router.get("/", requireMinimumRole("Viewer"), taskController.getAllTasks);
router.get("/:id", requireMinimumRole("Viewer"), taskController.getTaskById);

// Subtasks (Module 15)
router.get("/:id/subtasks", requireMinimumRole("Viewer"), taskController.getSubtasks);
router.post("/:id/subtasks", requireMinimumRole("Member"), taskController.createSubtask);

// Dependencies (Module 16)
router.get("/:id/dependencies", requireMinimumRole("Viewer"), taskController.getTaskDependencies);
router.post("/:id/dependencies", requireMinimumRole("Member"), taskController.addTaskDependency);
router.delete("/:id/dependencies/:dependsOnTaskId", requireMinimumRole("Member"), taskController.removeTaskDependency);

// Members can update task status (per rule 4.4)
router.put("/:id", requireMinimumRole("Member"), taskController.updateTask);

// Members and above can create tasks
router.post("/", requireMinimumRole("Member"), taskController.createTask);

// Members and above can delete tasks
router.delete("/:id", requireMinimumRole("Member"), taskController.deleteTask);

module.exports = router;
