import { useState, useRef } from "react";
import {
  Pencil, Eraser, Palette, CircleDot, Undo2, Redo2, Trash2, StickyNote,
  Shapes, Pointer, ImagePlus, Download, Highlighter, Lasso, ZoomIn, ZoomOut,
  Hand, ChevronUp, ChevronDown, Plus, Type, PenTool, Minus,
  ChevronsLeft, ChevronsRight,
} from "lucide-react";

const PRESET_COLORS = [
  "#ffffff", "#f8fafc", "#cbd5e1", "#64748b",
  "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6",
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#78716c", "#000000",
];

const PEN_TYPES = [
  { id: "fine", name: "Fine Tip", icon: "\u00b7", desc: "Thin precise lines" },
  { id: "ballpoint", name: "Ballpoint", icon: "\u25cf", desc: "Standard pen" },
  { id: "fountain", name: "Fountain", icon: "\u2712", desc: "Elegant pressure" },
  { id: "calligraphy", name: "Calligraphy", icon: "\ud835\udc9c", desc: "Wide strokes" },
  { id: "marker", name: "Marker", icon: "\u25a0", desc: "Bold & semi-transparent" },
];

const Toolbar = ({
  tool, setTool, color, setColor, brushSize, setBrushSize,
  penType, setPenType,
  onUndo, onRedo, onClear, onAddSticky, onImageUpload, onExport,
  isHost, undoDisabled, redoDisabled,
  zoom, onZoomIn, onZoomOut, onZoomReset,
  currentPage, totalPages, onPageUp, onPageDown, onAddPage,
  selectedCount, onDeleteSelected,
}) => {
  const [showColors, setShowColors] = useState(false);
  const [showBrush, setShowBrush] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showPenType, setShowPenType] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const fileInputRef = useRef(null);

  const closePopups = () => { setShowColors(false); setShowBrush(false); setShowExport(false); setShowPenType(false); };
  const zoomPct = Math.round((zoom || 1) * 100);

  return (
    <>
      {/* Collapse / Expand toggle */}
      <button className="toolbar-collapse-btn" onClick={() => { setCollapsed(!collapsed); closePopups(); }}
        title={collapsed ? "Expand Toolbar" : "Collapse Toolbar"}>
        {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
      </button>

      {!collapsed && (
        <div className="toolbar-float">
          {/* Drawing Tools */}
          <button className={`tool-btn ${tool==="pencil"?"active":""}`} onClick={()=>{setTool("pencil");closePopups();}} title="Pencil (P)"><Pencil size={20} /></button>
          <button className={`tool-btn ${tool==="highlighter"?"active":""}`} onClick={()=>{setTool("highlighter");closePopups();}} title="Highlighter (H)"><Highlighter size={20} /></button>
          <button className={`tool-btn ${tool==="eraser"?"active":""}`} onClick={()=>{setTool("eraser");closePopups();}} title="Eraser (E)"><Eraser size={20} /></button>
          <button className={`tool-btn ${tool==="text"?"active":""}`} onClick={()=>{setTool("text");closePopups();}} title="Text Tool (T)"><Type size={20} /></button>
          <button className={`tool-btn ${tool==="shape"?"active":""}`} onClick={()=>{setTool("shape");closePopups();}} title="Shape Recognition"><Shapes size={20} /></button>
          <button className={`tool-btn ${tool==="lasso"?"active":""}`} onClick={()=>{setTool("lasso");closePopups();}} title="Lasso Select (L)"><Lasso size={20} /></button>
          <button className={`tool-btn ${tool==="pan"?"active":""}`} onClick={()=>{setTool("pan");closePopups();}} title="Pan (Space)"><Hand size={20} /></button>

          <div className="divider" />

          {/* Pen Type */}
          <button className="tool-btn" onClick={()=>{setShowPenType(!showPenType);setShowColors(false);setShowBrush(false);setShowExport(false);}} title="Pen Type">
            <PenTool size={20} />
          </button>

          {/* Sticky & Laser */}
          <button className="tool-btn" onClick={()=>{closePopups();if(onAddSticky)onAddSticky();}} title="Add Sticky Note"><StickyNote size={20} /></button>
          <button className={`tool-btn ${tool==="laser"?"active":""}`} onClick={()=>{setTool("laser");closePopups();}} title="Laser Pointer"><Pointer size={20} /></button>

          <div className="divider" />

          {/* Color & Brush */}
          <button className="tool-btn color-indicator-btn" onClick={()=>{setShowColors(!showColors);setShowBrush(false);setShowExport(false);setShowPenType(false);}} title="Color">
            <Palette size={20} />
            <span className="color-indicator" style={{background:color}} />
          </button>
          <button className="tool-btn" onClick={()=>{setShowBrush(!showBrush);setShowColors(false);setShowExport(false);setShowPenType(false);}} title="Brush Size"><CircleDot size={20} /></button>

          <div className="divider" />

          {/* Image & Export */}
          <button className="tool-btn" onClick={()=>{closePopups();fileInputRef.current?.click();}} title="Upload Image"><ImagePlus size={20} /></button>
          <input ref={fileInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={(e)=>{const file=e.target.files?.[0];if(file&&onImageUpload)onImageUpload(file);e.target.value="";}} />
          <button className="tool-btn" onClick={()=>{setShowExport(!showExport);setShowColors(false);setShowBrush(false);setShowPenType(false);}} title="Export Board"><Download size={20} /></button>

          <div className="divider" />

          {/* Undo/Redo */}
          <button className="tool-btn" onClick={onUndo} disabled={undoDisabled} title="Undo" style={{opacity:undoDisabled?0.3:1}}><Undo2 size={20} /></button>
          <button className="tool-btn" onClick={onRedo} disabled={redoDisabled} title="Redo" style={{opacity:redoDisabled?0.3:1}}><Redo2 size={20} /></button>

          {isHost && (<><div className="divider" /><button className="tool-btn" onClick={onClear} title="Clear Board" style={{color:"var(--error)"}}><Trash2 size={20} /></button></>)}
        </div>
      )}

      {/* Zoom Controls */}
      <div className="zoom-controls">
        <button className="zoom-btn" onClick={onZoomOut} title="Zoom Out"><ZoomOut size={16} /></button>
        <button className="zoom-display" onClick={onZoomReset} title="Reset">{zoomPct}%</button>
        <button className="zoom-btn" onClick={onZoomIn} title="Zoom In"><ZoomIn size={16} /></button>
      </div>

      {/* Page Nav */}
      <div className="page-nav-controls">
        <button className="page-btn" onClick={onPageUp} disabled={currentPage<=0} title="Previous"><ChevronUp size={16} /></button>
        <span className="page-indicator">{(currentPage||0)+1} / {totalPages||1}</span>
        <button className="page-btn" onClick={onPageDown} disabled={currentPage>=(totalPages||1)-1} title="Next"><ChevronDown size={16} /></button>
        <button className="page-btn add-page-btn" onClick={onAddPage} title="Add Page"><Plus size={14} /></button>
      </div>

      {/* Selection Info */}
      {selectedCount > 0 && (
        <div className="selection-info">
          <span>{selectedCount} selected</span>
          <button className="selection-action" onClick={onDeleteSelected}><Trash2 size={14} /> Delete</button>
        </div>
      )}

      {/* Color Picker Popup */}
      {showColors && (
        <div className="color-picker-popup premium">
          <div className="color-picker-header">
            <span>Colors</span>
            <label className="native-color-wrap">
              Custom
              <input type="color" value={color} onChange={(e)=>{setColor(e.target.value);}} className="native-color-input" />
            </label>
          </div>
          <div className="color-swatches-grid">
            {PRESET_COLORS.map((c) => (
              <div key={c} className={`color-swatch ${color===c?"active":""}`} style={{background:c}}
                onClick={()=>{setColor(c);setShowColors(false);}} />
            ))}
          </div>
          <div className="color-gradient-bar">
            <input type="range" min="0" max="360" value={(() => {
              const r = parseInt(color.slice(1,3),16)/255;
              const g = parseInt(color.slice(3,5),16)/255;
              const b = parseInt(color.slice(5,7),16)/255;
              const max = Math.max(r,g,b), min = Math.min(r,g,b);
              if (max === min) return 0;
              let h = 0;
              if (max === r) h = ((g-b)/(max-min)) % 6;
              else if (max === g) h = (b-r)/(max-min) + 2;
              else h = (r-g)/(max-min) + 4;
              h = Math.round(h * 60); if (h < 0) h += 360;
              return h;
            })()} onChange={(e) => {
              const h = parseInt(e.target.value);
              const s = 0.7, l = 0.55;
              const a2 = s * Math.min(l, 1-l);
              const f = (n) => { const k = (n + h/30) % 12; return l - a2 * Math.max(Math.min(k-3, 9-k, 1), -1); };
              const toHex = (v) => Math.round(v*255).toString(16).padStart(2,"0");
              setColor("#" + toHex(f(0)) + toHex(f(8)) + toHex(f(4)));
            }} className="hue-slider" style={{background:"linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)"}} />
          </div>
          <div className="current-color-display">
            <div className="current-swatch" style={{background:color}} />
            <span className="color-hex">{color}</span>
          </div>
        </div>
      )}

      {/* Brush Size Popup */}
      {showBrush && (
        <div className="brush-popup premium">
          <label>Brush Size</label>
          <div className="brush-size-display">
            <button className="brush-adj" onClick={()=>setBrushSize(Math.max(1,brushSize-1))}><Minus size={14}/></button>
            <span className="brush-value">{brushSize}px</span>
            <button className="brush-adj" onClick={()=>setBrushSize(Math.min(50,brushSize+1))}><Plus size={14}/></button>
          </div>
          <input type="range" min="1" max="50" value={brushSize} onChange={(e)=>setBrushSize(Number(e.target.value))} />
          <div className="brush-preview-row">
            {[1,3,6,12,24].map(s=>(
              <button key={s} className={`brush-preset ${brushSize===s?"active":""}`} onClick={()=>setBrushSize(s)}>
                <span className="brush-dot" style={{width:Math.min(s*2,28),height:Math.min(s*2,28),background:color}} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pen Type Popup */}
      {showPenType && (
        <div className="pen-type-popup">
          <label>Pen Type</label>
          {PEN_TYPES.map(pt => (
            <button key={pt.id} className={`pen-type-option ${penType===pt.id?"active":""}`} onClick={()=>{setPenType(pt.id);setShowPenType(false);}}>
              <span className="pen-type-icon">{pt.icon}</span>
              <div className="pen-type-info">
                <strong>{pt.name}</strong>
                <span>{pt.desc}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Export Popup */}
      {showExport && (
        <div className="export-popup">
          <button className="export-option" onClick={()=>{onExport?.("png");setShowExport(false);}}>Export PNG</button>
          <button className="export-option" onClick={()=>{onExport?.("pdf");setShowExport(false);}}>Export PDF</button>
        </div>
      )}
    </>
  );
};

export default Toolbar;
