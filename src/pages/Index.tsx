import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/Layout/Sidebar';
import { InsightEditorConnected } from '@/components/Editor/InsightEditorConnected';
import { InsightsList } from '@/components/Editor/InsightsList';
import { KanbanView } from '@/components/Views/KanbanView';
import { CanvasView } from '@/components/Views/CanvasView';
import { AgendaView } from '@/components/Views/AgendaView';
import { MindMapView } from '@/components/Views/MindMapView';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ViewType = 'editor' | 'kanban' | 'canvas' | 'agenda' | 'mindmap';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState<ViewType>('editor');
  const [currentInsight, setCurrentInsight] = useState<any>(null);
  const [refreshList, setRefreshList] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleNewInsight = () => {
    setCurrentInsight(null);
    setActiveView('editor');
  };

  const handleSelectInsight = (insight: any) => {
    setCurrentInsight(insight);
    setActiveView('editor');
  };

  const handleInsightSaved = () => {
    setRefreshList(prev => prev + 1);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Logout realizado com sucesso!');
      navigate('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Erro ao fazer logout');
    }
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
        onNewInsight={handleNewInsight}
      />
      
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="flex justify-end p-4 border-b border-border">
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
        {activeView === 'editor' ? (
          <Tabs defaultValue="editor" className="h-full flex flex-col">
            <TabsList className="m-4 w-fit">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="saved">Insights Salvos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="editor" className="flex-1 overflow-y-auto">
              <InsightEditorConnected 
                currentInsight={currentInsight}
                onSaved={handleInsightSaved}
              />
            </TabsContent>
            
            <TabsContent value="saved" className="flex-1 overflow-y-auto">
              <InsightsList 
                onSelectInsight={handleSelectInsight}
                refresh={refreshList}
              />
            </TabsContent>
          </Tabs>
        ) : activeView === 'kanban' ? (
          <KanbanView />
        ) : activeView === 'mindmap' ? (
          <MindMapView />
        ) : activeView === 'canvas' ? (
          <CanvasView />
        ) : (
          <AgendaView />
        )}
      </main>
    </div>
  );
};

export default Index;
