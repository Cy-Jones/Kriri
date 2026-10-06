const fs = require('fs');
const p = '/Users/jones/Downloads/kriri/frontend/src/pages/Projects.jsx';
let c = fs.readFileSync(p, 'utf8');

const listStatusTarget = `<div 
                        className="relative text-[12px] text-[#8a8f98] whitespace-nowrap cursor-pointer hover:bg-white/[0.04] px-2 py-1 -ml-2 rounded-full transition-colors flex items-center gap-1.5"
                        onClick={(e) => { e.stopPropagation(); setActivePicker({ type: 'status', projectId: project.id }); }}
                      >
                        {getStatusIcon(project.status || "Planned")}
                        <span>{project.status || "Planned"}</span>`;
const listStatusReplace = `<ActionTooltip label={project.status || "Planned"} shortcut="P then S">
                        <div 
                          className="relative text-[12px] text-[#8a8f98] whitespace-nowrap cursor-pointer hover:bg-white/[0.04] px-2 py-1 -ml-2 rounded-full transition-colors flex items-center gap-1.5"
                          onClick={(e) => { e.stopPropagation(); setActivePicker({ type: 'status', projectId: project.id }); }}
                        >
                          {getStatusIcon(project.status || "Planned")}
                          <span>{project.status || "Planned"}</span>
                        </div>
                      </ActionTooltip>`;

const listPriorityTarget = `<div 
                        className="relative text-[12px] text-[#8a8f98] flex items-center gap-1.5 cursor-pointer hover:bg-white/[0.04] px-2 py-1 -ml-2 rounded-full transition-colors"
                        onClick={(e) => { e.stopPropagation(); setActivePicker({ type: 'priority', projectId: project.id }); }}
                      >
                        {getPriorityIcon(project.priority || "No priority")}
                        <span>{project.priority || "No priority"}</span>`;
const listPriorityReplace = `<ActionTooltip label="Change project priority" shortcut="P then P">
                        <div 
                          className="relative text-[12px] text-[#8a8f98] flex items-center gap-1.5 cursor-pointer hover:bg-white/[0.04] px-2 py-1 -ml-2 rounded-full transition-colors"
                          onClick={(e) => { e.stopPropagation(); setActivePicker({ type: 'priority', projectId: project.id }); }}
                        >
                          {getPriorityIcon(project.priority || "No priority")}
                          <span>{project.priority || "No priority"}</span>
                        </div>
                      </ActionTooltip>`;

c = c.replace(listStatusTarget, listStatusReplace);
c = c.replace(listPriorityTarget, listPriorityReplace);
fs.writeFileSync(p, c);
console.log("patched list view");
