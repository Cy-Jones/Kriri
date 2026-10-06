const fs = require('fs');
const p = '/Users/jones/Downloads/kriri/frontend/src/pages/Projects.jsx';
let c = fs.readFileSync(p, 'utf8');

const listHealthTarget = `<div 
                        className="relative text-[12px] text-[#8a8f98] flex items-center gap-1.5 cursor-pointer hover:bg-white/[0.04] px-2 py-1 -ml-2 rounded-full transition-colors"
                        onClick={(e) => { e.stopPropagation(); setActivePicker({ type: 'health', projectId: project.id }); }}
                      >
                        {getHealthIcon(project.health || "No updates")}
                        <span>{project.health || "No updates"}</span>`;
const listHealthReplace = `<ActionTooltip label="Update health status">
                        <div 
                          className="relative text-[12px] text-[#8a8f98] flex items-center gap-1.5 cursor-pointer hover:bg-white/[0.04] px-2 py-1 -ml-2 rounded-full transition-colors"
                          onClick={(e) => { e.stopPropagation(); setActivePicker({ type: 'health', projectId: project.id }); }}
                        >
                          {getHealthIcon(project.health || "No updates")}
                          <span>{project.health || "No updates"}</span>
                        </div>
                      </ActionTooltip>`;

const listProgressTarget = `<div 
                        className="relative flex items-center gap-1.5 text-[12px] text-[#8a8f98] cursor-pointer hover:bg-white/[0.04] px-2 py-1 -ml-2 rounded-full transition-colors"
                        onClick={(e) => { e.stopPropagation(); setActivePicker({ type: 'progress', projectId: project.id }); }}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray="2 2"
                          className="text-[#c28431]"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                        </svg>
                        <span>{project.progress || 0}%</span>`;
const listProgressReplace = `<ActionTooltip label="Update progress">
                        <div 
                          className="relative flex items-center gap-1.5 text-[12px] text-[#8a8f98] cursor-pointer hover:bg-white/[0.04] px-2 py-1 -ml-2 rounded-full transition-colors"
                          onClick={(e) => { e.stopPropagation(); setActivePicker({ type: 'progress', projectId: project.id }); }}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeDasharray="2 2"
                            className="text-[#c28431]"
                          >
                            <circle cx="12" cy="12" r="10"></circle>
                          </svg>
                          <span>{project.progress || 0}%</span>
                        </div>
                      </ActionTooltip>`;

c = c.replace(listHealthTarget, listHealthReplace);
c = c.replace(listProgressTarget, listProgressReplace);
fs.writeFileSync(p, c);
console.log("patched progress and health");
