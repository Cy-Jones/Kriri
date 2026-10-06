const fs = require('fs');

const p = '/Users/jones/Downloads/kriri/frontend/src/pages/Projects.jsx';
let c = fs.readFileSync(p, 'utf8');

const startDateTarget = `trigger={
                <span 
                  className="cursor-pointer hover:text-[#e8e8e8] transition-colors rounded hover:bg-white/[0.04] px-1 py-0.5"
                  onPointerDown={e => e.stopPropagation()} 
                  onClick={e => { e.stopPropagation(); setActivePicker({ type: 'startDate', projectId: project.id }); }}
                >
                  {project.start_date ? new Date(project.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Sep 30th"}
                </span>
              }`;
const startDateReplace = `trigger={
                <span>
                  <ActionTooltip label="Set start date" shortcut="Ctrl S">
                    <span 
                      className="cursor-pointer hover:text-[#e8e8e8] transition-colors rounded hover:bg-white/[0.04] px-1 py-0.5"
                      onPointerDown={e => e.stopPropagation()} 
                      onClick={e => { e.stopPropagation(); setActivePicker({ type: 'startDate', projectId: project.id }); }}
                    >
                      {project.start_date ? new Date(project.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Sep 30th"}
                    </span>
                  </ActionTooltip>
                </span>
              }`;

const dueDateTarget = `trigger={
                <span 
                  className="cursor-pointer hover:text-[#e8e8e8] transition-colors rounded hover:bg-white/[0.04] px-1 py-0.5"
                  onPointerDown={e => e.stopPropagation()} 
                  onClick={e => { e.stopPropagation(); setActivePicker({ type: 'dueDate', projectId: project.id }); }}
                >
                  {project.due_date ? new Date(project.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Oct 20th"}
                </span>
              }`;
const dueDateReplace = `trigger={
                <span>
                  <ActionTooltip label="Set target date" shortcut="Ctrl D">
                    <span 
                      className="cursor-pointer hover:text-[#e8e8e8] transition-colors rounded hover:bg-white/[0.04] px-1 py-0.5"
                      onPointerDown={e => e.stopPropagation()} 
                      onClick={e => { e.stopPropagation(); setActivePicker({ type: 'dueDate', projectId: project.id }); }}
                    >
                      {project.due_date ? new Date(project.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Oct 20th"}
                    </span>
                  </ActionTooltip>
                </span>
              }`;

c = c.replace(startDateTarget, startDateReplace);
c = c.replace(dueDateTarget, dueDateReplace);
fs.writeFileSync(p, c);
console.log("Patched dates");
