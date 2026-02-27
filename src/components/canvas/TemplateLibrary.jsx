import { useState } from "react";
import { X, LayoutGrid, GitBranch, Brain, BarChart3, MessageSquare } from "lucide-react";

const TEMPLATES = [
  {
    id: "kanban",
    name: "Kanban Board",
    icon: LayoutGrid,
    description: "Track tasks across To-Do, In Progress, and Done columns",
    color: "#3b82f6",
    generate: () => {
      const cols = ["To-Do", "In Progress", "Done"];
      const elements = [];
      cols.forEach((col, i) => {
        // Column header
        elements.push({
          id: `kanban-col-${i}`,
          type: "box",
          x: 100 + i * 280,
          y: 80,
          width: 240,
          height: 50,
          text: col,
        });
        // Empty card slots
        for (let j = 0; j < 3; j++) {
          elements.push({
            id: `kanban-card-${i}-${j}`,
            type: "box",
            x: 110 + i * 280,
            y: 150 + j * 80,
            width: 220,
            height: 60,
            text: `Task ${j + 1}`,
          });
        }
      });
      return elements;
    },
  },
  {
    id: "flowchart",
    name: "Flowchart",
    icon: GitBranch,
    description: "Create process flows with connected decision boxes",
    color: "#6366f1",
    generate: () => {
      const nodes = [
        { id: "fc-start", text: "Start", x: 350, y: 50, width: 140, height: 50 },
        { id: "fc-process1", text: "Process A", x: 350, y: 150, width: 140, height: 50 },
        { id: "fc-decision", text: "Condition?", x: 350, y: 260, width: 140, height: 50 },
        { id: "fc-yes", text: "Path A", x: 180, y: 370, width: 140, height: 50 },
        { id: "fc-no", text: "Path B", x: 520, y: 370, width: 140, height: 50 },
        { id: "fc-end", text: "End", x: 350, y: 470, width: 140, height: 50 },
      ];
      const arrows = [
        { id: "fc-a1", type: "arrow", from: "fc-start", to: "fc-process1" },
        { id: "fc-a2", type: "arrow", from: "fc-process1", to: "fc-decision" },
        { id: "fc-a3", type: "arrow", from: "fc-decision", to: "fc-yes" },
        { id: "fc-a4", type: "arrow", from: "fc-decision", to: "fc-no" },
        { id: "fc-a5", type: "arrow", from: "fc-yes", to: "fc-end" },
        { id: "fc-a6", type: "arrow", from: "fc-no", to: "fc-end" },
      ];
      return [...nodes.map(n => ({ ...n, type: "box" })), ...arrows];
    },
  },
  {
    id: "mindmap",
    name: "Mind Map",
    icon: Brain,
    description: "Brainstorm ideas radiating from a central concept",
    color: "#a855f7",
    generate: () => {
      const cx = 400, cy = 280;
      const elements = [
        { id: "mm-center", type: "box", x: cx - 80, y: cy - 30, width: 160, height: 60, text: "Main Idea" },
      ];
      const branches = ["Idea A", "Idea B", "Idea C", "Idea D", "Idea E"];
      branches.forEach((text, i) => {
        const angle = (i / branches.length) * Math.PI * 2 - Math.PI / 2;
        const r = 200;
        const bx = cx + r * Math.cos(angle) - 65;
        const by = cy + r * Math.sin(angle) - 25;
        elements.push({
          id: `mm-branch-${i}`,
          type: "box",
          x: bx,
          y: by,
          width: 130,
          height: 50,
          text,
        });
        elements.push({
          id: `mm-arrow-${i}`,
          type: "arrow",
          from: "mm-center",
          to: `mm-branch-${i}`,
        });
      });
      return elements;
    },
  },
  {
    id: "swot",
    name: "SWOT Analysis",
    icon: BarChart3,
    description: "Analyze Strengths, Weaknesses, Opportunities, Threats",
    color: "#22c55e",
    generate: () => {
      const labels = ["Strengths", "Weaknesses", "Opportunities", "Threats"];
      const elements = [];
      labels.forEach((label, i) => {
        const row = Math.floor(i / 2);
        const col = i % 2;
        elements.push({
          id: `swot-${i}`,
          type: "box",
          x: 150 + col * 300,
          y: 100 + row * 220,
          width: 260,
          height: 180,
          text: label,
        });
      });
      return elements;
    },
  },
  {
    id: "retro",
    name: "Retrospective",
    icon: MessageSquare,
    description: "What went well, what didn't, action items",
    color: "#ec4899",
    generate: () => {
      const cols = ["😊 Went Well", "😞 Improve", "💡 Action Items"];
      const elements = [];
      cols.forEach((col, i) => {
        elements.push({
          id: `retro-col-${i}`,
          type: "box",
          x: 80 + i * 280,
          y: 60,
          width: 240,
          height: 50,
          text: col,
        });
        // Placeholder cards
        for (let j = 0; j < 4; j++) {
          elements.push({
            id: `retro-card-${i}-${j}`,
            type: "box",
            x: 90 + i * 280,
            y: 130 + j * 80,
            width: 220,
            height: 60,
            text: "",
          });
        }
      });
      return elements;
    },
  },
];

const TemplateLibrary = ({ onSelect, onClose }) => {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <div className="template-modal-overlay" onClick={onClose}>
      <div className="template-modal" onClick={(e) => e.stopPropagation()}>
        <div className="template-modal-header">
          <h2>📋 Template Library</h2>
          <button className="template-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <p className="template-subtitle">
          Choose a template to instantly populate your whiteboard
        </p>
        <div className="template-grid">
          {TEMPLATES.map((tmpl) => {
            const Icon = tmpl.icon;
            return (
              <div
                key={tmpl.id}
                className={`template-card ${hoveredId === tmpl.id ? "hovered" : ""}`}
                onMouseEnter={() => setHoveredId(tmpl.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => {
                  const elements = tmpl.generate();
                  onSelect(elements);
                  onClose();
                }}
              >
                <div className="template-icon" style={{ background: tmpl.color + "22", color: tmpl.color }}>
                  <Icon size={28} />
                </div>
                <h3>{tmpl.name}</h3>
                <p>{tmpl.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TemplateLibrary;
