import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MindMap {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface MindMapsListProps {
  onSelectMap: (mapId: string) => void;
  onNewMap: () => void;
  currentMapId: string | null;
}

export const MindMapsList = ({ onSelectMap, onNewMap, currentMapId }: MindMapsListProps) => {
  const { user } = useAuth();
  const [maps, setMaps] = useState<MindMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const loadMaps = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('mind_maps')
        .select('id, title, created_at, updated_at')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setMaps(data || []);
    } catch (error) {
      console.error('Erro ao carregar mapas:', error);
      toast.error('Erro ao carregar mapas mentais');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaps();
  }, [user]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja deletar este mapa mental?')) return;

    try {
      const { error } = await supabase
        .from('mind_maps')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMaps(maps.filter(m => m.id !== id));
      if (currentMapId === id) {
        onNewMap();
      }
      toast.success('Mapa mental deletado');
    } catch (error) {
      console.error('Erro ao deletar:', error);
      toast.error('Erro ao deletar mapa mental');
    }
  };

  const handleRename = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    const map = maps.find(m => m.id === id);
    setEditTitle(map?.title || '');
  };

  const saveRename = async (id: string) => {
    if (!editTitle.trim()) return;

    try {
      const { error } = await supabase
        .from('mind_maps')
        .update({ title: editTitle })
        .eq('id', id);

      if (error) throw error;

      setMaps(maps.map(m => m.id === id ? { ...m, title: editTitle } : m));
      setEditingId(null);
      toast.success('Título atualizado');
    } catch (error) {
      console.error('Erro ao renomear:', error);
      toast.error('Erro ao renomear mapa mental');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Mapas Mentais</h2>
        <Button onClick={onNewMap} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Novo Mapa
        </Button>
      </div>

      {maps.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Nenhum mapa mental criado ainda</p>
          <Button onClick={onNewMap}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeiro Mapa
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {maps.map((map) => (
            <motion.div
              key={map.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  currentMapId === map.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => onSelectMap(map.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {editingId === map.id ? (
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => saveRename(map.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRename(map.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        className="h-8"
                      />
                    ) : (
                      <>
                        <h3 className="font-semibold text-foreground">{map.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          Atualizado em {format(new Date(map.updated_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => handleRename(map.id, e)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => handleDelete(map.id, e)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
