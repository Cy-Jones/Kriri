const express = require("express");
const router = express.Router();
const commentController = require("../controllers/comment.controller");
const {
  verifyToken,
  requireMinimumRole,
} = require("../middleware/auth.middleware");

router.use(verifyToken);

router.get(
  "/task/:taskId",
  requireMinimumRole("Viewer"),
  commentController.getTaskComments,
);
router.post("/", requireMinimumRole("Member"), commentController.addComment);

module.exports = router;
