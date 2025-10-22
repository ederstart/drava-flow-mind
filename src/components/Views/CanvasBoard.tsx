import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Pen, Eraser, Save, Trash2 } from 'lucide-react';

type Tool = 'pen' | 'eraser';

interface DrawingLine {
  tool: string;
  points: number[];
  stroke: string;
  strokeWidth: number;
}

export const CanvasBoard = () => {
  const [tool, setTool] = useState<Tool>('pen');
  const [lines, setLines] = useState<DrawingLine[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#1F2937');

  const handleMouseDown = (e: any) => {
    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, {
      tool,
      points: [pos.x, pos.y],
      stroke: tool === 'eraser' ? '#ffffff' : color,
      strokeWidth: tool === 'eraser' ? 20 : 3,
    }]);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing) return;
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const lastLine = lines[lines.length - 1];
    lastLine.points = lastLine.points.concat([point.x, point.y]);
    setLines(lines.slice(0, -1).concat(lastLine));
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const saveDrawing = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('drawings').insert([{
        user_id: user.id,
        title: 'Canvas',
        canvas_data: { elements: lines },
      }]);
      
      toast.success('Canvas salvo!');
    } catch (error: any) {
      toast.error('Erro ao salvar');
    }
  };

  const colors = ['#1F2937', '#EF4444', '#3B82F6', '#10B981'];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex gap-2">
          <Button size="icon" variant={tool === 'pen' ? 'default' : 'outline'} onClick={() => setTool('pen')}>
            <Pen className="w-4 h-4" />
          </Button>
          <Button size="icon" variant={tool === 'eraser' ? 'default' : 'outline'} onClick={() => setTool('eraser')}>
            <Eraser className="w-4 h-4" />
          </Button>
          {colors.map((c) => (
            <button key={c} className="w-8 h-8 rounded-full border-2" style={{ backgroundColor: c, borderColor: color === c ? '#000' : '#ddd' }} onClick={() => setColor(c)} />
          ))}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setLines([])}>
            <Trash2 className="w-4 h-4 mr-2" />
            Limpar
          </Button>
          <Button size="sm" onClick={saveDrawing}>
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>
      <div className="flex-1 bg-canvas">
        <Stage width={window.innerWidth - 300} height={window.innerHeight - 120} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
          <Layer>
            {lines.map((line, i) => (
              <Line key={i} points={line.points} stroke={line.stroke} strokeWidth={line.strokeWidth} tension={0.5} lineCap="round" lineJoin="round" />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};
