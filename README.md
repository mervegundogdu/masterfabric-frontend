<div align="center">

<a href="https://academy.masterfabric.co">
  <img src="https://academy.masterfabric.co/academy-badge.png" width="120" alt="MasterFabric Academy">
</a>

<p>
  <sub>
    academy.masterfabric.co is a
    <a href="https://masterfabric.co">MasterFabric</a>
    subsidiary.
  </sub>
</p>

</div>


This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# 🧠 MasterMind AI — WebGPU & Go Powered LLM Studio

**MasterMind AI** is a high-performance, browser-based LLM execution and evaluation platform built with **Next.js (App Router)**, **Tailwind CSS**, and **TypeScript**. 

It enables client-side local inference using **WebGPU** (via `@mlc-ai/web-llm`) for zero API cost, combined with a microsecond-latency **Go** backend for real-time telemetry scoring and benchmarking.

---

## ✨ Key Features

* ⚡ **Client-Side WebGPU Inference:** Run models like Gemma-2B directly inside the browser with zero server API cost.
* 📊 **Go Telemetry & Benchmarking:** Microsecond-latency tracking for tokens/sec, prompt execution speed, and resource metrics.
* 🔐 **Secure Access Gateway:** Authenticated session management for LLM Studio and analytics pages.
* 🎨 **Modern & Responsive UI:** Built with Next.js 15, Tailwind CSS, and optimized with Geist font utilities.

---

## 🚀 Getting Started

First, install the dependencies and run the development server:

```bash
npm install
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```


Open http://localhost:3000 with your browser to see the result.
You can start editing the page by modifying app/page.tsx. The page auto-updates as you edit the file.


# Tech Stack
Frontend Framework: Next.js (App Router)
Styling: Tailwind CSS
Inference Engine: Web-LLM (WebGPU)
Backend Engine: Go (Chi Router / Microservices Telemetry)
Fonts: next/font with Geist Sans & Geist Mono


The easiest way to deploy your Next.js app is to use the Vercel Platform.
Check out the Next.js deployment documentation for more details.


# Live Application
You can also access the deployed production version directly at:
https://mastermind-theta-puce.vercel.app/
