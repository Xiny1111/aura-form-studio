"use client";

import { ChangeEvent, PointerEvent, useCallback, useEffect, useRef, useState } from "react";

type Shape = "orb" | "squircle" | "diamond" | "drop" | "star" | "capsule";

const shapes: { id: Shape; label: string; glyph: string }[] = [
  { id: "orb", label: "光球", glyph: "●" },
  { id: "squircle", label: "软方", glyph: "▢" },
  { id: "diamond", label: "晶体", glyph: "◆" },
  { id: "drop", label: "水滴", glyph: "♢" },
  { id: "star", label: "星核", glyph: "✦" },
  { id: "capsule", label: "胶囊", glyph: "▰" },
];

const palettes = ["#ff4fd8", "#7c6cff", "#42d9ff", "#82ff9d", "#ffb84d", "#ffffff"];

function formatTime(value: number) {
  if (!Number.isFinite(value)) return "00:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function traceShape(ctx: CanvasRenderingContext2D, shape: Shape, x: number, y: number, radius: number) {
  ctx.beginPath();
  if (shape === "orb") {
    ctx.arc(x, y, radius, 0, Math.PI * 2);
  } else if (shape === "squircle") {
    const r = radius * 0.48;
    ctx.roundRect(x - radius, y - radius * 0.88, radius * 2, radius * 1.76, r);
  } else if (shape === "diamond") {
    ctx.moveTo(x, y - radius * 1.15);
    ctx.lineTo(x + radius * 0.86, y);
    ctx.lineTo(x, y + radius * 1.15);
    ctx.lineTo(x - radius * 0.86, y);
    ctx.closePath();
  } else if (shape === "drop") {
    ctx.moveTo(x, y - radius * 1.25);
    ctx.bezierCurveTo(x + radius * 0.35, y - radius * 0.63, x + radius, y - radius * 0.05, x + radius * 0.78, y + radius * 0.52);
    ctx.bezierCurveTo(x + radius * 0.51, y + radius * 1.18, x - radius * 0.51, y + radius * 1.18, x - radius * 0.78, y + radius * 0.52);
    ctx.bezierCurveTo(x - radius, y - radius * 0.05, x - radius * 0.35, y - radius * 0.63, x, y - radius * 1.25);
    ctx.closePath();
  } else if (shape === "star") {
    for (let i = 0; i < 16; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 8;
      const rr = i % 2 === 0 ? radius * 1.12 : radius * 0.47;
      const px = x + Math.cos(a) * rr;
      const py = y + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  } else {
    ctx.roundRect(x - radius * 0.7, y - radius * 1.15, radius * 1.4, radius * 2.3, radius * 0.7);
  }
}

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const objectUrlRef = useRef<string>();
  const dragRef = useRef<{ x: number; y: number; px: number; py: number }>();

  const [shape, setShape] = useState<Shape>("orb");
  const [glowColor, setGlowColor] = useState("#ff4fd8");
  const [coreColor, setCoreColor] = useState("#fff7fd");
  const [size, setSize] = useState(20);
  const [glow, setGlow] = useState(68);
  const [opacity, setOpacity] = useState(96);
  const [position, setPosition] = useState({ x: 50, y: 51 });
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [sourceName, setSourceName] = useState("智能体原片 · 01");
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const draw = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const x = (position.x / 100) * canvas.width;
    const y = (position.y / 100) * canvas.height;
    const radius = (size / 100) * Math.min(canvas.width, canvas.height);
    const blur = (glow / 100) * radius * 2.6;

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = (opacity / 100) * 0.34;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = blur * 1.9;
    ctx.fillStyle = glowColor;
    traceShape(ctx, shape, x, y, radius * 1.05);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = opacity / 100;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = blur;
    const gradient = ctx.createRadialGradient(x - radius * 0.28, y - radius * 0.32, radius * 0.05, x, y, radius * 1.05);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.22, coreColor);
    gradient.addColorStop(0.72, glowColor);
    gradient.addColorStop(1, glowColor + "cc");
    ctx.fillStyle = gradient;
    traceShape(ctx, shape, x, y, radius);
    ctx.fill();

    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.46;
    ctx.filter = `blur(${Math.max(1, radius * 0.05)}px)`;
    ctx.fillStyle = "white";
    traceShape(ctx, shape, x - radius * 0.2, y - radius * 0.2, radius * 0.56);
    ctx.fill();
    ctx.restore();
  }, [coreColor, glow, glowColor, opacity, position, shape, size]);

  useEffect(() => {
    const loop = () => {
      draw();
      const video = videoRef.current;
      if (video) {
        setTime(video.currentTime);
        if (exporting && video.duration) setExportProgress((video.currentTime / video.duration) * 100);
      }
      animationRef.current = requestAnimationFrame(loop);
    };
    animationRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationRef.current);
  }, [draw, exporting]);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play(); else video.pause();
  };

  const onUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = URL.createObjectURL(file);
    if (videoRef.current) videoRef.current.src = objectUrlRef.current;
    setSourceName(file.name.replace(/\.[^.]+$/, ""));
    setTime(0);
  };

  const seek = (value: number) => {
    if (videoRef.current) videoRef.current.currentTime = value;
  };

  const pointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const el = event.currentTarget;
    el.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, px: position.x, py: position.y };
  };

  const pointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setPosition({
      x: Math.max(0, Math.min(100, dragRef.current.px + ((event.clientX - dragRef.current.x) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, dragRef.current.py + ((event.clientY - dragRef.current.y) / rect.height) * 100)),
    });
  };

  const exportVideo = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !("MediaRecorder" in window)) return;
    setExporting(true);
    setExportProgress(0);
    video.currentTime = 0;
    const stream = canvas.captureStream(30);
    const sourceStream = (video as HTMLVideoElement & { captureStream?: () => MediaStream }).captureStream?.();
    sourceStream?.getAudioTracks().forEach((track) => stream.addTrack(track));
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
    recorder.onstop = () => {
      const url = URL.createObjectURL(new Blob(chunks, { type: mimeType }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${sourceName}-aura.webm`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setExporting(false);
      setExportProgress(100);
    };
    const stop = () => {
      video.removeEventListener("ended", stop);
      if (recorder.state !== "inactive") recorder.stop();
    };
    video.addEventListener("ended", stop);
    recorder.start(250);
    await video.play();
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">A</span><span>AURA / FORM</span><small>01</small></div>
        <div className="project-state"><i /> 实时合成 <span>·</span> {sourceName}</div>
        <div className="top-actions">
          <label className="button ghost upload-button">＋ 导入视频<input type="file" accept="video/*" onChange={onUpload} /></label>
          <button className="button export" onClick={exportVideo} disabled={exporting}>{exporting ? `渲染 ${Math.round(exportProgress)}%` : "导出视频 ↗"}</button>
        </div>
      </header>

      <section className="workspace">
        <aside className="rail">
          <div className="rail-index">编辑器<br/><b>01 / 03</b></div>
          <button className="rail-item active"><span>◈</span>形状</button>
          <button className="rail-item"><span>✺</span>光晕</button>
          <button className="rail-item"><span>⌁</span>位置</button>
          <div className="rail-note">拖动预览中的<br/>智能体调整位置</div>
        </aside>

        <section className="stage-panel">
          <div className="section-label"><span>PREVIEW</span><b>01</b></div>
          <div className="stage-wrap">
            <div className="stage-grid" />
            <div className="video-frame">
              <video
                ref={videoRef}
                src="/agent-demo.mp4"
                playsInline
                loop={!exporting}
                muted
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onCanPlay={draw}
              />
              <canvas
                ref={canvasRef}
                onPointerDown={pointerDown}
                onPointerMove={pointerMove}
                onPointerUp={() => (dragRef.current = undefined)}
                onDoubleClick={() => setPosition({ x: 50, y: 51 })}
                aria-label="可拖动的智能体视频预览"
              />
              <div className="frame-corner top-left" /><div className="frame-corner top-right" />
              <div className="frame-corner bottom-left" /><div className="frame-corner bottom-right" />
              <div className="drag-hint">拖动智能体</div>
            </div>
          </div>
          <div className="transport">
            <button className="play" onClick={togglePlayback} aria-label={playing ? "暂停" : "播放"}>{playing ? "Ⅱ" : "▶"}</button>
            <span className="timecode">{formatTime(time)}</span>
            <input className="timeline" type="range" min="0" max={duration || 1} step="0.01" value={time} onChange={(e) => seek(Number(e.target.value))} />
            <span className="timecode dim">{formatTime(duration)}</span>
            <button className="reset" onClick={() => { seek(0); setPosition({ x: 50, y: 51 }); }}>↺ 重置</button>
          </div>
        </section>

        <aside className="inspector">
          <div className="section-label"><span>CONTROLS</span><b>02</b></div>
          <section className="control-section">
            <div className="control-title"><span>智能体形状</span><em>FORM</em></div>
            <div className="shape-grid">
              {shapes.map((item) => (
                <button key={item.id} className={`shape-button ${shape === item.id ? "selected" : ""}`} onClick={() => setShape(item.id)}>
                  <span className={`shape-glyph ${item.id}`}>{item.glyph}</span><small>{item.label}</small>
                </button>
              ))}
            </div>
          </section>

          <section className="control-section">
            <div className="control-title"><span>光晕颜色</span><em>AURA</em></div>
            <div className="color-row">
              <label className="color-well" style={{ backgroundColor: glowColor }}><input type="color" value={glowColor} onChange={(e) => setGlowColor(e.target.value)} /></label>
              <div className="hex-value">{glowColor.toUpperCase()}</div>
            </div>
            <div className="swatches">
              {palettes.map((color) => <button key={color} aria-label={`选择颜色 ${color}`} className={glowColor === color ? "active" : ""} style={{ backgroundColor: color }} onClick={() => setGlowColor(color)} />)}
            </div>
          </section>

          <section className="control-section sliders">
            <Range label="形状大小" value={size} min={7} max={36} unit="%" onChange={setSize} />
            <Range label="光晕扩散" value={glow} min={0} max={100} unit="" onChange={setGlow} />
            <Range label="智能体不透明度" value={opacity} min={10} max={100} unit="%" onChange={setOpacity} />
          </section>

          <section className="control-section core-color">
            <div className="control-title"><span>核心高光</span><em>CORE</em></div>
            <label><input type="color" value={coreColor} onChange={(e) => setCoreColor(e.target.value)} /><span style={{ backgroundColor: coreColor }} />{coreColor.toUpperCase()}</label>
          </section>
          <p className="tip"><b>TIP</b> 双击画面可将智能体归位。导出会实时录制完整视频，保持当前的形状和光晕设置。</p>
        </aside>
      </section>
    </main>
  );
}

function Range({ label, value, min, max, unit, onChange }: { label: string; value: number; min: number; max: number; unit: string; onChange: (n: number) => void }) {
  return (
    <label className="range-control">
      <span>{label}<b>{value}{unit}</b></span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ "--range": `${((value - min) / (max - min)) * 100}%` } as React.CSSProperties} />
    </label>
  );
}
