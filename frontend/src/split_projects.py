import os
import re

p = '/Users/jones/Downloads/kriri/frontend/src/pages/Projects.jsx'
with open(p, 'r') as f:
    content = f.read()

# Find imports (everything before the first local const/function)
# The first const/function after imports is ActionMenu at line 72
imports_end = content.find('// ============================================================================')
imports_text = content[:imports_end]

# Extract ListViewRenderer
list_view_start = content.find('// ============================================================================\n// DROPDOWN MENU HELPERS')
if list_view_start == -1: # Wait, ActionMenu is at 72
    pass

# We can use line indices
lines = content.split('\n')

def extract_between(start_str, end_str=None):
    start_idx = -1
    for i, l in enumerate(lines):
        if l.startswith(start_str):
            start_idx = i
            break
    if start_idx == -1: return None, None
    
    end_idx = len(lines)
    if end_str:
        for i in range(start_idx+1, len(lines)):
            if l.startswith(end_str): # wait, this is bugged, it should be lines[i]
                end_idx = i
                break
    return start_idx, end_idx

list_view_start = -1
board_view_start = -1
timeline_view_start = -1
for i, l in enumerate(lines):
    if l.startswith('function ListViewRenderer('): list_view_start = i
    if l.startswith('function SortableProjectItem('): sortable_start = i
    if l.startswith('function BoardViewRenderer('): board_view_start = i
    if l.startswith('function TimelineViewRenderer('): timeline_view_start = i

# Component texts
list_view_text = '\n'.join(lines[list_view_start-3:sortable_start-3])
board_view_text = '\n'.join(lines[sortable_start-3:timeline_view_start-3])
timeline_view_text = '\n'.join(lines[timeline_view_start-3:])

# Write to new files
out_dir = '/Users/jones/Downloads/kriri/frontend/src/components/projects'
os.makedirs(out_dir, exist_ok=True)

# Generate imports block. Need to fix relative paths since components/projects is one level deeper than pages/
new_imports = imports_text.replace('"../', '"../../').replace('from "../', 'from "../../').replace('from "@/registry', 'from "@/registry')

with open(os.path.join(out_dir, 'ListViewRenderer.jsx'), 'w') as f:
    f.write(new_imports + '\n' + list_view_text.replace('function ListViewRenderer', 'export default function ListViewRenderer'))

with open(os.path.join(out_dir, 'BoardViewRenderer.jsx'), 'w') as f:
    f.write(new_imports + '\nimport { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";\nimport { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, horizontalListSortingStrategy } from "@dnd-kit/sortable";\nimport { CSS } from "@dnd-kit/utilities";\nimport { useDroppable } from "@dnd-kit/core";\n\n' + board_view_text.replace('function BoardViewRenderer', 'export default function BoardViewRenderer'))

with open(os.path.join(out_dir, 'TimelineViewRenderer.jsx'), 'w') as f:
    f.write(new_imports + '\n' + timeline_view_text.replace('function TimelineViewRenderer', 'export default function TimelineViewRenderer'))

# Truncate Projects.jsx
projects_text = '\n'.join(lines[:list_view_start-3])
projects_imports = """
import ListViewRenderer from "../components/projects/ListViewRenderer";
import BoardViewRenderer from "../components/projects/BoardViewRenderer";
import TimelineViewRenderer from "../components/projects/TimelineViewRenderer";
"""
# Insert after first imports
import_insert_pos = projects_text.find('// ============================================================================')
final_projects_text = projects_text[:import_insert_pos] + projects_imports + projects_text[import_insert_pos:]

with open(p, 'w') as f:
    f.write(final_projects_text)

print("Split completed successfully!")
