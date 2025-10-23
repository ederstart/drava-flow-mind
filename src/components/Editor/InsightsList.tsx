import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, Tag, Calendar, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Insight {
  id: string;
  title: string;
  content: string;
  tags: string[];
  source?: string;
  created_at: string;
  updated_at: string;
}

interface InsightsListProps {
  onSelectInsight: (insight: Insight) => void;
  refresh?: number;
}

export const InsightsList = ({ onSelectInsight, refresh }: InsightsListProps) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInsights = async () => {
    try {
      const { data, error } = await supabase
        .from('insights')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setInsights(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar insights');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, [refresh]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Deseja realmente excluir este insight?')) return;

    try {
      const { error } = await supabase
        .from('insights')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setInsights(insights.filter(i => i.id !== id));
      toast.success('Insight excluído');
    } catch (error: any) {
      toast.error('Erro ao excluir insight');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Carregando insights...
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="p-12 text-center">
        <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg text-muted-foreground">
          Nenhum insight ainda. Crie seu primeiro!
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h3 className="text-xl font-semibold mb-4">Seus Insights</h3>
      
      <AnimatePresence>
        {insights.map((insight) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="insight-card p-4 cursor-pointer group"
            onClick={() => onSelectInsight(insight)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground mb-1 truncate">
                  {insight.title || 'Sem título'}
                </h4>
                
                <div 
                  className="text-sm text-muted-foreground line-clamp-2 mb-3 prose prose-sm"
                  dangerouslySetInnerHTML={{ __html: insight.content }}
                />

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(insight.updated_at).toLocaleDateString('pt-BR')}
                  </div>
                  
                  {insight.tags && insight.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <Tag className="w-3 h-3" />
                      {insight.tags.slice(0, 3).map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {insight.tags.length > 3 && (
                        <span className="text-xs">+{insight.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleDelete(insight.id, e)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
