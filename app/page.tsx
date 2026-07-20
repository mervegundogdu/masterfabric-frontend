"use client";

import { useState, useEffect } from "react";
import { CreateMLCEngine } from "@mlc-ai/web-llm";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"auth" | "studio" | "monitoring">("auth");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [engine, setEngine] = useState<any>(null);
  const [statusText, setStatusText] = useState("Model henüz yüklenmedi.");
  const [progressPercent, setProgressPercent] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [tokensPerSec, setTokensPerSec] = useState<number | null>(null);
  const [generationTime, setGenerationTime] = useState<number | null>(null);
  const [backendStatus, setBackendStatus] = useState("Bekleniyor");

  useEffect(() => {
    fetch("http://localhost:8080/api/v1/config/models")
      .then((res) => res.json())
      .then((data) => console.log("Backend Model Config:", data))
      .catch((err) => console.error("Backend bağlantı hatası:", err));
  }, []);

  const loadModel = async () => {
    try {
      setStatusText("Gemma Modeli yükleniyor...");
      const clientEngine = await CreateMLCEngine("Gemma-2-2b-it-q4f16_1", {
        initProgressCallback: (progress) => {
          setStatusText(`Yükleniyor: ${progress.text}`);
          setProgressPercent(Math.round(progress.progress * 100));
        },
      });
      setEngine(clientEngine);
      setStatusText("Gemma 2 2B başarıyla yerel tarayıcıya (WebGPU) yüklendi.");
    } catch (error) {
      console.error(error);
      setStatusText("Yükleme başarısız. Cihazınızda WebGPU desteği açık mı?");
    }
  };

  const generateText = async () => {
    if (!engine) return;
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

      const wordCount = fullReply.split(/\s+/).length;
      const speed = parseFloat((wordCount / totalTimeSec).toFixed(2));
      setTokensPerSec(speed);

      sendMetricsToBackend(prompt, fullReply, speed, totalTimeSec);
    } catch (err) {
      console.error(err);
    } {
      setIsLoading(false);
    }
  };

  const sendMetricsToBackend = async (p: string, r: string, speed: number, time: number) => {
    setBackendStatus("Senkronize Ediliyor...");
    try {
      await fetch("http://localhost:8080/api/v1/monitoring/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p, response: r }),
      });

      await fetch("http://localhost:8080/api/v1/monitoring/scoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokens_per_sec: speed, duration: time, hardware: "WebGPU" }),
      });

      setBackendStatus("Bağlı (200 OK)");
    } catch (err) {
      setBackendStatus("Bağlantı Hatası");
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
    <div className="min-h-screen bg-[#0d1117] text-gray-200 p-6 md:p-12 font-sans selection:bg-purple-500 selection:text-white">
      {/* Üst Menü / Navigasyon */}
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center border-b border-gray-800 pb-6 mb-10 gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse shadow-[0_0_8px_#a855f7]" />
          <h1 className="text-xl font-tracking font-semibold text-white tracking-wide">
            MASTERFABRIC <span className="text-purple-500 font-light">AI GATEWAY</span>
          </h1>
        </div>
        <nav className="flex space-x-2 bg-[#161b22] p-1.5 rounded-xl border border-gray-800">
          <button 
            onClick={() => setActiveTab("auth")} 
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${activeTab === "auth" ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30" : "text-gray-400 hover:text-white"}`}
          >
            Gateway Auth
          </button>
          <button 
            onClick={() => setActiveTab("studio")} 
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${activeTab === "studio" ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30" : "text-gray-400 hover:text-white"}`}
          >
            LLM Studio
          </button>
          <button 
            onClick={() => setActiveTab("monitoring")} 
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${activeTab === "monitoring" ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30" : "text-gray-400 hover:text-white"}`}
          >
            Deci-Scoring Analytics
          </button>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto">
        {/* VIEW 1: AUTH VIEW */}
        {activeTab === "auth" && (
          <div className="max-w-md mx-auto bg-[#161b22] p-8 rounded-2xl border border-gray-800 shadow-2xl mt-10">
            <div className="text-center mb-6">
              <h2 className="text-lg font-medium text-white">Güvenli Geçiş Kapısı</h2>
              <p className="text-xs text-gray-400 mt-1">Lütfen kimlik bilgilerinizi doğrulayın</p>
            </div>
            {isLoggedIn ? (
              <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-xl text-center text-emerald-400 text-sm">
                Oturum Açıldı. <span onClick={() => setActiveTab("studio")} className="underline cursor-pointer font-medium text-emerald-300 ml-1">Stüdyoya ilerleyin →</span>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">E-posta Adresi</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full text-sm p-3 rounded-xl bg-[#0d1117] border border-gray-800 text-white focus:outline-none focus:border-purple-500 transition-colors" placeholder="ad@domain.com" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Şifre</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full text-sm p-3 rounded-xl bg-[#0d1117] border border-gray-800 text-white focus:outline-none focus:border-purple-500 transition-colors" placeholder="••••••••" required />
                </div>
                <button type="submit" className="w-full bg-purple-600 p-3 rounded-xl text-sm font-semibold text-white hover:bg-purple-500 transition-all duration-200 mt-2 shadow-lg shadow-purple-900/20">
                  Sisteme Giriş Yap
                </button>
              </form>
            )}
          </div>
        )}

        {/* VIEW 2: STUDIO VIEW */}
        {activeTab === "studio" && (
          <div className="space-y-6">
            <div className="bg-[#161b22] p-5 rounded-2xl border border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex-1 w-full">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Model Durumu</p>
                <p className="text-sm text-white font-medium">{statusText}</p>
                {progressPercent > 0 && progressPercent < 100 && (
                  <div className="w-full bg-[#0d1117] h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-purple-500 h-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                  </div>
                )}
              </div>
              {!engine && (
                <button onClick={loadModel} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors shrink-0 shadow-lg shadow-emerald-950/50">
                  Gemma Modelini İndir
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Prompt Girdisi */}
              <div className="bg-[#161b22] p-6 rounded-2xl border border-gray-800 flex flex-col h-[380px]">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" /> Girdi Paneli (Prompt)
                </h3>
                <textarea 
                  value={prompt} 
                  onChange={(e) => setPrompt(e.target.value)} 
                  className="w-full flex-1 p-4 rounded-xl bg-[#0d1117] border border-gray-800 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors resize-none mb-4 font-mono" 
                  placeholder="Modelin yerel olarak işlemesi için bir komut girin..." 
                />
                <button 
                  onClick={generateText} 
                  disabled={isLoading || !engine} 
                  className="w-full bg-purple-600 p-3.5 rounded-xl text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-30 disabled:hover:bg-purple-600 transition-all"
                >
                  {isLoading ? "Çıktı Akışı Üretiliyor..." : "İşlemi Başlat (WebGPU)"}
                </button>
              </div>

              {/* Canlı Çıktı */}
              <div className="bg-[#161b22] p-6 rounded-2xl border border-gray-800 flex flex-col h-[380px]">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> Canlı Çıktı (Streaming)
                </h3>
                <div className="w-full flex-1 p-4 bg-[#0d1117] rounded-xl border border-gray-800 text-sm text-gray-300 overflow-y-auto font-sans whitespace-pre-wrap leading-relaxed">
                  {response || <span className="text-gray-600 italic">Yerel Gemma modelinden gelecek yanıtlar burada gerçek zamanlı akacaktır...</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: MONITORING VIEW */}
        {activeTab === "monitoring" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#161b22] p-6 rounded-2xl border border-gray-800 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl -mr-5 -mt-5" />
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Deci-Scoring Performansı</p>
              <h3 className="text-2xl font-bold text-yellow-400 mt-2 font-mono">
                {tokensPerSec ? `${tokensPerSec} W/sec` : "0.00"}
              </h3>
              <p className="text-[11px] text-gray-500 mt-3 border-t border-gray-800/60 pt-2">Tarayıcı içi donanım ivmeli kelime üretim hızı metriği.</p>
            </div>

            <div className="bg-[#161b22] p-6 rounded-2xl border border-gray-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl -mr-5 -mt-5" />
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Toplam Çıktı Gecikmesi</p>
              <h3 className="text-2xl font-bold text-cyan-400 mt-2 font-mono">
                {generationTime ? `${generationTime.toFixed(2)} sn` : "0.00 sn"}
              </h3>
              <p className="text-[11px] text-gray-500 mt-3 border-t border-gray-800/60 pt-2">İsteğin oluşturulmasından tamamlanmasına kadar geçen net süre.</p>
            </div>

            <div className="bg-[#161b22] p-6 rounded-2xl border border-gray-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-5 -mt-5" />
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Go Backend Entegrasyonu</p>
              <h3 className={`text-sm font-semibold mt-3 px-3 py-1 rounded-md inline-block ${backendStatus.includes("200 OK") ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20" : "bg-gray-800 text-gray-400"}`}>
                {backendStatus}
              </h3>
              <p className="text-[11px] text-gray-500 mt-3 border-t border-gray-800/60 pt-2">Performans metriklerinin asenkron sunucuya aktarım durumu.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}