const fs = require('fs');

const p = '/Users/jones/Downloads/kriri/frontend/src/pages/Projects.jsx';
let c = fs.readFileSync(p, 'utf8');

// Add import if missing
if (!c.includes("import ActionTooltip from")) {
  c = c.replace(
    'import DatePicker from "../components/DatePicker";',
    'import DatePicker from "../components/DatePicker";\nimport ActionTooltip from "../components/ActionTooltip";'
  );
}

// 1. Status Picker on Board
const statusTarget = `trigger={
                <div 
                  className="relative cursor-pointer text-[#8a8f98] hover:text-[#e8e8e8] transition-colors flex items-center justify-center w-5 h-5 rounded hover:bg-white/[0.04]"
                  onPointerDown={e => e.stopPropagation()} 
                  onClick={e => { e.stopPropagation(); setActivePicker({ type: 'status', projectId: project.id }); }}
                >
                  {getStatusIcon(project.status || "Planned")}
                </div>
              }`;
const statusReplace = `trigger={
                <div>
                  <ActionTooltip label={project.status || "Planned"} shortcut="P then S">
                    <div 
                      className="relative cursor-pointer text-[#8a8f98] hover:text-[#e8e8e8] transition-colors flex items-center justify-center w-5 h-5 rounded hover:bg-white/[0.04]"
                      onPointerDown={e => e.stopPropagation()} 
                      onClick={e => { e.stopPropagation(); setActivePicker({ type: 'status', projectId: project.id }); }}
                    >
                      {getStatusIcon(project.status || "Planned")}
                    </div>
                  </ActionTooltip>
                </div>
              }`;

// 2. Priority Picker on Board
const priorityTarget = `trigger={
                <div 
                  className="relative cursor-pointer text-[#8a8f98] hover:text-[#e8e8e8] transition-colors flex items-center justify-center w-5 h-5 rounded hover:bg-white/[0.04]"
                  onPointerDown={e => e.stopPropagation()} 
                  onClick={e => { e.stopPropagation(); setActivePicker({ type: 'priority', projectId: project.id }); }}
                >
                  {getPriorityIcon(project.priority || "No priority")}
                </div>
              }`;
const priorityReplace = `trigger={
                <div>
                  <ActionTooltip label="Change project priority" shortcut="P then P">
                    <div 
                      className="relative cursor-pointer text-[#8a8f98] hover:text-[#e8e8e8] transition-colors flex items-center justify-center w-5 h-5 rounded hover:bg-white/[0.04]"
                      onPointerDown={e => e.stopPropagation()} 
                      onClick={e => { e.stopPropagation(); setActivePicker({ type: 'priority', projectId: project.id }); }}
                    >
                      {getPriorityIcon(project.priority || "No priority")}
                    </div>
                  </ActionTooltip>
                </div>
              }`;
              
// 3. Label Picker on Board
const labelTarget = `trigger={
                <div 
                  className="relative cursor-pointer text-[#8a8f98] hover:text-[#e8e8e8] transition-colors flex items-center justify-center w-5 h-5 rounded hover:bg-white/[0.04]"
                  onPointerDown={e => e.stopPropagation()} 
                  onClick={e => { e.stopPropagation(); setActivePicker({ type: 'labels', projectId: project.id }); }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                </div>
              }`;
const labelReplace = `trigger={
                <div>
                  <ActionTooltip label="Add labels" shortcut="P then L">
                    <div 
                      className="relative cursor-pointer text-[#8a8f98] hover:text-[#e8e8e8] transition-colors flex items-center justify-center w-5 h-5 rounded hover:bg-white/[0.04]"
                      onPointerDown={e => e.stopPropagation()} 
                      onClick={e => { e.stopPropagation(); setActivePicker({ type: 'labels', projectId: project.id }); }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                    </div>
                  </ActionTooltip>
                </div>
              }`;

c = c.replace(statusTarget, statusReplace);
c = c.replace(priorityTarget, priorityReplace);
c = c.replace(labelTarget, labelReplace);

fs.writeFileSync(p, c);
console.log("Patched tooltips");
