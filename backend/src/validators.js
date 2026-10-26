const { z } = require("zod");

exports.projectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  identifier: z.string().optional(),
  description: z.string().optional().nullable(),
  short_summary: z.string().optional().nullable(),
  status: z
    .enum([
      "Backlog",
      "Planning",
      "Planned",
      "In Progress",
      "Paused",
      "Done",
      "Completed",
      "Canceled",
      "Archived",
    ])
    .optional(),
  health: z.enum(["On Track", "At Risk", "Off Track"]).optional(),
  priority: z
    .enum(["No priority", "Urgent", "High", "Medium", "Low"])
    .optional(),
  start_date: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
  lead: z.object({ id: z.number() }).optional().nullable(),
  members: z
    .array(z.object({ id: z.number(), role: z.string().optional() }))
    .optional(),
  labels: z.array(z.string()).optional(),
  progress: z.number().min(0).max(100).optional(),
  milestones: z
    .array(
      z.object({
        id: z.number().optional(),
        name: z.string().optional(),
        title: z.string().optional(),
        desc: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
        date: z.string().optional().nullable(),
        due_date: z.string().optional().nullable(),
        status: z.string().optional(),
      }),
    )
    .optional(),
  dependencies: z.any().optional(),
  position: z.number().optional(),
});

exports.taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  status: z
    .enum(["Backlog", "Todo", "In Progress", "In Review", "Done", "Canceled"])
    .optional(),
  priority: z
    .enum(["No priority", "Urgent", "High", "Medium", "Low"])
    .optional(),
  assignee_id: z.number().optional().nullable(),
  project_id: z.number().optional().nullable(),
  start_date: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
  progress: z.number().min(0).max(100).optional(),
  position: z.number().optional(),
});

exports.milestoneSchema = z.object({
  name: z.string().min(1, "Name is required"),
  due_date: z.string().optional().nullable(),
  project_id: z.number().optional().nullable(),
});

exports.commentSchema = z.object({
  content: z.string().min(1, "Content is required"),
  task_id: z.number().optional().nullable(),
  project_id: z.number().optional().nullable(),
});
