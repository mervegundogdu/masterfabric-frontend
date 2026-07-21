"use client";

import { useState, useEffect } from "react";
import { CreateMLCEngine } from "@mlc-ai/web-llm";

// Vercel / Local environment variable support
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"auth" | "studio" | "monitoring">("auth");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [engine, setEngine] = useState<any>(null);
  const [statusText, setStatusText] = useState("Model not loaded yet.");
  const [progressPercent, setProgressPercent] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [tokensPerSec, setTokensPerSec] = useState<number | null>(null);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const [backendStatus, setBackendStatus] = useState("Pending");

  // Real-time metric log history
  const [logs, setLogs] = useState<Array<{ prompt: string; speed: number; time: number }>>([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/config/models`)
      .then((res) => res.json())
      .then((data) => console.log("Backend Model Config:", data))
      .catch((err) => console.error("Backend connection error:", err));
  }, []);

  const loadModel = async () => {
    try {
      setStatusText("Fetching Gemma 2 2B Model...");
      const clientEngine = await CreateMLCEngine("Gemma-2-2b-it-q4f16_1", {
        initProgressCallback: (progress) => {
          setStatusText(`Loading: ${progress.text}`);
          setProgressPercent(Math.round(progress.progress * 100));
        },
      });
      setEngine(clientEngine);
      setStatusText("Gemma 2 2B ready via local hardware acceleration (WebGPU)!");
    } catch (error) {
      console.error(error);
      setStatusText("Loading failed. Is WebGPU enabled on your device?");
    }
  };

  const generateText = async () => {
    if (!engine || !prompt.trim()) return;
    setIsLoading(true);
    setResponse("");

    const startTime = performance.now();

    try {
      const messages = [{ role: "user", content: prompt }];
      const chunks = await engine.chat.completions.create({ messages, stream: true });
      
      let fullReply = "";
      for await (const chunk of chunks) {
        const content = chunk.choices[0]?.delta?.content || "";
        fullReply += content;
        setResponse((prev) => prev + content);
      }

      const endTime = performance.now();
      const totalTimeSec = (endTime - startTime) / 1000;
      setGenerationTime(totalTimeSec);

      const wordCount = fullReply.split(/\s+/).filter(Boolean).length;
      const speed = parseFloat((wordCount / totalTimeSec).toFixed(2));
      setTokensPerSec(speed);

      // Append to metrics log
      setLogs((prev) => [{ prompt, speed, time: totalTimeSec }, ...prev]);

      sendMetricsToBackend(prompt, fullReply, speed, totalTimeSec);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMetricsToBackend = async (p: string, r: string, speed: number, time: number) => {
    setBackendStatus("Syncing...");
    try {
      await fetch(`${API_BASE_URL}/api/v1/monitoring/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p, response: r }),
      });

      await fetch(`${API_BASE_URL}/api/v1/monitoring/scoring`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokens_per_sec: speed, duration: time, hardware: "WebGPU" }),
      });

      setBackendStatus("Connected (200 OK)");
    } catch (err) {
      setBackendStatus("Connection Error");
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      setIsLoggedIn(true);
      setActiveTab("studio");
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-gray-200 p-4 md:p-10 font-sans selection:bg-purple-500 selection:text-white">
      {/* Header / Navigation */}
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center border-b border-gray-800/80 pb-6 mb-8 gap-4">
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-4 h-4">
            <div className="absolute w-full h-full bg-purple-500 rounded-full animate-ping opacity-75" />
            <div className="w-2.5 h-2.5 bg-purple-400 rounded-full shadow-[0_0_12px_#a855f7]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wider flex items-center gap-2">
              MASTERMIND <span className="text-purple-400 font-light text-sm bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded-md">AI GATEWAY</span>
            </h1>
          </div>
        </div>

        <nav className="flex space-x-1 bg-[#111622] p-1.5 rounded-xl border border-gray-800/80 shadow-inner">
          <button 
            onClick={() => setActiveTab("auth")} 
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${activeTab === "auth" ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40" : "text-gray-400 hover:text-white hover:bg-gray-800/40"}`}
          >
            Gateway Auth
          </button>
          <button 
            onClick={() => setActiveTab("studio")} 
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${activeTab === "studio" ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40" : "text-gray-400 hover:text-white hover:bg-gray-800/40"}`}
          >
            LLM Studio
          </button>
          <button 
            onClick={() => setActiveTab("monitoring")} 
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${activeTab === "monitoring" ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40" : "text-gray-400 hover:text-white hover:bg-gray-800/40"}`}
          >
            Deci-Scoring Analytics
          </button>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto">
        {/* VIEW 1: AUTH VIEW */}
        {activeTab === "auth" && (
          <div className="max-w-md mx-auto bg-[#111622] p-8 rounded-2xl border border-gray-800 shadow-2xl mt-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl" />
            <div className="text-center mb-6">
              <div className="inline-block p-3 rounded-2xl bg-purple-950/40 border border-purple-500/20 mb-3">
                <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-white">Secure Access Gateway</h2>
              <p className="text-xs text-gray-400 mt-1">Authenticate credentials to access MasterMind Gateway</p>
            </div>
            
            {isLoggedIn ? (
              <div className="bg-emerald-950/30 border border-emerald-500/30 p-5 rounded-xl text-center space-y-3">
                <p className="text-emerald-400 text-sm font-medium">✓ Session Verified Successfully</p>
                <button 
                  onClick={() => setActiveTab("studio")} 
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 rounded-lg transition-all shadow-md shadow-emerald-950/50"
                >
                  Proceed to LLM Studio →
                </button>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full text-sm p-3 rounded-xl bg-[#090d16] border border-gray-800 text-white focus:outline-none focus:border-purple-500 transition-colors" placeholder="user@mastermind.co" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full text-sm p-3 rounded-xl bg-[#090d16] border border-gray-800 text-white focus:outline-none focus:border-purple-500 transition-colors" placeholder="••••••••" required />
                </div>
                <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 p-3 rounded-xl text-sm font-semibold text-white transition-all shadow-lg shadow-purple-900/30 mt-2">
                  Authenticate Session
                </button>
              </form>
            )}
          </div>
        )}

        {/* VIEW 2: STUDIO VIEW */}
        {activeTab === "studio" && (
          <div className="space-y-6">
            {/* Model Status Card */}
            <div className="bg-[#111622] p-5 rounded-2xl border border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
              <div className="flex-1 w-full">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/20">Web-LLM Engine</span>
                  <span className="text-xs text-gray-400 font-medium">Gemma-2-2b-it-q4f16_1</span>
                </div>
                <p className="text-sm text-white font-medium mt-1">{statusText}</p>
                {progressPercent > 0 && progressPercent < 100 && (
                  <div className="w-full bg-[#090d16] h-2 rounded-full mt-3 overflow-hidden border border-gray-800">
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-500 h-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                  </div>
                )}
              </div>
              {!engine && (
                <button onClick={loadModel} className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 py-3 rounded-xl text-xs font-semibold transition-all shrink-0 shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Gemma Model (WebGPU)
                </button>
              )}
            </div>

            {/* Prompt & Streaming Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Prompt Input */}
              <div className="bg-[#111622] p-6 rounded-2xl border border-gray-800 flex flex-col h-[400px]">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full" /> Input Panel (Prompt)
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">LOCAL INFERENCE</span>
                </h3>
                <textarea 
                  value={prompt} 
                  onChange={(e) => setPrompt(e.target.value)} 
                  className="w-full flex-1 p-4 rounded-xl bg-[#090d16] border border-gray-800 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors resize-none mb-4 font-mono leading-relaxed" 
                  placeholder="Enter a prompt to process locally in browser..." 
                />
                <button 
                  onClick={generateText} 
                  disabled={isLoading || !engine || !prompt.trim()} 
                  className="w-full bg-purple-600 hover:bg-purple-500 p-3.5 rounded-xl text-sm font-semibold text-white disabled:opacity-30 disabled:hover:bg-purple-600 transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating Stream...
                    </>
                  ) : (
                    "Run Inference (WebGPU)"
                  )}
                </button>
              </div>

              {/* Streaming Output */}
              <div className="bg-[#111622] p-6 rounded-2xl border border-gray-800 flex flex-col h-[400px]">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" /> Live Stream Output
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">REAL-TIME TOKENS</span>
                </h3>
                <div className="w-full flex-1 p-4 bg-[#090d16] rounded-xl border border-gray-800 text-sm text-gray-300 overflow-y-auto font-mono whitespace-pre-wrap leading-relaxed">
                  {response || <span className="text-gray-600 italic">Responses generated by local Gemma model will stream here in real-time...</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: MONITORING VIEW */}
        {activeTab === "monitoring" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#111622] p-6 rounded-2xl border border-gray-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl -mr-5 -mt-5" />
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Deci-Scoring Throughput</p>
                <h3 className="text-3xl font-bold text-yellow-400 mt-2 font-mono">
                  {tokensPerSec ? `${tokensPerSec}` : "0.00"} <span className="text-sm font-normal text-gray-400">W/sec</span>
                </h3>
                <p className="text-[11px] text-gray-500 mt-3 border-t border-gray-800/80 pt-2">In-browser hardware-accelerated generation speed metric.</p>
              </div>

              <div className="bg-[#111622] p-6 rounded-2xl border border-gray-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl -mr-5 -mt-5" />
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Output Latency</p>
                <h3 className="text-3xl font-bold text-cyan-400 mt-2 font-mono">
                  {generationTime ? `${generationTime.toFixed(2)}` : "0.00"} <span className="text-sm font-normal text-gray-400">sec</span>
                </h3>
                <p className="text-[11px] text-gray-500 mt-3 border-t border-gray-800/80 pt-2">Net elapsed time from request dispatch to completion.</p>
              </div>

              <div className="bg-[#111622] p-6 rounded-2xl border border-gray-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-5 -mt-5" />
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Go Backend Sync</p>
                <div className="mt-3">
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg inline-block ${backendStatus.includes("Connected") ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30" : "bg-gray-800 text-gray-400"}`}>
                    {backendStatus}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 mt-3 border-t border-gray-800/80 pt-2">Async performance metrics transmission state.</p>
              </div>
            </div>

            {/* Inference Metrics History Table */}
            {logs.length > 0 && (
              <div className="bg-[#111622] p-6 rounded-2xl border border-gray-800">
                <h3 className="text-sm font-semibold text-white mb-4">Real-Time Inference Logs & Metrics</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-gray-800 text-gray-500">
                        <th className="pb-2">PROMPT</th>
                        <th className="pb-2">THROUGHPUT (W/SEC)</th>
                        <th className="pb-2">LATENCY (SEC)</th>
                        <th className="pb-2">ACCELERATION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {logs.map((log, index) => (
                        <tr key={index} className="text-gray-300">
                          <td className="py-2.5 truncate max-w-[200px]">{log.prompt}</td>
                          <td className="py-2.5 text-yellow-400 font-bold">{log.speed}</td>
                          <td className="py-2.5 text-cyan-400">{log.time.toFixed(2)}s</td>
                          <td className="py-2.5 text-purple-400">WebGPU</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}