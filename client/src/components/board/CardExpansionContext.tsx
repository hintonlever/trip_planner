import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

interface CardExpansionState {
  isExpanded: (id: string) => boolean;
  toggle: (id: string) => void;
  expandAll: (ids: string[]) => void;
  collapseAll: () => void;
  allCollapsed: boolean;
}

const CardExpansionContext = createContext<CardExpansionState | null>(null);

export function CardExpansionProvider({ children }: { children: ReactNode }) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const isExpanded = useCallback((id: string) => expandedIds.has(id), [expandedIds]);

  const toggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback((ids: string[]) => {
    setExpandedIds(new Set(ids));
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  const allCollapsed = expandedIds.size === 0;

  return (
    <CardExpansionContext.Provider value={{ isExpanded, toggle, expandAll, collapseAll, allCollapsed }}>
      {children}
    </CardExpansionContext.Provider>
  );
}

export function useCardExpansion() {
  const ctx = useContext(CardExpansionContext);
  if (!ctx) throw new Error('useCardExpansion must be used within CardExpansionProvider');
  return ctx;
}
