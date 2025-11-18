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
import { Plus, Save, Trash2, Loader2, FileText, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MindMapNode, MindMapNodeData } from './MindMapNode';
import { MindMapsList } from './MindMapsList';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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
  const [showList, setShowList] = useState(false);
  const [showTextConverter, setShowTextConverter] = useState(false);
  const [textInput, setTextInput] = useState('');

  const callbacksRef = useRef<{
    handleAddChild: ((nodeId: string) => void) | null;
    handleToggleCollapse: ((nodeId: string) => void) | null;
    handleUpdateNode: ((nodeId: string, updates: Partial<MindMapNodeData>) => void) | null;
    handleDeleteNode: ((nodeId: string) => void) | null;
  }>({
    handleAddChild: null,
    handleToggleCollapse: null,
    handleUpdateNode: null,
    handleDeleteNode: null,
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

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      // Get all descendant nodes to delete
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
      const nodesToDelete = [nodeId, ...descendants];

      // Remove nodes
      setNodes((nds) => nds.filter((node) => !nodesToDelete.includes(node.id)));

      // Remove edges connected to deleted nodes
      setEdges((eds) =>
        eds.filter((edge) => !nodesToDelete.includes(edge.source) && !nodesToDelete.includes(edge.target))
      );

      // Update parent node if it lost all children
      const parentEdge = edges.find((e) => e.target === nodeId);
      if (parentEdge) {
        const parentId = parentEdge.source;
        const remainingChildren = edges.filter(
          (e) => e.source === parentId && e.target !== nodeId
        );
        
        if (remainingChildren.length === 0) {
          updateNodeChildren(parentId, false);
        }
      }

      toast.success('Nó excluído');
    },
    [edges]
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
            onDelete: callbacksRef.current.handleDeleteNode!,
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

  const addNode = useCallback((parentId?: string, label?: string, description?: string) => {
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
          label: label || '',
          description: description || '',
          isBold: false,
          isItalic: false,
          isTitle: false,
          fontSize: 14,
          collapsed: false,
          hasChildren: false,
          onAddChild: callbacksRef.current.handleAddChild!,
          onToggleCollapse: callbacksRef.current.handleToggleCollapse!,
          onUpdate: callbacksRef.current.handleUpdateNode!,
          onDelete: callbacksRef.current.handleDeleteNode!,
        },
    };

    setNodes((nds) => [...nds, newNode]);
    return newNode.id;
  }, []);

  const convertTextToMindMap = () => {
    if (!textInput.trim()) {
      toast.error('Digite algum texto para converter');
      return;
    }

    const lines = textInput.split('\n').filter(line => line.trim());
    const nodeMap = new Map<string, string>();
    const newNodes: Node<MindMapNodeData>[] = [];
    const newEdges: Edge[] = [];
    
    let currentTitle = '';
    let currentDescription = '';
    let yPosition = 100;

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Check if line ends with . indicating a title/node
      if (trimmed.endsWith('.')) {
        // Save previous node if exists
        if (currentTitle) {
          const nodeId = `node-${Date.now()}-${index}`;
          nodeMap.set(currentTitle.toLowerCase(), nodeId);
          
          newNodes.push({
            id: nodeId,
            type: 'mindmap',
            position: { x: 250, y: yPosition },
            data: {
              label: currentTitle,
              description: currentDescription.trim(),
              isBold: false,
              isItalic: false,
              isTitle: false,
              fontSize: 14,
              collapsed: false,
              hasChildren: false,
              onAddChild: callbacksRef.current.handleAddChild!,
              onToggleCollapse: callbacksRef.current.handleToggleCollapse!,
              onUpdate: callbacksRef.current.handleUpdateNode!,
              onDelete: callbacksRef.current.handleDeleteNode!,
            },
          });
          
          yPosition += 100;
        }
        
        // Start new node
        currentTitle = trimmed.slice(0, -1);
        currentDescription = '';
      } else {
        // Add to description
        currentDescription += (currentDescription ? '\n' : '') + trimmed;
      }
    });

    // Add last node
    if (currentTitle) {
      const nodeId = `node-${Date.now()}-last`;
      nodeMap.set(currentTitle.toLowerCase(), nodeId);
      
      newNodes.push({
        id: nodeId,
        type: 'mindmap',
        position: { x: 250, y: yPosition },
        data: {
          label: currentTitle,
          description: currentDescription.trim(),
          isBold: false,
          isItalic: false,
          isTitle: false,
          fontSize: 14,
          collapsed: false,
          hasChildren: false,
          onAddChild: callbacksRef.current.handleAddChild!,
          onToggleCollapse: callbacksRef.current.handleToggleCollapse!,
          onUpdate: callbacksRef.current.handleUpdateNode!,
          onDelete: callbacksRef.current.handleDeleteNode!,
        },
      });
    }

    // Connect first node to others
    if (newNodes.length > 1) {
      const firstNodeId = newNodes[0].id;
      newNodes.slice(1).forEach((node, idx) => {
        newEdges.push({
          id: `edge-${Date.now()}-${idx}`,
          source: firstNodeId,
          target: node.id,
          type: 'smoothstep',
          animated: true,
        });
      });
      
      // Update first node to have children
      newNodes[0].data.hasChildren = true;
    }

    setNodes(newNodes);
    setEdges(newEdges);
    setShowTextConverter(false);
    setTextInput('');
    toast.success('Mapa mental criado com sucesso!');
  };

  // Update ref with stable callbacks
  useEffect(() => {
    callbacksRef.current = {
      handleAddChild,
      handleToggleCollapse,
      handleUpdateNode,
      handleDeleteNode,
    };
  }, [handleAddChild, handleToggleCollapse, handleUpdateNode, handleDeleteNode]);

  const loadMindMap = useCallback(async (mapId: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mind_maps')
        .select('*')
        .eq('id', mapId)
        .single();

      if (error) throw error;

      if (data) {
        setCurrentMapId(data.id);
        setTitle(data.title);
        
        const loadedNodes = ((data.nodes as any) || []).map((node: any) => ({
          ...node,
          data: {
            ...node.data,
            onAddChild: callbacksRef.current.handleAddChild!,
            onToggleCollapse: callbacksRef.current.handleToggleCollapse!,
            onUpdate: callbacksRef.current.handleUpdateNode!,
            onDelete: callbacksRef.current.handleDeleteNode!,
          },
        }));
        
        setNodes(loadedNodes);
        setEdges((data.edges as any) || []);
      }
    } catch (error) {
      console.error('Error loading mind map:', error);
      toast.error('Erro ao carregar mapa mental');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createNewMap = () => {
    setNodes([]);
    setEdges([]);
    setTitle('Novo Mapa Mental');
    setCurrentMapId(null);
    setShowList(false);
  };

  useEffect(() => {
    setLoading(false);
  }, []);

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
      createNewMap();
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

  if (showList) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full flex flex-col"
      >
        <div className="p-6 border-b border-border">
          <Button onClick={() => setShowList(false)} variant="outline" size="sm">
            ← Voltar ao Editor
          </Button>
        </div>
        <MindMapsList
          onSelectMap={(mapId) => {
            loadMindMap(mapId);
            setShowList(false);
          }}
          onNewMap={createNewMap}
          currentMapId={currentMapId}
        />
      </motion.div>
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
              Clique em um nó para adicionar descrição • Duplo clique para editar
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowList(true)}
              variant="outline"
              size="sm"
            >
              <List className="w-4 h-4 mr-2" />
              Meus Mapas
            </Button>
            <Dialog open={showTextConverter} onOpenChange={setShowTextConverter}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Texto → Mapa
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Converter Texto em Mapa Mental</DialogTitle>
                  <DialogDescription>
                    Digite títulos terminados em ponto (.) e suas descrições abaixo. Cada título vira um nó conectado ao primeiro.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Exemplo:&#10;Loja.&#10;Escolhi o nome Mimas, lua de Saturno, para reconectar pessoas.&#10;&#10;Paleta de cores.&#10;Branco mármore #ffffe0, verde suave.&#10;&#10;Visão de futuro.&#10;Expandir para 5 lojas em 3 anos."
                    className="min-h-[300px] font-mono text-sm"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowTextConverter(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={convertTextToMindMap}>
                      Criar Mapa Mental
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              onClick={() => addNode()}
              variant="outline"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Nó
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
              <strong>Clique no nó</strong> para descrição • <strong>Duplo clique</strong> para editar • <strong>+</strong> para adicionar filho
            </p>
          </Panel>
        </ReactFlow>
      </div>
    </motion.div>
  );
};