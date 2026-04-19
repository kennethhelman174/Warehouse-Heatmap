import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Text, Circle, Group, Transformer, Line } from 'react-konva';
import { motion, AnimatePresence } from 'motion/react';
import { Stage as KonvaStage } from 'konva/lib/Stage';
import { Transformer as KonvaTransformer } from 'konva/lib/shapes/Transformer';
import { Node as KonvaNode } from 'konva/lib/Node';
import { useMapStore, MapTool } from '../store/useMapStore';
import { useAppStore } from '../store/useAppStore';
import { 
  ZoomIn, ZoomOut, Hand, MousePointer2, Layers, Plus, Square, Trash2, 
  Loader2, AlertCircle, Save, Share2, History, Settings2, GitBranch,
  Network, Move, ArrowRight, ShieldAlert, Construction, Info, X, Check,
  CircleDot
} from 'lucide-react';
import { snapToGrid, snapValue } from '../lib/snapping';
import { Zone, NodeType, MapNode, MapEdge, ZoneType, EngineeringInsight } from '../types';

export function MapWorkspace() {
  const { activeFacility } = useAppStore();
  const { 
    zones, events, nodes, edges, mapVersions, currentVersionId,
    selectedId, selectedType, isLoading, error, isSnapEnabled, gridSize,
    fetchData, fetchVersions, addZone, updateZone, removeZone, 
    addNode, updateNode, removeNode, addEdge, removeEdge, setSelected,
    setCurrentVersion, setSnapEnabled, insights
  } = useMapStore();

  const [scale, setScale] = useState(5);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [tool, setTool] = useState<MapTool>('select');
  const [showZones, setShowZones] = useState(true);
  const [showNetwork, setShowNetwork] = useState(true);
  const [showHotspots, setShowHotspots] = useState(true);
  const [newZone, setNewZone] = useState<any>(null);
  const [tempEdge, setTempEdge] = useState<{from: string, toX: number, toY: number} | null>(null);
  
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<KonvaStage>(null);
  const trRef = useRef<KonvaTransformer>(null);
  const selectedShapeRef = useRef<KonvaNode>(null);

  // Responsive Sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    
    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (activeFacility) {
      fetchVersions(activeFacility.id);
      fetchData();
    }
  }, [activeFacility]);

  // Handle Selection Transformer
  useEffect(() => {
    if (tool === 'select' && selectedId && selectedShapeRef.current) {
      const tr = trRef.current;
      if (tr) {
        tr.nodes([selectedShapeRef.current]);
        tr.getLayer()?.batchDraw();
      }
    } else if (trRef.current) {
      const tr = trRef.current;
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
    }
  }, [selectedId, tool]);

  // Snapping Logic Wrapper
  const getSnappedPos = useCallback((raw: {x: number, y: number}) => {
    return isSnapEnabled ? snapToGrid(raw, gridSize) : raw;
  }, [isSnapEnabled, gridSize]);

  // Interaction Handlers
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const scaleBy = 1.1;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    setScale(newScale);
    setPosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  const handleMouseDown = (e: any) => {
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    
    const viewScale = stage.scaleX();
    const worldX = (pointer.x - stage.x()) / viewScale;
    const worldY = (pointer.y - stage.y()) / viewScale;
    const snapped = getSnappedPos({ x: worldX, y: worldY });
    const isZoneTool = ['zone', 'restricted', 'barrier', 'blind_corner', 'rack'].includes(tool);

    if (isZoneTool) {
      setNewZone({ ...snapped, width: 0, height: 0, toolOrigin: tool });
    } else if (tool === 'node') {
      addNode({
        id: `node-${Date.now()}`,
        versionId: currentVersionId || 'v1',
        x: snapped.x,
        y: snapped.y,
        type: 'standard'
      });
    } else if (tool === 'path' && selectedId && selectedType === 'node') {
      setTempEdge({ from: selectedId, toX: snapped.x, toY: snapped.y });
    } else if (tool === 'select') {
      if (e.target === stage || e.target.name() === 'background') {
        setSelected(null, null);
      }
    }
  };

  const handleMouseMove = (e: any) => {
    const stage = stageRef.current;
    if (!stage) return;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    
    const viewScale = stage.scaleX();
    const worldX = (pointer.x - stage.x()) / viewScale;
    const worldY = (pointer.y - stage.y()) / viewScale;
    const snapped = getSnappedPos({ x: worldX, y: worldY });

    if (tool === 'zone' && newZone) {
      setNewZone({
        ...newZone,
        width: snapped.x - newZone.x,
        height: snapped.y - newZone.y,
      });
    } else if (tool === 'path' && tempEdge) {
      setTempEdge({ ...tempEdge, toX: worldX, toY: worldY });
    }
  };

  const handleMouseUp = (e: any) => {
    if (['zone', 'restricted', 'barrier', 'blind_corner', 'rack'].includes(tool) && newZone) {
      if (Math.abs(newZone.width) > 0.1 && Math.abs(newZone.height) > 0.1) {
        let { x, y, width, height, toolOrigin } = newZone;
        if (width < 0) { x = x + width; width = Math.abs(width); }
        if (height < 0) { y = y + height; height = Math.abs(height); }
        
        let type: ZoneType = 'staging';
        let color = 'rgba(112, 0, 255, 0.2)';
        
        if (toolOrigin === 'restricted') { type = 'restricted'; color = 'rgba(239, 68, 68, 0.3)'; }
        if (toolOrigin === 'barrier') { type = 'barrier'; color = 'rgba(100, 116, 139, 0.8)'; }
        if (toolOrigin === 'blind_corner') { type = 'blind_corner'; color = 'rgba(249, 115, 22, 0.3)'; }
        if (toolOrigin === 'rack') { type = 'rack'; color = 'rgba(59, 130, 246, 0.3)'; }

        addZone({
          id: `zone-${Date.now()}`,
          versionId: currentVersionId || 'v1',
          name: `New ${type.replace('_', ' ')}`,
          type,
          x, y, width, height,
          rotation: 0,
          color
        });
      }
      setNewZone(null);
    } else if (tool === 'path' && tempEdge) {
      const stage = stageRef.current;
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const target = stage.getIntersection(pointer);
      const toNodeId = target?.parent?.attrs?.id;

      if (toNodeId && toNodeId !== tempEdge.from && toNodeId.startsWith('node-')) {
        addEdge({
          id: `edge-${Date.now()}`,
          versionId: currentVersionId || 'v1',
          from: tempEdge.from,
          to: toNodeId,
          weight: 1,
          type: 'forklift'
        });
      }
      setTempEdge(null);
    }
  };

  const handleDragEnd = (e: any, id: string, type: any) => {
    if (tool !== 'select') return;
    const pos = getSnappedPos({ x: e.target.x(), y: e.target.y() });
    
    if (type === 'zone') {
      updateZone(id, { x: pos.x, y: pos.y });
    } else if (type === 'node') {
      updateNode(id, { x: pos.x, y: pos.y });
    }
  };

  const handleTransformEnd = (e: any, id: string) => {
    const node = selectedShapeRef.current;
    if (!node) return;
    
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);

    const updates = {
      x: node.x(),
      y: node.y(),
      width: Math.max(0.1, node.width() * scaleX),
      height: Math.max(0.1, node.height() * scaleY),
    };

    if (isSnapEnabled) {
      updates.x = snapValue(updates.x, gridSize);
      updates.y = snapValue(updates.y, gridSize);
      updates.width = snapValue(updates.width, gridSize);
      updates.height = snapValue(updates.height, gridSize);
    }

    updateZone(id, updates);
  };

  const selectedItem = zones.find(z => z.id === selectedId) || nodes.find(n => n.id === selectedId);

  if (isLoading) return (
    <div className="h-full flex flex-col items-center justify-center text-white/60">
      <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#7000ff]" />
      <p>Syncing spatial model...</p>
    </div>
  );

  return (
    <div className="flex h-full flex-col bg-[#050510]">
      {/* Engineering Header */}
      <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 shrink-0 bg-black/40 backdrop-blur-md">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Construction className="w-5 h-5 text-[#7000ff]" />
            <h2 className="font-bold text-white uppercase tracking-wider text-sm">Map Studio</h2>
          </div>
          
          <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10">
            <GitBranch className="w-4 h-4 text-white/40 ml-2 mr-2" />
            <select 
              value={currentVersionId || ''} 
              onChange={(e) => setCurrentVersion(e.target.value)}
              className="bg-transparent text-sm text-white/80 border-none focus:ring-0 cursor-pointer"
            >
              {mapVersions.map(v => (
                <option key={v.id} value={v.id} className="bg-[#1a1a2a]">
                  {v.name} ({v.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button className="flex items-center px-3 py-1.5 rounded-md text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all">
            <History className="w-3.5 h-3.5 mr-1.5" />
            HISTORY
          </button>
          <button className="flex items-center px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-bold hover:bg-white/20">
            <Save className="w-3.5 h-3.5 mr-1.5" />
            DRAFT
          </button>
          <button className="flex items-center px-4 py-1.5 rounded-lg bg-[#7000ff] text-white text-xs font-bold hover:bg-[#5a00cc] shadow-[0_0_20px_rgba(112,0,255,0.3)]">
            <Share2 className="w-3.5 h-3.5 mr-1.5" />
            PUBLISH
          </button>
        </div>
      </div>

      {/* Workspace Controls */}
      <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 shrink-0 bg-white/2">
        <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5">
          <ToolButton active={tool === 'select'} icon={MousePointer2} onClick={() => setTool('select')} title="Select" />
          <ToolButton active={tool === 'pan'} icon={Hand} onClick={() => setTool('pan')} title="Pan" />
          <ToolDivider />
          <ToolButton active={tool === 'zone'} icon={Square} onClick={() => setTool('zone')} title="New Zone" />
          <ToolButton active={tool === 'node'} icon={CircleDot} onClick={() => setTool('node')} title="Add Node" />
          <ToolButton active={tool === 'path'} icon={ArrowRight} onClick={() => setTool('path')} title="Draw Edge" />
          <ToolButton active={tool === 'rack'} icon={Layers} onClick={() => setTool('rack')} title="New Rack" />
          <ToolDivider />
          <ToolButton active={tool === 'barrier'} icon={ShieldAlert} onClick={() => setTool('barrier')} title="Barrier" />
          <ToolButton active={tool === 'restricted'} icon={Construction} onClick={() => setTool('restricted')} title="Restricted Zone" />
          <ToolButton active={tool === 'blind_corner'} icon={AlertCircle} onClick={() => setTool('blind_corner')} title="Blind Corner" />
        </div>

        <div className="flex items-center space-x-4">
           <div className="flex items-center space-x-3 bg-white/5 px-3 py-1 rounded-md border border-white/10">
             <label className="flex items-center text-[10px] font-bold text-white/40 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">
               <input type="checkbox" checked={isSnapEnabled} onChange={e => setSnapEnabled(e.target.checked)} className="mr-2" />
               Snap: {gridSize}ft
             </label>
           </div>
           
           <div className="flex items-center bg-white/5 rounded-md px-2 py-1">
             <ZoomOut className="w-3.5 h-3.5 text-white/40 cursor-pointer hover:text-white" onClick={() => setScale(s => s / 1.5)} />
             <span className="text-[10px] font-mono text-white/80 w-12 text-center">{Math.round(scale * 100)}%</span>
             <ZoomIn className="w-3.5 h-3.5 text-white/40 cursor-pointer hover:text-white" onClick={() => setScale(s => s * 1.5)} />
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 relative bg-[#0f0f1b]" ref={containerRef}>
          <Stage
            width={stageSize.width}
            height={stageSize.height}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            scaleX={scale}
            scaleY={scale}
            x={position.x}
            y={position.y}
            draggable={tool === 'pan'}
            ref={stageRef}
            className={tool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'}
          >
            <Layer>
              {/* Background & Grid */}
              {activeFacility && (
                <>
                  <Rect
                    name="background"
                    x={0} y={0} width={activeFacility.width} height={activeFacility.height}
                    fill="#0f0f1b"
                  />
                  {/* Grid Lines */}
                  {Array.from({ length: Math.ceil(activeFacility.width / gridSize) + 1 }).map((_, i) => (
                    <Line 
                      key={`v-${i}`} 
                      points={[i * gridSize, 0, i * gridSize, activeFacility.height]} 
                      stroke="rgba(255,255,255,0.03)" 
                      strokeWidth={0.5 / scale} 
                    />
                  ))}
                  {Array.from({ length: Math.ceil(activeFacility.height / gridSize) + 1 }).map((_, i) => (
                    <Line 
                      key={`h-${i}`} 
                      points={[0, i * gridSize, activeFacility.width, i * gridSize]} 
                      stroke="rgba(255,255,255,0.03)" 
                      strokeWidth={0.5 / scale} 
                    />
                  ))}
                </>
              )}

              {/* Zones */}
              {showZones && zones.map((zone) => (
                <EngineeringZone 
                  key={zone.id} 
                  zone={zone} 
                  isSelected={selectedId === zone.id}
                  tool={tool}
                  scale={scale}
                  onSelect={(e: any) => {
                    e.cancelBubble = true;
                    setSelected(zone.id, 'zone');
                  }}
                  onDragEnd={(e: any) => handleDragEnd(e, zone.id, 'zone')}
                  onTransformEnd={(e: any) => handleTransformEnd(e, zone.id)}
                  shapeRef={selectedId === zone.id ? selectedShapeRef : null}
                />
              ))}

              {/* Network Graph */}
              {showNetwork && (
                <>
                  {edges.map(edge => {
                    const from = nodes.find(n => n.id === edge.from);
                    const to = nodes.find(n => n.id === edge.to);
                    if (!from || !to) return null;
                    
                    const isPedestrian = edge.type === 'pedestrian';
                    const isOneWay = edge.isOneWay;
                    
                    return (
                      <Group key={edge.id}>
                        <Line
                          points={[from.x, from.y, to.x, to.y]}
                          stroke={isPedestrian ? '#22c55e' : '#7000ff'}
                          strokeWidth={2 / scale}
                          opacity={0.6}
                          dash={isPedestrian ? [5/scale, 2/scale] : []}
                        />
                        {isOneWay && (
                           <OneWayArrow from={from} to={to} scale={scale} color={isPedestrian ? '#22c55e' : '#7000ff'} />
                        )}
                      </Group>
                    );
                  })}
                  {nodes.map(node => (
                    <Group 
                      key={node.id} 
                      id={node.id}
                      x={node.x} y={node.y}
                      draggable={tool === 'select'}
                      onDragEnd={(e) => handleDragEnd(e, node.id, 'node')}
                      onClick={() => setSelected(node.id, 'node')}
                      onMouseEnter={(e: any) => e.target.getStage().container().style.cursor = 'pointer'}
                      onMouseLeave={(e: any) => e.target.getStage().container().style.cursor = tool === 'pan' ? 'grab' : 'crosshair'}
                    >
                      <Circle 
                        radius={node.type === 'intersection' ? 4 / scale : 3 / scale} 
                        fill={selectedId === node.id ? '#00d4ff' : 
                          node.type === 'hazard_point' ? '#ef4444' : 
                          node.type === 'crossing_point' ? '#fbbf24' : '#ffffff'} 
                        stroke="#000"
                        strokeWidth={0.5 / scale}
                      />
                    </Group>
                  ))}
                </>
              )}

              {/* Engineering Hotspots */}
              {showHotspots && insights.map((insight: any) => (
                <HotspotPulse key={insight.id} insight={insight} scale={scale} />
              ))}

              {/* Temp Drawing Elements */}
              {newZone && (
                <Rect
                  x={newZone.width < 0 ? newZone.x + newZone.width : newZone.x}
                  y={newZone.height < 0 ? newZone.y + newZone.height : newZone.y}
                  width={Math.abs(newZone.width)}
                  height={Math.abs(newZone.height)}
                  fill="rgba(112, 0, 255, 0.2)"
                  stroke="#7000ff"
                  strokeWidth={1 / scale}
                  dash={[5 / scale, 2 / scale]}
                />
              )}
              {tempEdge && (
                <Line
                  points={[
                    nodes.find(n => n.id === tempEdge.from)?.x || 0,
                    nodes.find(n => n.id === tempEdge.from)?.y || 0,
                    tempEdge.toX, tempEdge.toY
                  ]}
                  stroke="#00d4ff"
                  strokeWidth={1 / scale}
                  dash={[5 / scale, 2 / scale]}
                />
              )}

              {/* Transformer */}
              {tool === 'select' && selectedId && selectedType === 'zone' && (
                <Transformer
                  ref={trRef}
                  rotateEnabled={true}
                  borderStroke="#00d4ff"
                  anchorStroke="#00d4ff"
                  anchorFill="#ffffff"
                  anchorSize={8 / scale}
                />
              )}
            </Layer>
          </Stage>
        </div>

        {/* Right Detail Panel */}
        <AnimatePresence>
          {selectedId && (
            <motion.div 
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              className="w-80 border-l border-white/10 bg-black/40 backdrop-blur-xl flex flex-col shrink-0"
            >
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div className="flex items-center space-x-2">
                  <Info className="w-4 h-4 text-[#7000ff]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-white/80">Properties</span>
                </div>
                <button onClick={() => setSelected(null, null)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {selectedType === 'zone' && selectedItem && (
                   <ZoneDetails 
                    zone={selectedItem as Zone} 
                    updateZone={updateZone} 
                    events={events} 
                    observations={useMapStore.getState().observations}
                    actions={useMapStore.getState().actions}
                    removeZone={removeZone} 
                  />
                )}
                {selectedType === 'node' && selectedItem && (
                   <NodeDetails node={selectedItem as MapNode} removeNode={removeNode} />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface ToolButtonProps {
  active: boolean;
  icon: React.ElementType;
  onClick: () => void;
  title: string;
}

function ToolButton({ active, icon: Icon, onClick, title }: ToolButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={`p-2 rounded-md transition-all ${active ? 'bg-[#7000ff] text-white shadow-lg' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
      title={title}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}
function ToolDivider() { return <div className="w-px h-4 bg-white/10 mx-1 self-center" />; }

interface EngineeringZoneProps {
  zone: Zone;
  isSelected: boolean;
  tool: MapTool;
  scale: number;
  onSelect: (e: any) => void;
  onDragEnd: (e: any) => void;
  onTransformEnd: (e: any) => void;
  shapeRef: any;
}

function EngineeringZone({ zone, isSelected, tool, scale, onSelect, onDragEnd, onTransformEnd, shapeRef }: EngineeringZoneProps) {
  return (
    <Group 
      x={zone.x} y={zone.y}
      draggable={tool === 'select' && isSelected}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      ref={shapeRef}
      onTransformEnd={onTransformEnd}
    >
      <Rect
        width={zone.width}
        height={zone.height}
        fill={zone.color || 'rgba(255,255,255,0.05)'}
        stroke={isSelected ? '#00d4ff' : 'rgba(255,255,255,0.2)'}
        strokeWidth={isSelected ? 3 / scale : 1 / scale}
        cornerRadius={Math.min(zone.width, zone.height) * 0.05}
      />
      {scale > 3 && (
        <Text
          text={zone.name}
          x={zone.width / 2}
          y={zone.height / 2}
          fontSize={Math.max(2/scale, 10/scale)}
          fill="#ffffff"
          align="center"
          verticalAlign="middle"
          offsetX={(zone.name.length * 3) / scale}
          offsetY={(5) / scale}
          opacity={0.6}
        />
      )}
    </Group>
  );
}

function HotspotPulse({ insight, scale }: { insight: EngineeringInsight, scale: number }) {
  const [pulse, setPulse] = useState(1);
  const isEHS = insight.category === 'EHS';
  const color = isEHS ? '239, 68, 68' : '59, 130, 246'; // red-500 or blue-500

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => p === 1 ? 1.4 : 1);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  if (insight.x === null || insight.y === null) return null;

  return (
    <Group x={insight.x} y={insight.y}>
      <Circle
        radius={(8 * pulse) / scale}
        fill={`rgba(${color}, 0.2)`}
        stroke={`rgba(${color}, 0.5)`}
        strokeWidth={1 / scale}
      />
      <Circle
        radius={4 / scale}
        fill={`rgb(${color})`}
        stroke="#ffffff"
        strokeWidth={0.5 / scale}
      />
      {scale > 4 && (
        <Text
          text={insight.type.replace('_', ' ').toUpperCase()}
          y={10 / scale}
          fontSize={8 / scale}
          fill="#ffffff"
          align="center"
          offsetX={20 / scale}
          opacity={0.8}
          fontStyle="bold"
        />
      )}
    </Group>
  );
}

function OneWayArrow({ from, to, scale, color }: any) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const angle = Math.atan2(dy, dx);
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const length = 5 / scale;

  return (
    <Line
      points={[
        midX - length * Math.cos(angle - Math.PI / 6),
        midY - length * Math.sin(angle - Math.PI / 6),
        midX, midY,
        midX - length * Math.cos(angle + Math.PI / 6),
        midY - length * Math.sin(angle + Math.PI / 6),
      ]}
      stroke={color}
      strokeWidth={2 / scale}
    />
  );
}

function ZoneDetails({ zone, updateZone, events, observations, actions, removeZone }: any) {
  const zoneEvents = events.filter((e: any) => 
    e.x >= zone.x && e.x <= zone.x + zone.width && 
    e.y >= zone.y && e.y <= zone.y + zone.height
  );
  const zoneObs = (observations || []).filter((o: any) => o.zoneId === zone.id);
  const zoneActions = (actions || []).filter((a: any) => a.zone === zone.name);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Identification</label>
        <input 
          type="text" 
          value={zone.name}
          onChange={(e) => updateZone(zone.id, { name: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#7000ff] outline-none transition-all" 
        />
        <select 
          value={zone.type}
          onChange={(e) => updateZone(zone.id, { type: e.target.value as any })}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-[#7000ff] outline-none"
        >
          <option value="aisle">Aisle</option>
          <option value="rack">Rack</option>
          <option value="dock">Dock</option>
          <option value="dock_lane">Dock Travel Lane</option>
          <option value="staging">Staging Area</option>
          <option value="staging_lane">Staging Lane</option>
          <option value="pedestrian">Pedestrian Area</option>
          <option value="protected_walkway">Protected Walkway</option>
          <option value="battery_area">Battery Traffic Area</option>
          <option value="restricted">Restricted Area</option>
          <option value="barrier">Safety Barrier</option>
          <option value="blind_corner">Blind Corner</option>
          <option value="crossing">Interaction Crossing</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center">
          <div className="text-[10px] font-bold text-white/40 uppercase mb-1">Area</div>
          <div className="text-lg font-mono text-white">{(zone.width * zone.height).toFixed(1)} <span className="text-xs text-white/40">sq ft</span></div>
        </div>
        <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-center">
          <div className="text-[10px] font-bold text-white/40 uppercase mb-1">Events</div>
          <div className="text-lg font-mono text-white">{zoneEvents.length}</div>
        </div>
      </div>

      <div className="pt-4 border-t border-white/10 space-y-4">
        <div>
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-3 flex items-center">
            <ShieldAlert className="w-3 h-3 mr-1.5 text-orange-400" />
            Active Observations
          </label>
          <div className="space-y-2">
            {zoneObs.length === 0 ? (
              <div className="text-[10px] text-white/30 italic">No spatial observations.</div>
            ) : (
              zoneObs.map((o: any) => (
                <div key={o.id} className="text-[10px] bg-white/5 p-2 rounded border border-white/5 text-white/80">
                  {o.description}
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-3 flex items-center">
            <Check className="w-3 h-3 mr-1.5 text-green-400" />
            Pending Actions
          </label>
          <div className="space-y-2">
            {zoneActions.length === 0 ? (
              <div className="text-[10px] text-white/30 italic">No pending remediation tasks.</div>
            ) : (
              zoneActions.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between bg-white/5 p-2 rounded border border-white/5">
                  <span className="text-[10px] text-white/80">{a.title}</span>
                  <span className="text-[9px] text-white/40">{a.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <button 
        onClick={() => removeZone(zone.id)}
        className="w-full py-2.5 rounded-lg border border-red-500/20 text-red-500/60 text-[10px] font-bold hover:bg-red-500 hover:text-white transition-all mt-8 uppercase tracking-widest"
      >
        Purge Engineering Zone
      </button>
    </div>
  );
}

function NodeDetails({ node, removeNode }: { node: MapNode, removeNode: (id: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="bg-[#7000ff]/10 p-4 rounded-xl border border-[#7000ff]/20">
        <div className="text-[10px] font-bold text-white/40 uppercase mb-2">Node Topology</div>
        <div className="font-mono text-sm text-white">{node.id}</div>
        <div className="text-[10px] text-white/40 mt-1">COORD: {node.x.toFixed(2)}, {node.y.toFixed(2)}</div>
      </div>
      
      <button 
        onClick={() => removeNode(node.id)}
        className="w-full py-2.5 rounded-lg border border-red-500/30 text-red-500 text-xs font-bold hover:bg-red-500 hover:text-white transition-all"
      >
        DELETE NODE
      </button>
    </div>
  );
}
