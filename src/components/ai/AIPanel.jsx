import { useState } from "react";
import api from "../../services/api";
import { Sparkles, FileText } from "lucide-react";

const AIPanel = ({ chatHistory, eventLog, onGenerate }) => {
  const [diagramPrompt, setDiagramPrompt] = useState("");
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingDiagram, setLoadingDiagram] = useState(false);

  const handleSummarize = async () => {
    setLoadingSummary(true);
    try {
      const { data } = await api.post("/ai/summarize", {
        chatHistory,
        eventLog,
      });
      setSummary(data);
    } catch (err) {
      console.error("Summarize failed:", err);
      setSummary({
        summary: "Failed to generate summary. Please try again.",
        keyPoints: [],
        actionItems: [],
      });
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleGenerateDiagram = async () => {
    if (!diagramPrompt.trim()) return;
    setLoadingDiagram(true);
    try {
      const { data } = await api.post("/ai/generate-diagram", {
        prompt: diagramPrompt,
      });
      if (data.elements && data.elements.length > 0) {
        onGenerate(data.elements);
        setDiagramPrompt("");
      }
    } catch (err) {
      console.error("Generate diagram failed:", err);
    } finally {
      setLoadingDiagram(false);
    }
  };

  return (
    <div className="ai-panel">
      {/* Diagram Generator */}
      <div className="ai-section">
        <h4>
          <Sparkles size={14} style={{ marginRight: 6 }} />
          Generate Diagram
        </h4>
        <textarea
          placeholder="Describe a diagram... e.g., 'User authentication flow with login, register, and dashboard'"
          value={diagramPrompt}
          onChange={(e) => setDiagramPrompt(e.target.value)}
        />
        <button
          className="btn btn-primary"
          onClick={handleGenerateDiagram}
          disabled={loadingDiagram || !diagramPrompt.trim()}
          style={{ width: "100%", fontSize: 13 }}
        >
          {loadingDiagram ? "Generating..." : "Generate on Canvas"}
        </button>
      </div>

      {/* Session Summary */}
      <div className="ai-section">
        <h4>
          <FileText size={14} style={{ marginRight: 6 }} />
          Session Summary
        </h4>
        <button
          className="btn btn-secondary"
          onClick={handleSummarize}
          disabled={loadingSummary}
          style={{ width: "100%", fontSize: 13, marginBottom: 12 }}
        >
          {loadingSummary ? "Analyzing..." : "Generate Summary"}
        </button>

        {summary && (
          <div className="ai-result">
            <p><strong>Summary:</strong> {summary.summary}</p>

            {summary.keyPoints?.length > 0 && (
              <>
                <p style={{ marginTop: 12 }}><strong>Key Points:</strong></p>
                <ul>
                  {summary.keyPoints.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </>
            )}

            {summary.actionItems?.length > 0 && (
              <>
                <p style={{ marginTop: 12 }}><strong>Action Items:</strong></p>
                <ul>
                  {summary.actionItems.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIPanel;
