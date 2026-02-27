import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause } from "lucide-react";

const ReplayBar = ({ eventLog, drawingLayer, setDrawingLayer, setTextLayer }) => {
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const playIntervalRef = useRef(null);
  const originalLayersRef = useRef(null);

  // Save original layers when entering replay
  useEffect(() => {
    originalLayersRef.current = {
      drawing: [...drawingLayer],
    };
    return () => {
      // Restore on unmount
      if (originalLayersRef.current) {
        setDrawingLayer(originalLayersRef.current.drawing);
      }
    };
  }, []);

  // Filter only drawing events for replay
  const drawingEvents = eventLog.filter(
    (e) => e.eventType === "drawing:end" || e.eventType === "board:clear"
  );

  const totalEvents = drawingEvents.length;

  const replayToPosition = useCallback(
    (pos) => {
      const eventsToReplay = drawingEvents.slice(0, pos);
      let replayedStrokes = [];

      eventsToReplay.forEach((event) => {
        if (event.eventType === "board:clear") {
          replayedStrokes = [];
        } else if (event.eventType === "drawing:end" && event.payload) {
          replayedStrokes.push(event.payload);
        }
      });

      setDrawingLayer(replayedStrokes);
    },
    [drawingEvents, setDrawingLayer]
  );

  // Handle slider change
  const handleSliderChange = (e) => {
    const newPos = Number(e.target.value);
    setPosition(newPos);
    replayToPosition(newPos);
  };

  // Play/Pause
  const togglePlay = () => {
    if (playing) {
      clearInterval(playIntervalRef.current);
      setPlaying(false);
    } else {
      setPlaying(true);
      let currentPos = position;

      playIntervalRef.current = setInterval(() => {
        currentPos += 1;
        if (currentPos > totalEvents) {
          clearInterval(playIntervalRef.current);
          setPlaying(false);
          return;
        }
        setPosition(currentPos);
        replayToPosition(currentPos);
      }, 300);
    }
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, []);

  const formatTimestamp = () => {
    if (totalEvents === 0) return "No events";
    if (position === 0) return "Start";
    const event = drawingEvents[position - 1];
    if (event?.timestamp) {
      return new Date(event.timestamp).toLocaleTimeString();
    }
    return `${position}/${totalEvents}`;
  };

  return (
    <div className="timeline-bar">
      <button
        className="btn btn-icon"
        onClick={togglePlay}
        disabled={totalEvents === 0}
      >
        {playing ? <Pause size={18} /> : <Play size={18} />}
      </button>

      <input
        type="range"
        min="0"
        max={totalEvents}
        value={position}
        onChange={handleSliderChange}
        disabled={totalEvents === 0}
      />

      <span className="timestamp">{formatTimestamp()}</span>
    </div>
  );
};

export default ReplayBar;
