import { useRef, useEffect, useCallback, useState } from "react";

/* ═══════════════════════════════════════════════════════
   Utility — Shape Recognition
   ═══════════════════════════════════════════════════════ */
const recognizeShape = (points) => {
  if (points.length < 5) return null;
  const first = points[0];
  const last = points[points.length - 1];
  const dist = Math.hypot(last.x - first.x, last.y - first.y);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  points.forEach((p) => { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y); });
  const w = maxX - minX, h = maxY - minY;
  const diagonal = Math.hypot(w, h);
  let pathLen = 0;
  for (let i = 1; i < points.length; i++) pathLen += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  const isClosed = dist < diagonal * 0.25;
  if (isClosed) {
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    const avgR = (w + h) / 4;
    const ratio = pathLen / (2 * Math.PI * avgR);
    if (ratio > 0.75 && ratio < 1.5 && Math.abs(w - h) / Math.max(w, h) < 0.4) return { type: "circle", cx, cy, radius: avgR };
    let onEdge = 0;
    const margin = Math.max(w, h) * 0.15;
    points.forEach((p) => { if (Math.abs(p.x - minX) < margin || Math.abs(p.x - maxX) < margin || Math.abs(p.y - minY) < margin || Math.abs(p.y - maxY) < margin) onEdge++; });
    if (onEdge / points.length > 0.7) return { type: "rect", x: minX, y: minY, width: w, height: h };
  }
  const lineLen = Math.hypot(last.x - first.x, last.y - first.y);
  if (lineLen > 30) {
    let maxDev = 0;
    points.forEach((p) => { const dev = Math.abs((last.y - first.y) * p.x - (last.x - first.x) * p.y + last.x * first.y - last.y * first.x) / lineLen; maxDev = Math.max(maxDev, dev); });
    if (maxDev < lineLen * 0.08) return { type: "line", x1: first.x, y1: first.y, x2: last.x, y2: last.y };
    if (maxDev < lineLen * 0.12) return { type: "arrow", x1: first.x, y1: first.y, x2: last.x, y2: last.y };
  }
  return null;
};

const drawRecognizedShape = (ctx, shape, color, brushSize) => {
  ctx.strokeStyle = color; ctx.lineWidth = brushSize; ctx.lineCap = "round"; ctx.lineJoin = "round";
  if (shape.type === "circle") { ctx.beginPath(); ctx.arc(shape.cx, shape.cy, shape.radius, 0, Math.PI * 2); ctx.stroke(); }
  else if (shape.type === "rect") { ctx.beginPath(); ctx.rect(shape.x, shape.y, shape.width, shape.height); ctx.stroke(); }
  else if (shape.type === "line") { ctx.beginPath(); ctx.moveTo(shape.x1, shape.y1); ctx.lineTo(shape.x2, shape.y2); ctx.stroke(); }
  else if (shape.type === "arrow") {
    ctx.beginPath(); ctx.moveTo(shape.x1, shape.y1); ctx.lineTo(shape.x2, shape.y2); ctx.stroke();
    const angle = Math.atan2(shape.y2 - shape.y1, shape.x2 - shape.x1);
    const hl = Math.max(12, brushSize * 4);
    ctx.beginPath(); ctx.moveTo(shape.x2, shape.y2);
    ctx.lineTo(shape.x2 - hl * Math.cos(angle - Math.PI / 6), shape.y2 - hl * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(shape.x2, shape.y2);
    ctx.lineTo(shape.x2 - hl * Math.cos(angle + Math.PI / 6), shape.y2 - hl * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  }
};

/* ═══════════════════════════════════════════════════════
   Utility — Lasso
   ═══════════════════════════════════════════════════════ */
const pointInPolygon = (px, py, polygon) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const { x: xi, y: yi } = polygon[i]; const { x: xj, y: yj } = polygon[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const strokeInsideLasso = (stroke, lassoPoly) => {
  if (!stroke.points || stroke.points.length === 0) return false;
  return stroke.points.some((p) => pointInPolygon(p.x, p.y, lassoPoly));
};

/* ═══════════════════════════════════════════════════════
   Utility — Distance helpers (for eraser hit-testing)
   ═══════════════════════════════════════════════════════ */
const distToSegment = (px, py, x1, y1, x2, y2) => {
  const dx = x2 - x1, dy = y2 - y1, lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
};
const distToStroke = (px, py, stroke) => {
  if (!stroke.points || stroke.points.length === 0) return Infinity;
  if (stroke.points.length === 1) return Math.hypot(px - stroke.points[0].x, py - stroke.points[0].y);
  let minDist = Infinity;
  for (let i = 1; i < stroke.points.length; i++) {
    const d = distToSegment(px, py, stroke.points[i-1].x, stroke.points[i-1].y, stroke.points[i].x, stroke.points[i].y);
    minDist = Math.min(minDist, d);
  }
  return minDist;
};

/* ═══════════════════════════════════════════════════════
   Pen Profiles
   ═══════════════════════════════════════════════════════ */
const PEN_PROFILES = {
  fine:        { pressureMin: 0.85, pressureMax: 1.0,  widthMult: 0.6, alpha: 1.0  },
  ballpoint:   { pressureMin: 0.6,  pressureMax: 1.1,  widthMult: 1.0, alpha: 1.0  },
  fountain:    { pressureMin: 0.3,  pressureMax: 1.4,  widthMult: 1.3, alpha: 1.0  },
  calligraphy: { pressureMin: 0.2,  pressureMax: 2.0,  widthMult: 1.6, alpha: 1.0  },
  marker:      { pressureMin: 0.9,  pressureMax: 1.1,  widthMult: 2.5, alpha: 0.75 },
};

const PAGE_WIDTH = 1200;
const PAGE_HEIGHT = Math.round(PAGE_WIDTH * 1.4142);
const PAGE_GAP = 40;

/* ═══════════════════════════════════════════════════════
   Canvas Component
   ═══════════════════════════════════════════════════════ */
const Canvas = ({
  tool, color, brushSize, penType,
  drawingLayer, textLayer, fileLayer,
  stickyNotes, laserPointers,
  onStrokeEnd, onDeleteStrokes, onMoveStrokes, onEraseStroke,
  onTextAdd, onTextLayerUpdate,
  socket, disabled,
  pages, currentPage, onPageChange,
  zoom, panOffset, onZoomChange, onPanChange,
  onLassoSelect,
}) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const isDrawing = useRef(false);
  const currentStroke = useRef(null);
  const remoteStrokes = useRef(new Map());
  const lastThrottle = useRef(0);
  const loadedImages = useRef(new Map());
  const rafId = useRef(null);
  const redrawRef = useRef(null);
  const lassoPath = useRef(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectionBounds, setSelectionBounds] = useState(null);
  const isDraggingSelection = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const eraserPos = useRef(null);
  const draggingElement = useRef(null);
  const dragElementStart = useRef({ x: 0, y: 0 });
  const dragOrigPos = useRef({ x: 0, y: 0 });
  const [editingText, setEditingText] = useState(null);
  const [editingBox, setEditingBox] = useState(null);
  const templateGroupDrag = useRef(null); // { prefix, startPos, origPositions: Map<id,{x,y}> }
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const parent = canvas.parentElement; if (!parent) return;
    const w = parent.clientWidth, h = parent.clientHeight;
    if (w === 0 || h === 0) return;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    canvas.style.width = w + "px"; canvas.style.height = h + "px";
    ctxRef.current = canvas.getContext("2d");
    scheduleRedraw();
  }, [dpr]);

  useEffect(() => { resizeCanvas(); window.addEventListener("resize", resizeCanvas); return () => window.removeEventListener("resize", resizeCanvas); }, [resizeCanvas]);

  const scheduleRedraw = useCallback(() => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => { if (redrawRef.current) redrawRef.current(); });
  }, []);

  useEffect(() => { scheduleRedraw(); }, [drawingLayer, textLayer, fileLayer, zoom, panOffset, pages, currentPage, selectedIds, laserPointers]);

  useEffect(() => {
    if (!fileLayer || fileLayer.length === 0) return;
    fileLayer.forEach((img) => {
      if (!loadedImages.current.has(img.id)) {
        const image = new Image(); image.crossOrigin = "anonymous";
        image.onload = () => { loadedImages.current.set(img.id, image); scheduleRedraw(); };
        image.src = img.src;
      }
    });
  }, [fileLayer]);

  useEffect(() => {
    if (!socket) return;
    const handleRemoteStart = (data) => { remoteStrokes.current.set(data.userId, { ...data, points: data.points || [] }); };
    const handleRemoteMove = (data) => { const existing = remoteStrokes.current.get(data.userId); if (existing && data.point) { existing.points.push(data.point); scheduleRedraw(); } };
    socket.on("drawing:start", handleRemoteStart); socket.on("drawing:move", handleRemoteMove);
    return () => { socket.off("drawing:start", handleRemoteStart); socket.off("drawing:move", handleRemoteMove); };
  }, [socket]);

  const screenToCanvas = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current; if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const z = zoom || 1, ox = panOffset?.x || 0, oy = panOffset?.y || 0;
    return { x: ((clientX - rect.left) - ox) / z, y: ((clientY - rect.top) - oy) / z };
  }, [zoom, panOffset]);

  const getClientPos = (e) => e.touches && e.touches.length > 0 ? { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY } : { clientX: e.clientX, clientY: e.clientY };

  /* ─── Drawing with Pen Profiles ─── */
  const drawSmoothStroke = (ctx, stroke) => {
    if (!ctx || !stroke.points || stroke.points.length < 2) return;
    ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.globalCompositeOperation = "source-over";
    const pen = PEN_PROFILES[stroke.penType] || PEN_PROFILES.ballpoint;
    if (stroke.type === "highlighter") { ctx.globalAlpha = 0.3; ctx.strokeStyle = stroke.color; ctx.lineWidth = stroke.brushSize * 3; }
    else if (stroke.type === "eraser") { ctx.restore(); return; }
    else { ctx.globalAlpha = pen.alpha; ctx.strokeStyle = stroke.color; ctx.lineWidth = stroke.brushSize * pen.widthMult; }
    const pts = stroke.points;
    if (pts.length >= 3) {
      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i-1], curr = pts[i];
        const speed = Math.hypot(curr.x - prev.x, curr.y - prev.y);
        const pf = Math.max(pen.pressureMin, Math.min(pen.pressureMax, 1.0 - speed / 200));
        const bw = stroke.type === "highlighter" ? stroke.brushSize * 3 : stroke.brushSize * pen.widthMult;
        ctx.lineWidth = bw * pf;
        ctx.beginPath();
        if (i === 1) { ctx.moveTo(prev.x, prev.y); ctx.lineTo(curr.x, curr.y); }
        else { const pp = pts[i-2]; ctx.moveTo((pp.x+prev.x)/2, (pp.y+prev.y)/2); ctx.quadraticCurveTo(prev.x, prev.y, (prev.x+curr.x)/2, (prev.y+curr.y)/2); }
        ctx.stroke();
      }
    } else { ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (let i=1;i<pts.length;i++) { ctx.quadraticCurveTo(pts[i-1].x, pts[i-1].y, (pts[i-1].x+pts[i].x)/2, (pts[i-1].y+pts[i].y)/2); } ctx.stroke(); }
    ctx.restore();
  };

  const drawStroke = (ctx, stroke) => {
    if (!ctx || stroke.type === "eraser") return;
    if (stroke.type === "recognized-shape" && stroke.recognizedShape) { drawRecognizedShape(ctx, stroke.recognizedShape, stroke.color, stroke.brushSize); return; }
    drawSmoothStroke(ctx, stroke);
  };

  const drawAIElement = (ctx, el) => {
    if (!ctx) return;
    if (el.type === "text") {
      ctx.save(); ctx.font = (el.fontSize||18)+"px Inter, sans-serif"; ctx.fillStyle = el.color||"#e8e8ed"; ctx.textAlign = "left"; ctx.textBaseline = "top";
      (el.text||"").split("\n").forEach((line,i) => { ctx.fillText(line, el.x, el.y + i*(el.fontSize||18)*1.3); });
      ctx.restore(); return;
    }
    if (el.type === "box") {
      const isDrag = draggingElement.current?.id === el.id;
      ctx.strokeStyle = isDrag ? "#818cf8" : "#6366f1"; ctx.lineWidth = isDrag ? 2.5 : 2;
      ctx.fillStyle = isDrag ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.08)";
      ctx.beginPath(); ctx.roundRect(el.x, el.y, el.width||150, el.height||60, 10); ctx.fill(); ctx.stroke();
      if (el.text) { ctx.fillStyle = "#e8e8ed"; ctx.font = "14px Inter, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(el.text, el.x+(el.width||150)/2, el.y+(el.height||60)/2, (el.width||150)-16); }
    } else if (el.type === "arrow") {
      const fromBox = textLayer.find(t=>t.id===el.from), toBox = textLayer.find(t=>t.id===el.to);
      if (fromBox && toBox) {
        const fx=fromBox.x+(fromBox.width||150)/2, fy=fromBox.y+(fromBox.height||60), tx=toBox.x+(toBox.width||150)/2, ty=toBox.y;
        ctx.strokeStyle="#818cf8"; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(fx,fy); ctx.lineTo(tx,ty); ctx.stroke();
        const a=Math.atan2(ty-fy,tx-fx); ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(tx-10*Math.cos(a-Math.PI/6),ty-10*Math.sin(a-Math.PI/6)); ctx.lineTo(tx-10*Math.cos(a+Math.PI/6),ty-10*Math.sin(a+Math.PI/6)); ctx.closePath(); ctx.fillStyle="#818cf8"; ctx.fill();
      }
    }
  };

  const drawImage = (ctx, img) => {
    const loaded = loadedImages.current.get(img.id); if (!loaded) return;
    const w=img.width||200, h=img.height||200;
    ctx.drawImage(loaded, img.x, img.y, w, h);
    ctx.strokeStyle = "rgba(99,102,241,0.2)"; ctx.lineWidth = 1; ctx.strokeRect(img.x, img.y, w, h);
  };

  /* ─── Master Redraw ─── */
  const redraw = () => {
    const ctx = ctxRef.current, canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const z = zoom||1, ox = panOffset?.x||0, oy = panOffset?.y||0;
    ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.setTransform(dpr,0,0,dpr,0,0); ctx.save(); ctx.translate(ox,oy); ctx.scale(z,z);

    const numPages = pages||1;
    for (let p=0;p<numPages;p++) {
      const yOff = p*(PAGE_HEIGHT+PAGE_GAP);
      ctx.fillStyle="rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.roundRect(5,yOff+5,PAGE_WIDTH,PAGE_HEIGHT,8); ctx.fill();
      ctx.fillStyle="#181c2a"; ctx.beginPath(); ctx.roundRect(0,yOff,PAGE_WIDTH,PAGE_HEIGHT,6); ctx.fill();
      ctx.strokeStyle="rgba(99,102,241,0.15)"; ctx.lineWidth=1; ctx.beginPath(); ctx.roundRect(0,yOff,PAGE_WIDTH,PAGE_HEIGHT,6); ctx.stroke();
      ctx.strokeStyle="rgba(99,102,241,0.04)"; ctx.lineWidth=0.5;
      for (let lY=yOff+40;lY<yOff+PAGE_HEIGHT;lY+=40) { ctx.beginPath(); ctx.moveTo(24,lY); ctx.lineTo(PAGE_WIDTH-24,lY); ctx.stroke(); }
      ctx.save(); const badge="Page "+(p+1); ctx.font="11px Inter, sans-serif"; const tw=ctx.measureText(badge).width+16;
      ctx.fillStyle="rgba(99,102,241,0.08)"; ctx.beginPath(); ctx.roundRect(PAGE_WIDTH/2-tw/2,yOff+PAGE_HEIGHT-28,tw,20,10); ctx.fill();
      ctx.fillStyle="rgba(148,163,184,0.4)"; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText(badge,PAGE_WIDTH/2,yOff+PAGE_HEIGHT-18); ctx.restore();
    }

    if (fileLayer) fileLayer.forEach(img => drawImage(ctx, img));
    drawingLayer.forEach(stroke => { if (stroke.type==="eraser") return; if (selectedIds.includes(stroke.id)) { ctx.save(); ctx.shadowColor="#6366f1"; ctx.shadowBlur=8; drawStroke(ctx,stroke); ctx.restore(); } else drawStroke(ctx,stroke); });
    remoteStrokes.current.forEach(stroke => drawStroke(ctx, stroke));
    if (currentStroke.current && currentStroke.current.type !== "eraser") drawStroke(ctx, currentStroke.current);
    textLayer.forEach(el => drawAIElement(ctx, el));

    if (selectionBounds) { ctx.setLineDash([6,4]); ctx.strokeStyle="#6366f1"; ctx.lineWidth=1.5; ctx.strokeRect(selectionBounds.x-4,selectionBounds.y-4,selectionBounds.w+8,selectionBounds.h+8); ctx.setLineDash([]); }
    if (lassoPath.current && lassoPath.current.length>1) { ctx.setLineDash([4,4]); ctx.strokeStyle="#a78bfa"; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(lassoPath.current[0].x,lassoPath.current[0].y); for(let i=1;i<lassoPath.current.length;i++) ctx.lineTo(lassoPath.current[i].x,lassoPath.current[i].y); ctx.closePath(); ctx.stroke(); ctx.setLineDash([]); }
    if (eraserPos.current && tool==="eraser") { ctx.save(); ctx.strokeStyle="rgba(255,255,255,0.5)"; ctx.lineWidth=1.5; ctx.setLineDash([4,3]); ctx.beginPath(); ctx.arc(eraserPos.current.x,eraserPos.current.y,(brushSize||3)*3,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); }

    ctx.restore(); // end zoom+pan

    if (laserPointers && Object.keys(laserPointers).length>0) {
      Object.values(laserPointers).forEach(lp => {
        if (!lp.points||lp.points.length===0) return;
        for (let i=Math.max(0,lp.points.length-20);i<lp.points.length;i++) { const a=(i-Math.max(0,lp.points.length-20))/20; ctx.beginPath(); ctx.arc(lp.points[i].x*z+ox,lp.points[i].y*z+oy,4+a*4,0,Math.PI*2); ctx.fillStyle="rgba(239,68,68,"+(a*0.8)+")"; ctx.fill(); }
        const last=lp.points[lp.points.length-1], lsx=last.x*z+ox, lsy=last.y*z+oy;
        ctx.beginPath(); ctx.arc(lsx,lsy,8,0,Math.PI*2); ctx.fillStyle="rgba(239,68,68,0.9)"; ctx.fill();
        ctx.beginPath(); ctx.arc(lsx,lsy,12,0,Math.PI*2); ctx.fillStyle="rgba(239,68,68,0.3)"; ctx.fill();
        if (lp.username) { ctx.font="11px Inter, sans-serif"; ctx.fillStyle="rgba(239,68,68,0.9)"; ctx.textAlign="left"; ctx.fillText(lp.username,lsx+14,lsy+4); }
      });
    }
  };
  redrawRef.current = redraw;

  const hitTestTextLayer = (pos) => {
    for (let i=textLayer.length-1;i>=0;i--) {
      const el=textLayer[i];
      if (el.type==="box") { const w=el.width||150,h=el.height||60; if(pos.x>=el.x&&pos.x<=el.x+w&&pos.y>=el.y&&pos.y<=el.y+h) return el; }
      else if (el.type==="text") { const tw=(el.text||"").length*(el.fontSize||18)*0.55,th=(el.fontSize||18)*1.5; if(pos.x>=el.x&&pos.x<=el.x+tw&&pos.y>=el.y&&pos.y<=el.y+th) return el; }
    }
    return null;
  };

  /* ─── Detect template group prefix from an element id ─── */
  const getTemplatePrefix = (id) => {
    // Template IDs follow patterns like "kanban-col-0", "fc-start", "mm-center", "swot-0", "retro-col-0"
    const prefixes = ["kanban", "fc", "mm", "swot", "retro"];
    for (const p of prefixes) { if (id && id.startsWith(p + "-")) return p; }
    return null;
  };

  /* ─── Pointer Events ─── */
  const handlePointerDown = (e) => {
    if (disabled||!tool) return; e.preventDefault();
    const {clientX,clientY} = getClientPos(e), pos = screenToCanvas(clientX,clientY);
    const now = Date.now();

    if (tool==="pan") { isDrawing.current=true; dragStart.current={x:clientX-(panOffset?.x||0),y:clientY-(panOffset?.y||0)}; return; }
    if (tool==="laser") { isDrawing.current=true; if(socket) socket.emit("laser:move",{point:pos}); return; }
    if (tool==="text") { setEditingText({x:pos.x,y:pos.y}); return; }
    if (tool==="lasso") {
      if (selectionBounds&&selectedIds.length>0&&pos.x>=selectionBounds.x-4&&pos.x<=selectionBounds.x+selectionBounds.w+4&&pos.y>=selectionBounds.y-4&&pos.y<=selectionBounds.y+selectionBounds.h+4) { isDraggingSelection.current=true; dragStart.current={x:pos.x,y:pos.y}; isDrawing.current=true; return; }
      setSelectedIds([]); setSelectionBounds(null); lassoPath.current=[pos]; isDrawing.current=true; return;
    }
    // Hit-test template elements for dragging or double-click editing
    const hitEl = hitTestTextLayer(pos);
    if (hitEl&&hitEl.type==="box") {
      // Double-click → edit box text
      if (hitEl._lastClick && now - hitEl._lastClick < 400) {
        setEditingBox({ id: hitEl.id, x: hitEl.x, y: hitEl.y, width: hitEl.width||150, height: hitEl.height||60, text: hitEl.text||"" });
        return;
      }
      hitEl._lastClick = now;

      // Check if this belongs to a template group
      const prefix = getTemplatePrefix(hitEl.id);
      if (prefix && e.shiftKey) {
        // Shift+drag = move entire template group
        const groupEls = textLayer.filter(el => el.id && el.id.startsWith(prefix + "-") && el.type === "box");
        const origPositions = new Map();
        groupEls.forEach(el => origPositions.set(el.id, { x: el.x, y: el.y }));
        templateGroupDrag.current = { prefix, startPos: { x: pos.x, y: pos.y }, origPositions };
        isDrawing.current = true;
        return;
      }

      // Single drag = move individual box
      draggingElement.current=hitEl; dragElementStart.current={x:pos.x,y:pos.y}; dragOrigPos.current={x:hitEl.x,y:hitEl.y}; isDrawing.current=true; return;
    }
    // Eraser: stroke removal
    if (tool==="eraser") {
      isDrawing.current=true; eraserPos.current=pos;
      const r=(brushSize||3)*3;
      drawingLayer.filter(s=>s.type!=="eraser"&&distToStroke(pos.x,pos.y,s)<r).forEach(s=>{ if(onEraseStroke) onEraseStroke(s.id); });
      scheduleRedraw(); return;
    }
    // Drawing
    isDrawing.current=true;
    const strokeType = tool==="shape"?"shape":tool==="highlighter"?"highlighter":"pencil";
    const stroke = { id:Date.now()+"-"+Math.random().toString(36).substr(2,9), type:strokeType, penType:penType||"ballpoint", points:[pos], color, brushSize, userId:"self", layer:"drawingLayer", timestamp:Date.now(), pageId:currentPage||0 };
    currentStroke.current = stroke;
    if (socket) socket.emit("drawing:start",{id:stroke.id,type:stroke.type,penType:stroke.penType,points:[pos],color:stroke.color,brushSize:stroke.brushSize,layer:"drawingLayer"});
  };

  const handlePointerMove = (e) => {
    if (disabled) return;
    const {clientX,clientY} = getClientPos(e);
    if (tool==="eraser") { eraserPos.current=screenToCanvas(clientX,clientY); if(!isDrawing.current) scheduleRedraw(); }
    if (!isDrawing.current) return; e.preventDefault();
    if (tool==="pan") { if(onPanChange) onPanChange({x:clientX-dragStart.current.x,y:clientY-dragStart.current.y}); return; }
    const pos = screenToCanvas(clientX,clientY);
    if (tool==="laser") { const now=Date.now(); if(now-lastThrottle.current>30){lastThrottle.current=now; if(socket) socket.emit("laser:move",{point:pos});} return; }
    // Group template drag
    if (templateGroupDrag.current) {
      const gd = templateGroupDrag.current;
      const dx = pos.x - gd.startPos.x, dy = pos.y - gd.startPos.y;
      gd.origPositions.forEach((orig, id) => {
        if (onTextLayerUpdate) onTextLayerUpdate(id, { x: orig.x + dx, y: orig.y + dy });
      });
      scheduleRedraw(); return;
    }
    if (tool==="lasso") {
      if (isDraggingSelection.current) { const dx=pos.x-dragStart.current.x,dy=pos.y-dragStart.current.y; dragStart.current={x:pos.x,y:pos.y}; if(onMoveStrokes) onMoveStrokes(selectedIds,dx,dy); if(selectionBounds) setSelectionBounds(b=>b?{...b,x:b.x+dx,y:b.y+dy}:b); return; }
      if (lassoPath.current) { lassoPath.current.push(pos); scheduleRedraw(); } return;
    }
    if (draggingElement.current) { const dx=pos.x-dragElementStart.current.x,dy=pos.y-dragElementStart.current.y; if(onTextLayerUpdate) onTextLayerUpdate(draggingElement.current.id,{x:dragOrigPos.current.x+dx,y:dragOrigPos.current.y+dy}); scheduleRedraw(); return; }
    if (tool==="eraser") { eraserPos.current=pos; const r=(brushSize||3)*3; drawingLayer.filter(s=>s.type!=="eraser"&&distToStroke(pos.x,pos.y,s)<r).forEach(s=>{if(onEraseStroke) onEraseStroke(s.id);}); scheduleRedraw(); return; }
    if (!currentStroke.current) return;
    currentStroke.current.points.push(pos);
    const now=Date.now(); if(now-lastThrottle.current>24){lastThrottle.current=now; if(socket) socket.emit("drawing:move",{id:currentStroke.current.id,point:pos});}
    scheduleRedraw();
  };

  const handlePointerUp = (e) => {
    if (disabled) return; e.preventDefault();
    if (draggingElement.current) { draggingElement.current=null; isDrawing.current=false; return; }
    if (templateGroupDrag.current) { templateGroupDrag.current=null; isDrawing.current=false; return; }
    if (!isDrawing.current) return; isDrawing.current=false;
    if (tool==="pan") return;
    if (tool==="eraser") { eraserPos.current=null; scheduleRedraw(); return; }
    if (tool==="laser") { if(socket) socket.emit("laser:stop"); return; }
    if (tool==="lasso") {
      if (isDraggingSelection.current) { isDraggingSelection.current=false; return; }
      if (lassoPath.current&&lassoPath.current.length>3) {
        const polygon=lassoPath.current, inside=drawingLayer.filter(s=>strokeInsideLasso(s,polygon)).map(s=>s.id);
        setSelectedIds(inside);
        if (inside.length>0) { const sel=drawingLayer.filter(s=>inside.includes(s.id)); let mnX=Infinity,mnY=Infinity,mxX=-Infinity,mxY=-Infinity; sel.forEach(s=>s.points?.forEach(p=>{mnX=Math.min(mnX,p.x);mnY=Math.min(mnY,p.y);mxX=Math.max(mxX,p.x);mxY=Math.max(mxY,p.y);})); setSelectionBounds({x:mnX,y:mnY,w:mxX-mnX,h:mxY-mnY}); if(onLassoSelect) onLassoSelect(inside); }
      }
      lassoPath.current=null; scheduleRedraw(); return;
    }
    if (!currentStroke.current) return;
    const finished={...currentStroke.current}; currentStroke.current=null;
    if (finished.points.length>1) { if(finished.type==="shape"){const shape=recognizeShape(finished.points);if(shape){finished.recognizedShape=shape;finished.type="recognized-shape";}} onStrokeEnd(finished); }
    scheduleRedraw();
  };

  useEffect(() => {
    const canvas=canvasRef.current; if(!canvas) return;
    const handleWheel = (e) => {
      e.preventDefault(); const rect=canvas.getBoundingClientRect(), mx=e.clientX-rect.left, my=e.clientY-rect.top;
      if (e.ctrlKey||Math.abs(e.deltaY)<50) { const z=zoom||1, nz=Math.min(5,Math.max(0.1,z-e.deltaY*0.005)), ox=panOffset?.x||0, oy=panOffset?.y||0, f=nz/z; if(onZoomChange) onZoomChange(nz); if(onPanChange) onPanChange({x:mx-(mx-ox)*f,y:my-(my-oy)*f}); }
      else { const ox=panOffset?.x||0,oy=panOffset?.y||0; if(onPanChange) onPanChange({x:ox-e.deltaX,y:oy-e.deltaY}); }
    };
    canvas.addEventListener("wheel",handleWheel,{passive:false}); return()=>canvas.removeEventListener("wheel",handleWheel);
  }, [zoom,panOffset,onZoomChange,onPanChange]);

  useEffect(() => {
    const handleKey = (e) => {
      if (selectedIds.length===0) return;
      if (e.key==="Delete"||e.key==="Backspace") { if(onDeleteStrokes) onDeleteStrokes(selectedIds); setSelectedIds([]); setSelectionBounds(null); }
      if (e.key==="d"&&(e.ctrlKey||e.metaKey)) { e.preventDefault(); const dupes=drawingLayer.filter(s=>selectedIds.includes(s.id)).map(s=>({...s,id:Date.now()+"-"+Math.random().toString(36).substr(2,9),points:s.points.map(p=>({x:p.x+20,y:p.y+20}))})); dupes.forEach(d=>onStrokeEnd(d)); setSelectedIds(dupes.map(d=>d.id)); }
    };
    window.addEventListener("keydown",handleKey); return()=>window.removeEventListener("keydown",handleKey);
  }, [selectedIds,drawingLayer,onDeleteStrokes,onStrokeEnd]);

  const handleTextSubmit = (text) => {
    if (text&&text.trim()&&editingText&&onTextAdd) onTextAdd({id:"text-"+Date.now()+"-"+Math.random().toString(36).substr(2,6),type:"text",x:editingText.x,y:editingText.y,text:text.trim(),fontSize:brushSize*5+12,color});
    setEditingText(null);
  };

  const handleBoxTextSubmit = (text) => {
    if (editingBox && onTextLayerUpdate) {
      onTextLayerUpdate(editingBox.id, { text: text || "" });
    }
    setEditingBox(null);
  };

  const getCursorStyle = () => { if(disabled) return "default"; if(tool==="laser") return "none"; if(tool==="pan") return "grab"; if(tool==="eraser") return "none"; if(tool==="text") return "text"; return "crosshair"; };

  const getTextInputStyle = () => {
    if (!editingText) return {};
    const z=zoom||1,ox=panOffset?.x||0,oy=panOffset?.y||0;
    return {position:"absolute",left:editingText.x*z+ox,top:editingText.y*z+oy,transform:"scale("+z+")",transformOrigin:"top left"};
  };

  return (
    <div style={{position:"relative",width:"100%",height:"100%"}}>
      <canvas ref={canvasRef} id="whiteboard-canvas"
        onMouseDown={handlePointerDown} onMouseMove={handlePointerMove} onMouseUp={handlePointerUp}
        onMouseLeave={(e)=>{handlePointerUp(e);if(tool==="eraser"){eraserPos.current=null;scheduleRedraw();}}}
        onTouchStart={handlePointerDown} onTouchMove={handlePointerMove} onTouchEnd={handlePointerUp}
        style={{cursor:getCursorStyle(),display:"block",width:"100%",height:"100%"}} />
      {editingText && (
        <div style={getTextInputStyle()} className="canvas-text-input-wrap">
          <textarea className="canvas-text-input" autoFocus placeholder="Type here..."
            style={{color,fontSize:brushSize*5+12}}
            onBlur={(e)=>handleTextSubmit(e.target.value)}
            onKeyDown={(e)=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleTextSubmit(e.target.value);}if(e.key==="Escape")setEditingText(null);}} />
        </div>
      )}
      {editingBox && (
        <div className="canvas-text-input-wrap" style={{
          position:"absolute",
          left: editingBox.x * (zoom||1) + (panOffset?.x||0),
          top: editingBox.y * (zoom||1) + (panOffset?.y||0),
          width: editingBox.width * (zoom||1),
          height: editingBox.height * (zoom||1),
        }}>
          <textarea className="canvas-box-edit" autoFocus
            defaultValue={editingBox.text}
            style={{width:"100%",height:"100%",fontSize:14*(zoom||1)}}
            onBlur={(e)=>handleBoxTextSubmit(e.target.value)}
            onKeyDown={(e)=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleBoxTextSubmit(e.target.value);}if(e.key==="Escape")setEditingBox(null);}} />
        </div>
      )}
    </div>
  );
};

export default Canvas;
