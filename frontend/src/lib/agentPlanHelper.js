/**
 * Helper to generate contextual AI task plans and step through them dynamically
 * during agent execution.
 */

export function generatePlanForPrompt(prompt = "") {
  const p = prompt.toLowerCase().trim();

  // ONLY show execution plan for complex, multi-stage analytical operations
  if (p.includes("audit") || (p.includes("health") && p.includes("risk")) || p.includes("security review")) {
    return [
      { id: "p1", title: "Scan active milestones & health metrics", detail: "Postgres", status: "pending" },
      { id: "p2", title: "Calculate deadline slippage & blocker ratios", detail: "Metrics", status: "pending" },
      { id: "p3", title: "Evaluate member capacity and bottlenecks", detail: "Team", status: "pending" },
      { id: "p4", title: "Synthesize risk mitigation recommendations", detail: "Analysis", status: "pending" },
    ];
  }

  if (p.includes("decompose") || (p.includes("break down") && (p.includes("feature") || p.includes("epic")))) {
    return [
      { id: "p1", title: "Analyze feature scope & dependencies", detail: "Scope", status: "pending" },
      { id: "p2", title: "Draft subtask breakdown & acceptance criteria", detail: "Schema", status: "pending" },
      { id: "p3", title: "Map technical constraints & testing requirements", detail: "QA", status: "pending" },
      { id: "p4", title: "Format delivery backlog items", detail: "Payload", status: "pending" },
    ];
  }

  if ((p.includes("workload") && p.includes("rebalance")) || (p.includes("capacity") && p.includes("audit"))) {
    return [
      { id: "p1", title: "Query team assignments & issue states", detail: "Workspace", status: "pending" },
      { id: "p2", title: "Compute active hours & task distribution", detail: "Analytics", status: "pending" },
      { id: "p3", title: "Flag overloaded members and imbalances", detail: "Capacity", status: "pending" },
      { id: "p4", title: "Formulate rebalancing suggestions", detail: "Actions", status: "pending" },
    ];
  }

  // Simple operations (status updates, single issue creation, deletion, questions) do not show an execution plan
  return null;
}

/**
 * Creates a dynamic stepper that moves through the plan items at controlled intervals.
 */
export function startPlanStepper(initialPlan, onUpdate) {
  let items = initialPlan.map((item, idx) => ({
    ...item,
    status: idx === 0 ? "in-progress" : "pending",
    progress: idx === 0 ? 25 : undefined,
    detail: idx === 0 ? "25%" : item.detail,
  }));

  onUpdate([...items]);

  let currentStep = 0;
  const timers = [];

  const advance = () => {
    currentStep++;
    if (currentStep >= items.length) return;

    items = items.map((item, idx) => {
      if (idx < currentStep) {
        return { ...item, status: "completed", progress: 100, detail: "Done" };
      }
      if (idx === currentStep) {
        const pct = Math.min(25 * (currentStep + 1), 90);
        return { ...item, status: "in-progress", progress: pct, detail: `${pct}%` };
      }
      return { ...item, status: "pending", progress: undefined };
    });

    onUpdate([...items]);

    if (currentStep < items.length - 1) {
      timers.push(setTimeout(advance, 360));
    }
  };

  timers.push(setTimeout(advance, 320));

  return {
    finish: () => {
      timers.forEach(clearTimeout);
      const completed = items.map((item) => ({
        ...item,
        status: "completed",
        progress: 100,
        detail: "Done",
      }));
      onUpdate(completed);
      return completed;
    },
    cancel: () => {
      timers.forEach(clearTimeout);
    },
  };
}

