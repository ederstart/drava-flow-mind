import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Plus, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export type MindMapNodeData = {
  label: string;
  description?: string;
  isTitle?: boolean;
  isBold?: boolean;
  isItalic?: boolean;
  fontSize?: number;
  collapsed?: boolean;
  hasChildren?: boolean;
  onAddChild?: (nodeId: string) => void;
  onToggleCollapse?: (nodeId: string) => void;
  onUpdate?: (nodeId: string, data: Partial<MindMapNodeData>) => void;
  onDelete?: (nodeId: string) => void;
};

export const MindMapNode = memo(({ id, data }: NodeProps<MindMapNodeData>) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
  const [description, setDescription] = useState(data.description || '');
  const [showControls, setShowControls] = useState(false);
  const [showDescription, setShowDescription] = useState(false);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if ((label !== data.label || description !== data.description) && data.onUpdate) {
      data.onUpdate(id, { label, description });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setLabel(data.label);
      setIsEditing(false);
    }
  };

  const getFontSize = () => {
    if (data.isTitle) return 'text-xl';
    if (data.fontSize === 16) return 'text-lg';
    if (data.fontSize === 12) return 'text-sm';
    return 'text-base';
  };

  const getFontWeight = () => {
    return data.isBold ? 'font-bold' : 'font-medium';
  };

  const getFontStyle = () => {
    return data.isItalic ? 'italic' : '';
  };

  return (
    <div
      className="relative group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <Handle type="target" position={Position.Left} className="!bg-primary" />
      
      <Popover open={showDescription} onOpenChange={setShowDescription}>
        <PopoverTrigger asChild>
          <div
            className={`px-6 py-3 rounded-full shadow-lg border-2 border-primary bg-card transition-all hover:shadow-xl cursor-pointer ${
              data.collapsed ? 'opacity-75' : ''
            }`}
            onDoubleClick={handleDoubleClick}
          >
            {isEditing ? (
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                autoFocus
                className="h-auto min-w-[100px] border-none bg-transparent p-0 focus-visible:ring-0"
              />
            ) : (
              <div className="flex items-center gap-2">
                {data.hasChildren && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      data.onToggleCollapse?.(id);
                    }}
                    className="hover:bg-muted rounded p-1 transition-colors"
                  >
                    {data.collapsed ? (
                      <ChevronRight className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                )}
                <span
                  className={`${getFontSize()} ${getFontWeight()} ${getFontStyle()} text-foreground whitespace-nowrap`}
                >
                  {data.label}
                </span>
              </div>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-80" onClick={(e) => e.stopPropagation()}>
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Descrição</h4>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleBlur}
              placeholder="Adicione uma descrição para este nó..."
              className="min-h-[100px] text-sm"
            />
          </div>
        </PopoverContent>
      </Popover>

      {showControls && (
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="outline"
            className="h-6 w-6 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => data.onAddChild?.(id)}
          >
            <Plus className="w-3 h-3" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => {
              if (window.confirm('Excluir este nó e todos os seus filhos?')) {
                data.onDelete?.(id);
              }
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}

      {showControls && !isEditing && (
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-card border border-border rounded-lg shadow-lg p-2 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant={data.isBold ? 'default' : 'outline'}
            className="h-7 px-2 text-xs"
            onClick={() => data.onUpdate?.(id, { isBold: !data.isBold })}
          >
            <strong>B</strong>
          </Button>
          <Button
            size="sm"
            variant={data.isItalic ? 'default' : 'outline'}
            className="h-7 px-2 text-xs"
            onClick={() => data.onUpdate?.(id, { isItalic: !data.isItalic })}
          >
            <em>I</em>
          </Button>
          <Button
            size="sm"
            variant={data.isTitle ? 'default' : 'outline'}
            className="h-7 px-2 text-xs"
            onClick={() => data.onUpdate?.(id, { isTitle: !data.isTitle })}
          >
            T
          </Button>
          <Select
            value={String(data.fontSize || 14)}
            onValueChange={(value) => data.onUpdate?.(id, { fontSize: Number(value) })}
          >
            <SelectTrigger className="h-7 w-16 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12">12</SelectItem>
              <SelectItem value="14">14</SelectItem>
              <SelectItem value="16">16</SelectItem>
              <SelectItem value="18">18</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      
      <Handle type="source" position={Position.Right} className="!bg-primary" />
    </div>
  );
});