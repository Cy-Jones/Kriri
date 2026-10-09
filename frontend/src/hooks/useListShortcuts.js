import { useEffect } from 'react';

function isInputFocused() {
  const el = document.activeElement;
  if (!el) return false;
  
  const tagName = el.tagName.toLowerCase();
  const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';
  const isContentEditable = el.isContentEditable;
  
  return isInput || isContentEditable;
}

export function useListShortcuts({
  items,
  activeIndex,
  setActiveIndex,
  onOpenItem,
  onEditItem,
  onAssignItem,
  onChangeStatus,
  onChangePriority,
  onChangeDueDate,
  onCreateItem
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isInputFocused()) return;

      const key = e.key.toLowerCase();

      // Navigation
      if (key === 'arrowdown' || key === 'j') {
        e.preventDefault();
        setActiveIndex(prev => {
          if (prev === null) return items.length > 0 ? 0 : null;
          return prev < items.length - 1 ? prev + 1 : prev;
        });
        return;
      }

      if (key === 'arrowup' || key === 'k') {
        e.preventDefault();
        setActiveIndex(prev => {
          if (prev === null) return items.length > 0 ? items.length - 1 : null;
          return prev > 0 ? prev - 1 : 0;
        });
        return;
      }

      // Actions on active item
      if (activeIndex !== null && items[activeIndex]) {
        const activeItem = items[activeIndex];
        
        switch(key) {
          case 'enter':
            e.preventDefault();
            onOpenItem?.(activeItem);
            break;
          case 'e':
            e.preventDefault();
            onEditItem?.(activeItem);
            break;
          case 'a':
            e.preventDefault();
            onAssignItem?.(activeItem);
            break;
          case 's':
            e.preventDefault();
            onChangeStatus?.(activeItem);
            break;
          case 'p':
            e.preventDefault();
            onChangePriority?.(activeItem);
            break;
          case 'd':
            e.preventDefault();
            onChangeDueDate?.(activeItem);
            break;
        }
      }

      // Create new
      if (key === 'n') {
        e.preventDefault();
        onCreateItem?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, activeIndex, setActiveIndex, onOpenItem, onEditItem, onAssignItem, onChangeStatus, onChangePriority, onChangeDueDate, onCreateItem]);
}
