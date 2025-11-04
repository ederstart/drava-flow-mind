import { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Connection,
  useNodesState,
  useEdgesState,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion } from 'framer-motion';
import { Plus, Save, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const nodeTypes = {
  default: ({ data }: any) => (
    <div className="px-4 py-2 shadow-lg rounded-lg border-2 border-primary bg-card">
      <div className="font-semibold text-foreground">{data.label}</div>
    </div>
  ),
};

export const MindMapView = () => {
  const { user } = useAuth();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [title, setTitle] = useState('Novo Mapa Mental');
  const [currentMapId, setCurrentMapId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMindMaps();
  }, [user]);

  const loadMindMaps = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('mind_maps')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const map = data[0];
        setCurrentMapId(map.id);
        setTitle(map.title);
        setNodes((map.nodes as any) || []);
        setEdges((map.edges as any) || []);
      }
    } catch (error) {
      console.error('Error loading mind map:', error);
    } finally {
      setLoading(false);
    }
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = () => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'default',
      position: {
        x: Math.random() * 500,
        y: Math.random() * 500,
      },
      data: { label: 'Nova Ideia' },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const saveMindMap = async () => {
    if (!user) {
      toast.error('Você precisa estar logado para salvar');
      return;
    }

    setSaving(true);
    try {
      const mapData = {
        user_id: user.id,
        title,
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
      };

      if (currentMapId) {
        const { error } = await supabase
          .from('mind_maps')
          .update(mapData)
          .eq('id', currentMapId);

        if (error) throw error;
        toast.success('Mapa mental atualizado!');
      } else {
        const { data, error } = await supabase
          .from('mind_maps')
          .insert([mapData])
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setCurrentMapId(data.id);
          toast.success('Mapa mental salvo!');
        }
      }
    } catch (error) {
      console.error('Error saving mind map:', error);
      toast.error('Erro ao salvar mapa mental');
    } finally {
      setSaving(false);
    }
  };

  const clearMindMap = () => {
    setNodes([]);
    setEdges([]);
    setTitle('Novo Mapa Mental');
    setCurrentMapId(null);
    toast.success('Mapa mental limpo!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col"
    >
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex-1 mr-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-2xl font-bold border-none bg-transparent focus-visible:ring-0 px-0"
              placeholder="Título do Mapa Mental"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Crie mapas mentais com múltiplas ramificações
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={addNode}
              variant="outline"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Nó
            </Button>
            <Button
              onClick={clearMindMap}
              variant="outline"
              size="sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar
            </Button>
            <Button
              onClick={saveMindMap}
              disabled={saving}
              size="sm"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
          <Panel position="top-center" className="bg-card/80 backdrop-blur-sm p-2 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground">
              Arraste os nós para reorganizar • Conecte os nós clicando e arrastando • Duplo clique para editar
            </p>
          </Panel>
        </ReactFlow>
      </div>
    </motion.div>
  );
};