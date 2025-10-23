import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Version {
  id: string;
  title: string;
  content: string;
  tags: string[];
  source: string | null;
  version_number: number;
  created_at: string;
}

interface InsightVersionHistoryProps {
  insightId: string;
  onRestore: (version: Version) => void;
  onClose: () => void;
}

export const InsightVersionHistory = ({ insightId, onRestore, onClose }: InsightVersionHistoryProps) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);

  useEffect(() => {
    loadVersions();
  }, [insightId]);

  const loadVersions = async () => {
    try {
      const { data, error } = await supabase
        .from('insight_versions')
        .select('*')
        .eq('insight_id', insightId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar histórico');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = (version: Version) => {
    onRestore(version);
    toast.success('Versão restaurada com sucesso');
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card border border-border rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Histórico de Versões</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Versions List */}
          <ScrollArea className="w-1/3 border-r border-border">
            <div className="p-4 space-y-2">
              {loading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : versions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma versão anterior</p>
              ) : (
                versions.map((version) => (
                  <motion.button
                    key={version.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedVersion(version)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedVersion?.id === version.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        Versão {version.version_number}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(version.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm font-medium truncate">{version.title}</p>
                  </motion.button>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Version Preview */}
          <div className="flex-1 flex flex-col">
            {selectedVersion ? (
              <>
                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{selectedVersion.title}</h3>
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: selectedVersion.content }}
                      />
                    </div>

                    {selectedVersion.source && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Fonte:</p>
                        <p className="text-sm">{selectedVersion.source}</p>
                      </div>
                    )}

                    {selectedVersion.tags && selectedVersion.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedVersion.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <div className="p-6 border-t border-border">
                  <Button
                    onClick={() => handleRestore(selectedVersion)}
                    className="w-full gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Recuperar esta versão
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <p>Selecione uma versão para visualizar</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
