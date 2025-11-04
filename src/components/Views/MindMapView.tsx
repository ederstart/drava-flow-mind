import { useState, useCallback, useEffect, useRef } from 'react';
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
import { MindMapNode, MindMapNodeData } from './MindMapNode';

const nodeTypes = {
  mindmap: MindMapNode,
};

export const MindMapView = () => {
  const { user } = useAuth();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [title, setTitle] = useState('Novo Mapa Mental');
  const [currentMapId, setCurrentMapId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const callbacksRef = useRef<{
    handleAddChild: ((nodeId: string) => void) | null;
    handleToggleCollapse: ((nodeId: string) => void) | null;
    handleUpdateNode: ((nodeId: string, updates: Partial<MindMapNodeData>) => void) | null;
  }>({
    handleAddChild: null,
    handleToggleCollapse: null,
    handleUpdateNode: null,
  });

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const updateNodeChildren = (nodeId: string, hasChildren: boolean) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: { ...node.data, hasChildren },
            }
          : node
      )
    );
  };

  const handleUpdateNode = useCallback(
    (nodeId: string, updates: Partial<MindMapNodeData>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: { ...node.data, ...updates },
              }
            : node
        )
      );
    },
    []
  );

  const handleToggleCollapse = useCallback(
    (nodeId: string) => {
      setNodes((nds) => {
        const node = nds.find((n) => n.id === nodeId);
        if (!node) return nds;

        const isCollapsed = !node.data.collapsed;
        
        // Get all descendant nodes
        const getDescendants = (id: string, currentEdges: Edge[]): string[] => {
          const children = currentEdges
            .filter((e) => e.source === id)
            .map((e) => e.target);
          return [
            ...children,
            ...children.flatMap((childId) => getDescendants(childId, currentEdges)),
          ];
        };

        const descendants = getDescendants(nodeId, edges);

        return nds.map((n) => {
          if (n.id === nodeId) {
            return {
              ...n,
              data: { ...n.data, collapsed: isCollapsed },
            };
          }
          if (descendants.includes(n.id)) {
            return {
              ...n,
              hidden: isCollapsed,
            };
          }
          return n;
        });
      });

      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.source === nodeId) {
            return { ...edge, hidden: !edges.find(e => e.source === nodeId && !e.hidden) };
          }
          return edge;
        })
      );
    },
    [edges]
  );

  const handleAddChild = useCallback(
    (nodeId: string) => {
      const newNode: Node<MindMapNodeData> = {
        id: `node-${Date.now()}`,
        type: 'mindmap',
        position: {
          x: (nodes.find((n) => n.id === nodeId)?.position.x || 0) + 200,
          y: (nodes.find((n) => n.id === nodeId)?.position.y || 0) + 50,
        },
        data: {
          label: 'Nova Ideia',
          isBold: false,
          isItalic: false,
          isTitle: false,
          fontSize: 14,
          collapsed: false,
          hasChildren: false,
          onAddChild: callbacksRef.current.handleAddChild!,
          onToggleCollapse: callbacksRef.current.handleToggleCollapse!,
          onUpdate: callbacksRef.current.handleUpdateNode!,
        },
      };

      setNodes((nds) => [...nds, newNode]);

      const newEdge: Edge = {
        id: `edge-${Date.now()}`,
        source: nodeId,
        target: newNode.id,
        type: 'smoothstep',
        animated: true,
      };
      setEdges((eds) => [...eds, newEdge]);
      updateNodeChildren(nodeId, true);
    },
    [nodes]
  );

  const addNode = useCallback((parentId?: string) => {
    if (parentId) {
      callbacksRef.current.handleAddChild?.(parentId);
      return;
    }

    const newNode: Node<MindMapNodeData> = {
      id: `node-${Date.now()}`,
      type: 'mindmap',
      position: {
        x: Math.random() * 300 + 100,
        y: Math.random() * 300 + 100,
      },
      data: {
        label: 'Nova Ideia',
        isBold: false,
        isItalic: false,
        isTitle: false,
        fontSize: 14,
        collapsed: false,
        hasChildren: false,
        onAddChild: callbacksRef.current.handleAddChild!,
        onToggleCollapse: callbacksRef.current.handleToggleCollapse!,
        onUpdate: callbacksRef.current.handleUpdateNode!,
      },
    };

    setNodes((nds) => [...nds, newNode]);
  }, []);

  // Update ref with stable callbacks
  useEffect(() => {
    callbacksRef.current = {
      handleAddChild,
      handleToggleCollapse,
      handleUpdateNode,
    };
  }, [handleAddChild, handleToggleCollapse, handleUpdateNode]);

  const loadMindMaps = useCallback(async () => {
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
        
        // Load nodes with proper callbacks
        const loadedNodes = ((map.nodes as any) || []).map((node: any) => ({
          ...node,
          data: {
            ...node.data,
            onAddChild: callbacksRef.current.handleAddChild!,
            onToggleCollapse: callbacksRef.current.handleToggleCollapse!,
            onUpdate: callbacksRef.current.handleUpdateNode!,
          },
        }));
        
        setNodes(loadedNodes);
        setEdges((map.edges as any) || []);
      }
    } catch (error) {
      console.error('Error loading mind map:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadMindMaps();
  }, [loadMindMaps]);

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
    if (window.confirm('Tem certeza que deseja limpar o mapa mental?')) {
      setNodes([]);
      setEdges([]);
      setTitle('Novo Mapa Mental');
      setCurrentMapId(null);
      toast.success('Mapa mental limpo!');
    }
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
              onClick={() => addNode()}
              variant="outline"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Nó Raiz
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
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
            style: { stroke: 'hsl(var(--primary))', strokeWidth: 2 },
          }}
        >
          <Background gap={16} color="hsl(var(--muted))" />
          <Controls />
          <MiniMap
            nodeColor={(node) => 'hsl(var(--primary))'}
            maskColor="hsl(var(--background) / 0.8)"
          />
          <Panel position="top-center" className="bg-card/90 backdrop-blur-sm px-4 py-2 rounded-full border border-border shadow-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Duplo clique</strong> para editar • <strong>Hover</strong> para controles • <strong>Clique no ícone</strong> para ocultar filhos
            </p>
          </Panel>
        </ReactFlow>
      </div>
    </motion.div>
  );
};