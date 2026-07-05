import { useEffect } from 'react';
import { useBoardContext } from '../../board/BoardContext';
import { PositionedItem } from '../types';

export const useKeyboardNavigation = (positionedItems: PositionedItem[]) => {
  const { selectedItemIds, setSelectedItemIds, setConfig } = useBoardContext();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Enter opens Inspector (focus logic or secondary action)
      if (e.key === 'Enter') {
        if (selectedItemIds.length > 0) {
          e.preventDefault();
          console.log(`[Keyboard] Opening Inspector for shift: ${selectedItemIds[0]}`);
          const inspectorEl = document.getElementById('inspector-panel');
          if (inspectorEl) {
            inspectorEl.classList.add('ring-2', 'ring-primary', 'ring-inset');
            setTimeout(() => inspectorEl.classList.remove('ring-2', 'ring-primary', 'ring-inset'), 300);
          }
        }
        return;
      }

      // 2. Escape clears selection
      if (e.key === 'Escape') {
        setSelectedItemIds([]);
        return;
      }

      // 3. Zoom Shortcuts (+ / -)
      if (e.key === '+' || e.key === '=') {
        setConfig(prev => ({
          ...prev,
          dayColumnWidth: Math.min(1200, prev.dayColumnWidth + 100)
        }));
        return;
      }

      if (e.key === '-' || e.key === '_') {
        setConfig(prev => ({
          ...prev,
          dayColumnWidth: Math.max(200, prev.dayColumnWidth - 100)
        }));
        return;
      }

      // 4. Arrow Keys Navigation
      const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);
      
      if (isArrowKey) {
        e.preventDefault(); // Prevent viewport scrolling when navigating

        // If nothing is selected, select the top-left most item
        if (selectedItemIds.length === 0) {
          if (positionedItems.length > 0) {
            const firstItem = [...positionedItems].sort((a, b) => a.y - b.y || a.x - b.x)[0];
            setSelectedItemIds([firstItem.id]);
          }
          return;
        }

        const currentId = selectedItemIds[0]; // Primary selected item
        const current = positionedItems.find(i => i.id === currentId);
        if (!current) return;

        let nextItem: PositionedItem | undefined;

        if (e.key === 'ArrowRight') {
          // Same row (y), next item to the right
          nextItem = positionedItems
            .filter(i => Math.abs(i.y - current.y) < 1 && i.x > current.x)
            .sort((a, b) => a.x - b.x)[0];
        } else if (e.key === 'ArrowLeft') {
          // Same row (y), previous item to the left
          nextItem = positionedItems
            .filter(i => Math.abs(i.y - current.y) < 1 && i.x < current.x)
            .sort((a, b) => b.x - a.x)[0];
        } else if (e.key === 'ArrowDown') {
          // Next row down (y > current.y)
          const belowItems = positionedItems.filter(i => i.y > current.y + 1);
          if (belowItems.length > 0) {
            const nextY = Math.min(...belowItems.map(i => i.y));
            const currentCenterX = current.x + current.width / 2;
            nextItem = belowItems
              .filter(i => Math.abs(i.y - nextY) < 1)
              .sort((a, b) => {
                const aDist = Math.abs((a.x + a.width / 2) - currentCenterX);
                const bDist = Math.abs((b.x + b.width / 2) - currentCenterX);
                return aDist - bDist;
              })[0];
          }
        } else if (e.key === 'ArrowUp') {
          // Previous row up (y < current.y)
          const aboveItems = positionedItems.filter(i => i.y < current.y - 1);
          if (aboveItems.length > 0) {
            const prevY = Math.max(...aboveItems.map(i => i.y));
            const currentCenterX = current.x + current.width / 2;
            nextItem = aboveItems
              .filter(i => Math.abs(i.y - prevY) < 1)
              .sort((a, b) => {
                const aDist = Math.abs((a.x + a.width / 2) - currentCenterX);
                const bDist = Math.abs((b.x + b.width / 2) - currentCenterX);
                return aDist - bDist;
              })[0];
          }
        }

        if (nextItem) {
          setSelectedItemIds([nextItem.id]);
          
          // Optional: Scroll the viewport to ensure the next item is visible
          // In a full implementation, we would query the DOM element and call scrollIntoView
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [positionedItems, selectedItemIds, setSelectedItemIds, setConfig]);
};
