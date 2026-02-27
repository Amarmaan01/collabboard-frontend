import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useRef } from "react";
import {
  Pencil,
  Users,
  Brain,
  Play,
  Sparkles,
  Shield,
  ArrowRight,
  MessageSquare,
  Layers,
  Star,
  Github,
  BookOpen,
  Mail,
  ChevronRight,
  Monitor,
  Cpu,
  Zap,
} from "lucide-react";

const Landing = () => {
  const { user } = useAuth();
  const sectionsRef = useRef([]);

  // Intersection observer for fade-in animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    );

    sectionsRef.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const addRef = (el) => {
    if (el && !sectionsRef.current.includes(el)) {
      sectionsRef.current.push(el);
    }
  };

  return (
    <div className="landing">
      {/* ─── Navigation ─── */}
      <nav className="landing-nav">
        <div className="logo">CollabBoard AI</div>
        <div className="nav-links">
          <a href="#features" className="btn btn-ghost">Features</a>
          <a href="#preview" className="btn btn-ghost">Preview</a>
          {user ? (
            <>
              <Link to="/docs" className="btn btn-ghost">Docs</Link>
              <Link to="/dashboard" className="btn btn-primary">
                Dashboard <ArrowRight size={14} />
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary">Login</Link>
              <Link to="/register" className="btn btn-gradient">
                Get Started <ArrowRight size={14} />
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="landing-hero">
        <div className="hero-badge">
          <Sparkles size={14} />
          AI-Powered Collaborative Whiteboard
        </div>
        <h1>
          Collaborate Smarter in{" "}
          <span className="gradient">Real-Time</span>
        </h1>
        <p className="hero-sub">
          The all-in-one whiteboard for teams. Draw, brainstorm, and let AI
          generate diagrams &amp; summaries — together, in real-time.
        </p>
        <div className="cta-group">
          <Link
            to={user ? "/dashboard" : "/register"}
            className="btn btn-gradient btn-lg"
          >
            Start Collaborating <ArrowRight size={16} />
          </Link>
          <a href="#preview" className="btn btn-secondary btn-lg">
            <Play size={16} /> View Demo
          </a>
        </div>
        <div className="hero-stats">
          <div className="hero-stat">
            <strong>Real-Time</strong>
            <span>Sync</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <strong>AI-Powered</strong>
            <span>Summaries</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <strong>Unlimited</strong>
            <span>Rooms</span>
          </div>
        </div>
      </section>

      {/* ─── Features Section ─── */}
      <section className="landing-section" id="features" ref={addRef}>
        <div className="section-header">
          <span className="section-tag">Features</span>
          <h2>Everything you need to collaborate</h2>
          <p>Powerful tools designed for modern teams to brainstorm, design, and build together.</p>
        </div>
        <div className="features-grid">
          {[
            {
              icon: <Pencil size={22} />,
              title: "Real-Time Drawing",
              desc: "Draw together on a shared canvas with brushes, colors, shapes, and undo/redo — all synced instantly.",
              color: "var(--accent)",
              bg: "var(--accent-soft)",
            },
            {
              icon: <Users size={22} />,
              title: "Live Collaboration",
              desc: "Invite team members, see who's online, and collaborate with live cursors and presence indicators.",
              color: "var(--success)",
              bg: "var(--success-soft)",
            },
            {
              icon: <Brain size={22} />,
              title: "AI Meeting Summary",
              desc: "Let AI analyze your session and generate structured summaries of decisions and action items.",
              color: "#a78bfa",
              bg: "rgba(167, 139, 250, 0.12)",
            },
            {
              icon: <Sparkles size={22} />,
              title: "AI Diagram Generator",
              desc: "Describe a diagram in plain text and watch AI generate structured visual layouts on your board.",
              color: "#f472b6",
              bg: "rgba(244, 114, 182, 0.12)",
            },
            {
              icon: <Play size={22} />,
              title: "Session Replay",
              desc: "Replay any whiteboard session with a timeline scrubber to review every stroke and decision.",
              color: "var(--warning)",
              bg: "var(--warning-soft)",
            },
            {
              icon: <Shield size={22} />,
              title: "Role-Based Controls",
              desc: "Host permissions for board clear, room management, and secure password-protected rooms.",
              color: "#22d3ee",
              bg: "rgba(34, 211, 238, 0.12)",
            },
          ].map((feat, i) => (
            <div className="feature-card" key={i}>
              <div className="icon" style={{ background: feat.bg, color: feat.color }}>
                {feat.icon}
              </div>
              <h3>{feat.title}</h3>
              <p>{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Product Preview Section ─── */}
      <section className="landing-section preview-section" id="preview" ref={addRef}>
        <div className="section-header">
          <span className="section-tag">Preview</span>
          <h2>See it in action</h2>
          <p>A powerful whiteboard experience with AI built right in.</p>
        </div>
        <div className="preview-container">
          <div className="preview-mockup">
            {/* Mock whiteboard UI */}
            <div className="mock-topbar">
              <div className="mock-dots">
                <span style={{ background: "#ef4444" }} />
                <span style={{ background: "#f59e0b" }} />
                <span style={{ background: "#22c55e" }} />
              </div>
              <div className="mock-title">CollabBoard AI — Room #a7k3x</div>
              <div className="mock-avatars">
                <div className="mock-av" style={{ background: "#6366f1" }}>A</div>
                <div className="mock-av" style={{ background: "#22c55e", marginLeft: -8 }}>B</div>
                <div className="mock-av" style={{ background: "#f59e0b", marginLeft: -8 }}>C</div>
              </div>
            </div>
            <div className="mock-body">
              <div className="mock-toolbar">
                {["✏️", "🖌️", "📐", "🟦", "↩️"].map((t, i) => (
                  <div key={i} className={`mock-tool ${i === 0 ? "active" : ""}`}>{t}</div>
                ))}
              </div>
              <div className="mock-canvas">
                {/* SVG scribble lines for visual effect */}
                <svg viewBox="0 0 600 300" className="mock-drawing">
                  <path d="M80,180 Q150,60 280,140 T480,100" stroke="#6366f1" strokeWidth="3" fill="none" opacity="0.7" />
                  <path d="M100,220 Q200,160 350,200 T520,160" stroke="#a78bfa" strokeWidth="2" fill="none" opacity="0.5" />
                  <rect x="320" y="60" width="140" height="80" rx="8" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="6 3" opacity="0.6" />
                  <text x="355" y="105" fill="#22c55e" fontSize="14" opacity="0.7">Diagram</text>
                  <circle cx="160" cy="120" r="35" fill="none" stroke="#f59e0b" strokeWidth="2" opacity="0.5" />
                </svg>
              </div>
              <div className="mock-sidebar">
                <div className="mock-sidebar-tab active">💬 Chat</div>
                <div className="mock-sidebar-tab">🤖 AI</div>
                <div className="mock-chat-msgs">
                  <div className="mock-msg"><strong>Alice:</strong> Let's map this out</div>
                  <div className="mock-msg"><strong>Bob:</strong> Added the flow ✨</div>
                  <div className="mock-msg ai"><strong>AI:</strong> Summary ready!</div>
                </div>
              </div>
            </div>
            {/* Floating callouts */}
            <div className="callout callout-1">
              <Brain size={14} /> AI Panel
            </div>
            <div className="callout callout-2">
              <Monitor size={14} /> Live Cursors
            </div>
            <div className="callout callout-3">
              <Play size={14} /> Timeline Replay
            </div>
          </div>
        </div>
      </section>

      {/* ─── Social Proof Section ─── */}
      <section className="landing-section" ref={addRef}>
        <div className="section-header">
          <span className="section-tag">Testimonials</span>
          <h2>Loved by teams everywhere</h2>
          <p>See what teams are saying about CollabBoard AI.</p>
        </div>
        <div className="testimonials-grid">
          {[
            {
              name: "Sarah Chen",
              role: "Product Manager at TechFlow",
              text: "CollabBoard AI replaced three tools for our team. The AI summaries alone save us hours every week.",
              avatar: "SC",
              color: "#6366f1",
            },
            {
              name: "Marcus Rivera",
              role: "Lead Designer at PixelCraft",
              text: "The real-time collaboration is buttery smooth. Our remote design sprints have never been more productive.",
              avatar: "MR",
              color: "#22c55e",
            },
            {
              name: "Priya Sharma",
              role: "Engineering Lead at CloudScale",
              text: "Session replay is a game-changer for async teams. We can review any brainstorm session at any time.",
              avatar: "PS",
              color: "#f59e0b",
            },
          ].map((t, i) => (
            <div className="testimonial-card" key={i}>
              <div className="testimonial-stars">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={14} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>
              <p className="testimonial-text">"{t.text}"</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar" style={{ background: t.color }}>
                  {t.avatar}
                </div>
                <div>
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="trusted-by">
          <span>Trusted by teams at</span>
          <div className="logo-strip">
            {["TechFlow", "PixelCraft", "CloudScale", "DataSync", "NexGen"].map((name) => (
              <div key={name} className="company-logo">
                <Cpu size={16} /> {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section className="landing-cta" ref={addRef}>
        <div className="cta-content">
          <h2>Ready to collaborate smarter?</h2>
          <p>Create your first room in seconds. No credit card required.</p>
          <Link
            to={user ? "/dashboard" : "/register"}
            className="btn btn-gradient btn-lg"
          >
            Get Started Free <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="landing-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="logo">CollabBoard AI</div>
            <p>AI-powered real-time collaborative whiteboard for modern teams.</p>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#preview">Preview</a>
            <Link to={user ? "/docs" : "/register"}>Documentation</Link>
          </div>
          <div className="footer-col">
            <h4>Resources</h4>
            <Link to="/docs">Getting Started</Link>
            <Link to="/docs">API Reference</Link>
            <Link to="/docs">Deployment</Link>
          </div>
          <div className="footer-col">
            <h4>Connect</h4>
            <a href="https://github.com" target="_blank" rel="noreferrer">
              <Github size={14} /> GitHub
            </a>
            <Link to="/docs">
              <BookOpen size={14} /> Docs
            </Link>
            <a href="mailto:hello@collabboard.ai">
              <Mail size={14} /> Contact
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 CollabBoard AI. Built with ❤️ and AI.</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
