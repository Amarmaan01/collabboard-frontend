import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Layers,
  Rocket,
  Cpu,
  Code2,
  Cloud,
  Palette,
  MessageSquare,
  Sparkles,
  PlayCircle,
  StickyNote,
  Image,
  Download,
  Pencil,
  LayoutTemplate,
  Type,
} from "lucide-react";

const sections = [
  {
    id: "overview",
    icon: <Layers size={18} />,
    title: "Overview",
    content: (
      <>
        <p>
          <strong>CollabBoard AI</strong> is a full-stack, real-time collaborative
          whiteboard built as a capstone project. It enables multiple users to
          draw, annotate, chat, and brainstorm on a shared infinite canvas — with
          built-in AI assistance powered by Google Gemini.
        </p>
        <p>
          Whether you're sketching wireframes, running a brainstorming session,
          or teaching remotely, CollabBoard AI provides the tools you need for
          seamless visual collaboration.
        </p>
        <h4>Key Highlights</h4>
        <div className="docs-feature-grid">
          <div className="docs-feature">
            <Palette size={20} />
            <strong>Infinite Canvas</strong>
            <span>Multi-layer drawing with pan &amp; zoom</span>
          </div>
          <div className="docs-feature">
            <MessageSquare size={20} />
            <strong>Real-time Chat</strong>
            <span>Integrated messaging with presence indicators</span>
          </div>
          <div className="docs-feature">
            <Sparkles size={20} />
            <strong>AI Assistant</strong>
            <span>Summarize, generate diagrams &amp; recognize handwriting</span>
          </div>
          <div className="docs-feature">
            <PlayCircle size={20} />
            <strong>Session Replay</strong>
            <span>Record and play back drawing sessions</span>
          </div>
        </div>
      </>
    ),
  },
  {
    id: "getting-started",
    icon: <Rocket size={18} />,
    title: "Getting Started",
    content: (
      <>
        <h4>Prerequisites</h4>
        <ul>
          <li>Node.js ≥ 18</li>
          <li>MongoDB Atlas account (or local MongoDB)</li>
          <li>Google Gemini API key</li>
          <li>Google OAuth credentials (optional)</li>
        </ul>

        <h4>1. Clone &amp; Install</h4>
        <div className="docs-code">
          <code>
            git clone &lt;repo-url&gt;{"\n"}
            cd pepProject{"\n\n"}
            # Backend{"\n"}
            cd backend{"\n"}
            npm install{"\n\n"}
            # Frontend{"\n"}
            cd ../frontend{"\n"}
            npm install
          </code>
        </div>

        <h4>2. Environment Variables</h4>
        <p>Create <code>backend/.env</code> with:</p>
        <div className="docs-code">
          <code>
            PORT=5001{"\n"}
            MONGO_URI=mongodb+srv://...{"\n"}
            JWT_SECRET=your_secret{"\n"}
            GEMINI_API_KEY=your_gemini_key{"\n"}
            GOOGLE_CLIENT_ID=...{"\n"}
            GOOGLE_CLIENT_SECRET=...{"\n"}
            CLIENT_URL=http://localhost:5173{"\n"}
            SESSION_SECRET=your_session_secret
          </code>
        </div>

        <h4>3. Run the App</h4>
        <div className="docs-code">
          <code>
            # Terminal 1 — Backend{"\n"}
            cd backend &amp;&amp; npm run dev{"\n\n"}
            # Terminal 2 — Frontend{"\n"}
            cd frontend &amp;&amp; npm run dev
          </code>
        </div>
        <p>
          The frontend runs on <strong>http://localhost:5173</strong> and the
          backend on <strong>http://localhost:5001</strong>.
        </p>
      </>
    ),
  },
  {
    id: "features",
    icon: <Cpu size={18} />,
    title: "Feature Breakdown",
    content: (
      <>
        <div className="docs-feature-grid cols-2">
          <div className="docs-feature">
            <StickyNote size={20} />
            <strong>Sticky Notes</strong>
            <span>Create, drag, edit, and color-code sticky notes on the canvas. Double-click to edit text inline.</span>
          </div>
          <div className="docs-feature">
            <Image size={20} />
            <strong>Image Upload</strong>
            <span>Upload images directly onto the canvas. Supports drag positioning and server-side storage.</span>
          </div>
          <div className="docs-feature">
            <Download size={20} />
            <strong>Export PNG / PDF</strong>
            <span>Export the current canvas state as a high-resolution PNG or a paginated PDF document.</span>
          </div>
          <div className="docs-feature">
            <Pencil size={20} />
            <strong>Shape Recognition</strong>
            <span>AI-powered recognition that snaps freehand drawings into clean geometric shapes.</span>
          </div>
          <div className="docs-feature">
            <LayoutTemplate size={20} />
            <strong>Template Library</strong>
            <span>Pre-built templates for flowcharts, mind maps, Kanban boards, and retrospective layouts.</span>
          </div>
          <div className="docs-feature">
            <Type size={20} />
            <strong>AI Handwriting → Text</strong>
            <span>Convert freehand handwriting on the canvas to clean digital text using Gemini AI.</span>
          </div>
          <div className="docs-feature">
            <Sparkles size={20} />
            <strong>AI Summarize</strong>
            <span>Summarize the contents of your whiteboard session into concise bullet points.</span>
          </div>
          <div className="docs-feature">
            <Sparkles size={20} />
            <strong>AI Diagram Generation</strong>
            <span>Describe a diagram in natural language and AI generates it directly on the canvas.</span>
          </div>
        </div>
      </>
    ),
  },
  {
    id: "tech-stack",
    icon: <Code2 size={18} />,
    title: "Tech Stack",
    content: (
      <>
        <table className="docs-table">
          <thead>
            <tr>
              <th>Layer</th>
              <th>Technology</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Frontend</td><td>React 19, Vite 7, React Router v7, Framer Motion</td></tr>
            <tr><td>Styling</td><td>Custom CSS design system, Lucide Icons, Inter font</td></tr>
            <tr><td>State</td><td>Context API, useRef for canvas</td></tr>
            <tr><td>Backend</td><td>Node.js, Express v5, Mongoose v9</td></tr>
            <tr><td>Database</td><td>MongoDB Atlas</td></tr>
            <tr><td>Real-time</td><td>Socket.io v4 (WebSocket + fallback)</td></tr>
            <tr><td>Auth</td><td>JWT (HTTP-only cookies) + Passport.js Google OAuth</td></tr>
            <tr><td>AI</td><td>Google Gemini 2.0 Flash (@google/generative-ai)</td></tr>
            <tr><td>File Upload</td><td>Multer (server-side storage)</td></tr>
            <tr><td>PDF Export</td><td>jsPDF</td></tr>
          </tbody>
        </table>
      </>
    ),
  },
  {
    id: "deployment",
    icon: <Cloud size={18} />,
    title: "Deployment Guide",
    content: (
      <>
        <h4>Production Build</h4>
        <div className="docs-code">
          <code>
            cd frontend{"\n"}
            npm run build{"\n"}
            # Output in frontend/dist/
          </code>
        </div>

        <h4>Deployment Options</h4>
        <ul>
          <li><strong>Frontend:</strong> Deploy <code>dist/</code> to Vercel, Netlify, or any static host.</li>
          <li><strong>Backend:</strong> Deploy to Render, Railway, Azure App Service, or AWS EC2.</li>
          <li><strong>Database:</strong> MongoDB Atlas (already configured for cloud).</li>
        </ul>

        <h4>Environment Checklist</h4>
        <ul>
          <li>✅ Set all <code>.env</code> variables in production</li>
          <li>✅ Update <code>CLIENT_URL</code> to your production frontend domain</li>
          <li>✅ Enable CORS for your production domain</li>
          <li>✅ Ensure MongoDB Atlas allows your server IP in Network Access</li>
          <li>✅ Use HTTPS in production for secure cookies</li>
        </ul>
      </>
    ),
  },
];

const Documentation = () => {
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState(new Set(["overview"]));

  const toggle = (id) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="docs-page">
      <button className="btn btn-secondary" onClick={() => navigate("/dashboard")} style={{ marginBottom: 24 }}>
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="docs-header">
        <h1>📚 Documentation</h1>
        <p>Everything you need to know about CollabBoard AI — setup, features, and deployment.</p>
      </div>

      <div className="docs-sections">
        {sections.map((s) => {
          const isOpen = openSections.has(s.id);
          return (
            <div key={s.id} className={`docs-section ${isOpen ? "open" : ""}`}>
              <button className="docs-section-header" onClick={() => toggle(s.id)}>
                <div className="docs-section-title">
                  {s.icon}
                  <span>{s.title}</span>
                </div>
                {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>
              {isOpen && <div className="docs-section-content">{s.content}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Documentation;
