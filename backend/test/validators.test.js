const test = require("node:test");
const assert = require("node:assert/strict");
const {
  projectSchema,
  taskSchema,
  milestoneSchema,
  commentSchema,
} = require("../src/validators");

test("projectSchema validates correct project payload", () => {
  const valid = {
    name: "Kriri Core",
    description: "Main workspace project",
    status: "In Progress",
    health: "On Track",
    priority: "High",
    progress: 75,
    labels: ["backend", "v1"],
  };
  const parsed = projectSchema.parse(valid);
  assert.equal(parsed.name, "Kriri Core");
  assert.equal(parsed.progress, 75);
});

test("projectSchema rejects invalid progress percentage", () => {
  assert.throws(
    () => {
      projectSchema.parse({ name: "Bad Project", progress: 150 });
    },
    { name: "ZodError" },
  );
});

test("taskSchema requires title and validates progress bounds", () => {
  assert.throws(
    () => {
      taskSchema.parse({ status: "Todo" });
    },
    { name: "ZodError" },
  );

  const validTask = taskSchema.parse({
    title: "Implement RBAC checks",
    status: "Todo",
    priority: "High",
    progress: 0,
  });
  assert.equal(validTask.title, "Implement RBAC checks");
});

test("milestoneSchema requires name", () => {
  assert.throws(
    () => {
      milestoneSchema.parse({ due_date: "2026-12-01" });
    },
    { name: "ZodError" },
  );

  const parsed = milestoneSchema.parse({ name: "Alpha Release" });
  assert.equal(parsed.name, "Alpha Release");
});

test("commentSchema requires content", () => {
  assert.throws(
    () => {
      commentSchema.parse({ task_id: 1, content: "" });
    },
    { name: "ZodError" },
  );

  const parsed = commentSchema.parse({ task_id: 1, content: "Looking good!" });
  assert.equal(parsed.content, "Looking good!");
});
