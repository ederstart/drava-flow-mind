import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Layout/Sidebar';
import { InsightEditor } from '@/components/Editor/InsightEditor';
import { KanbanView } from '@/components/Views/KanbanView';
import { CanvasView } from '@/components/Views/CanvasView';
import { AgendaView } from '@/components/Views/AgendaView';
import { useInsightStore } from '@/store/useInsightStore';

type ViewType = 'editor' | 'kanban' | 'canvas' | 'agenda';

const Index = () => {
  const [activeView, setActiveView] = useState<ViewType>('editor');
  const { setCurrentInsight } = useInsightStore();

  const handleNewInsight = () => {
    setCurrentInsight(null);
    setActiveView('editor');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleNewInsight();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        onNewInsight={handleNewInsight}
      />
      
      <main className="flex-1 overflow-y-auto">
        {activeView === 'editor' && <InsightEditor />}
        {activeView === 'kanban' && <KanbanView />}
        {activeView === 'canvas' && <CanvasView />}
        {activeView === 'agenda' && <AgendaView />}
      </main>
    </div>
  );
};

export default Index;
