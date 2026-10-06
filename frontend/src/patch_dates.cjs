const fs = require('fs');
const path = require('path');
const p = '/Users/jones/Downloads/kriri/frontend/src/pages/Projects.jsx';
let c = fs.readFileSync(p, 'utf8');

const targetStr = `{config.properties.due_date && (
        <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#8a8f98] mt-1">
          <PickerWrapper
            open={activePicker?.type === 'dueDate' && activePicker.projectId === project.id}
            onOpenChange={(open) => {
               if (open) setActivePicker({ type: 'dueDate', projectId: project.id });
               else setActivePicker({ type: null, projectId: null });
            }}
            trigger={
              <span className="relative flex items-center gap-1.5 cursor-pointer hover:text-[#e8e8e8] transition-colors rounded hover:bg-white/[0.04] px-1 py-0.5 -ml-1"
                onPointerDown={e => e.stopPropagation()} 
                onClick={e => { e.stopPropagation(); setActivePicker({ type: 'dueDate', projectId: project.id }); }}
              >
                <span>{project.start_date ? new Date(project.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Sep 30th"}</span>
                <span className="text-[#5e636e]">&rarr;</span>
                <span>{project.due_date ? new Date(project.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Oct 20th"}</span>
              </span>
            }
          >
            <DatePicker 
              value={project.due_date} 
              onChange={(val) => onUpdateProject(project.id, { due_date: val })} 
              onClose={() => setActivePicker({ type: null, projectId: null })} 
            />
          </PickerWrapper>`;

const replaceStr = `{config.properties.due_date && (
        <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#8a8f98] mt-1">
          <span className="relative flex items-center gap-1.5 rounded px-1 py-0.5 -ml-1">
            <PickerWrapper
              open={activePicker?.type === 'startDate' && activePicker.projectId === project.id}
              onOpenChange={(open) => {
                 if (open) setActivePicker({ type: 'startDate', projectId: project.id });
                 else setActivePicker({ type: null, projectId: null });
              }}
              trigger={
                <span 
                  className="cursor-pointer hover:text-[#e8e8e8] transition-colors rounded hover:bg-white/[0.04] px-1 py-0.5"
                  onPointerDown={e => e.stopPropagation()} 
                  onClick={e => { e.stopPropagation(); setActivePicker({ type: 'startDate', projectId: project.id }); }}
                >
                  {project.start_date ? new Date(project.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Sep 30th"}
                </span>
              }
            >
              <DatePicker 
                value={project.start_date} 
                onChange={(val) => onUpdateProject(project.id, { start_date: val })} 
                onClose={() => setActivePicker({ type: null, projectId: null })} 
                placeholder="Start date"
              />
            </PickerWrapper>
            
            <span className="text-[#5e636e]">&rarr;</span>
            
            <PickerWrapper
              open={activePicker?.type === 'dueDate' && activePicker.projectId === project.id}
              onOpenChange={(open) => {
                 if (open) setActivePicker({ type: 'dueDate', projectId: project.id });
                 else setActivePicker({ type: null, projectId: null });
              }}
              trigger={
                <span 
                  className="cursor-pointer hover:text-[#e8e8e8] transition-colors rounded hover:bg-white/[0.04] px-1 py-0.5"
                  onPointerDown={e => e.stopPropagation()} 
                  onClick={e => { e.stopPropagation(); setActivePicker({ type: 'dueDate', projectId: project.id }); }}
                >
                  {project.due_date ? new Date(project.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Oct 20th"}
                </span>
              }
            >
              <DatePicker 
                value={project.due_date} 
                onChange={(val) => onUpdateProject(project.id, { due_date: val })} 
                onClose={() => setActivePicker({ type: null, projectId: null })} 
                placeholder="Target date"
              />
            </PickerWrapper>
          </span>`;

if (c.includes(targetStr)) {
  c = c.replace(targetStr, replaceStr);
  fs.writeFileSync(p, c);
  console.log('patched');
} else {
  console.log('not found');
}
