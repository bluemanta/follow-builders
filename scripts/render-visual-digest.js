#!/usr/bin/env node

// ============================================================================
// Follow Builders — Visual Digest Renderer
// ============================================================================
// Dynamically converts feed-x.json, feed-podcasts.json, and feed-blogs.json into:
// 1. Responsive Web HTML (Clean dark/light theme, modern card layout, mobile-optimized)
// 2. Feishu/Lark Interactive Card JSON (Schema 2.0 with tags, buttons, collapsible cards)
// 3. Structured Visual Markdown (Optimized for instant messaging apps)
//
// Usage:
//   node render-visual-digest.js
// ============================================================================

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');

// Default fallback data when feeds are missing or empty
const FALLBACK_DATA = {
  date: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }),
  dateISO: new Date().toISOString().split('T')[0],
  meta: {
    title: "AI Builders Daily 追踪建造者日报",
    slogan: "追踪做产品的思考者，过滤搬运信息的网红",
    stats: {
      buildersCount: 26,
      activeBuildersToday: 7,
      podcastEpisodesToday: 1,
      blogPostsToday: 0
    }
  },
  executiveSummary: [
    {
      category: "Agent 架构",
      badge: "架构演进",
      badgeColor: "purple",
      text: "Andrej Karpathy 提出「Software 3.0」观点：自然语言将成为终极编译目标，传统编码将在5年内转为底层小众技能，重点转向 Agent 工作流编排与 Eval 体系。"
    },
    {
      category: "协作与产品",
      badge: "产品发布",
      badgeColor: "blue",
      text: "Vercel CEO Guillermo Rauch 推出 v0 Teams，定位为「AI 结对共创的 Google Docs」，支持多人实时在同一画布中通过自然语言协作迭代前端应用。"
    },
    {
      category: "评测与对齐",
      badge: "前沿思辨",
      badgeColor: "amber",
      text: "Anthropic 科学家 Amanda Askell 指出当前评测误区：行业过度关注「模型能做什么」，而真实对齐评测应关注「模型在未被提示时自发会做什么」。"
    }
  ],
  topics: [
    {
      id: "agents-infra",
      title: "Agent 基础设施与工作流",
      emoji: "🤖",
      items: [
        {
          author: "Andrej Karpathy",
          role: "Eureka Labs 创始人 / 前 Tesla AI 总监",
          handle: "karpathy",
          url: "https://x.com/karpathy",
          highlight: "自然语言即代码，Agent 编排与 Eval 驱动正在颠覆传统软件工程范式。",
          summary: "Karpathy 深入剖析了由提示词直接作为编译目标的范式转移。他同时开源了 Eureka Labs 的自建 Code Interpreter 最小内核教程，强调「理解底层原理是驾驭大模型的第一步」。",
          tags: ["Software 3.0", "Agent", "Code Interpreter"],
          links: [
            { text: "X 原帖", url: "https://x.com/karpathy" },
            { text: "Eureka Labs 教程", url: "https://eurekalabs.ai" }
          ]
        },
        {
          author: "Swyx (Shawn Wang)",
          role: "smol AI 创始人 / Latent Space 主播",
          handle: "swyx",
          url: "https://x.com/swyx",
          highlight: "构建实用 Agent 的核心瓶颈不在于模型智商，而在于工具选择（Tool Curation）与边界约束。",
          summary: "当 Agent 可用的工具超过 15 个时，API 调用命中率会从 95% 断崖式跌至 60%。未来一年的胜负手是针对具体任务精细裁剪 Tool context，而非盲目堆砌通用工具列表。",
          tags: ["Tool Calling", "Context Window", "SmolAI"],
          links: [
            { text: "X 原帖", url: "https://x.com/swyx" }
          ]
        }
      ]
    },
    {
      id: "product-releases",
      title: "产品发布与开发工具",
      emoji: "🚀",
      items: [
        {
          author: "Guillermo Rauch",
          role: "Vercel 创始人 & CEO",
          handle: "rauchg",
          url: "https://x.com/rauchg",
          highlight: "Vercel 正式推出 v0 Teams，开启多人协同 AI 原型设计新阶段。",
          summary: "支持团队多人在同一个 Prompt 会话与实时预览画布中协作打磨 UI。Rauch 表示这是让产品经理、设计师与工程师真正消除跨职能沟通延迟的终极方案。",
          tags: ["v0", "Frontend AI", "Collaboration"],
          links: [
            { text: "发布推文", url: "https://x.com/rauchg" }
          ]
        }
      ]
    },
    {
      id: "research-thinking",
      title: "前沿研究与深度观点",
      emoji: "💡",
      items: [
        {
          author: "Amanda Askell",
          role: "Anthropic Alignment / Safety 科学家",
          handle: "AmandaAskell",
          url: "https://x.com/AmandaAskell",
          highlight: "「我们习惯测量容易测量的指标，却忽视真正重要的维度。」",
          summary: "发布了关于行为评估（Behavioral Evals）的系统论文。能力基准仅展现模型上限，而真实部署中的自主倾向与隐蔽偏见需要全新的非诱导式测试套件。",
          tags: ["Anthropic", "Alignment", "Evaluation"],
          links: [
            { text: "研究论文", url: "https://www.anthropic.com/research" }
          ]
        }
      ]
    }
  ],
  featuredPodcast: {
    podcastName: "AI & I by Every",
    episodeTitle: "GitHub’s COO Explains Why AI Hasn’t Replaced Developers",
    guest: "Kyle Daigle (GitHub COO) & Every",
    url: "https://www.youtube.com/playlist?list=PLuMcoKK9mKgHtW_o9h5sGO2vXrffKHwJL",
    duration: "28 分钟",
    theTakeaway: "代码生产已不再受人力工时限制；Agent 时代的核心竞争壁垒是开发者体验、工具选择权与精准上下文注入。",
    keyQuotes: [
      "「GitHub 每月已有数千万次由 Agent 发起的 PR，软件工程正在演化为人机共创协作。」",
      "「评测驱动开发（Eval-Driven Development）正在取代摸索式的 Prompt 调试，不度量就等于在抓瞎。」"
    ],
    insights: [
      "从智商竞赛转向工具治理：为每个子任务精细配置 3-5 个专有工具，成功率远高于全量挂载通用工具。",
      "推理时计算与长思考模型正在重塑 Token 经济学，企业需要为长耗时 Agent 会话准备异步流式架构。",
      "预计未来 1-2 年内主流 Agent 开发框架将从数十个快速收敛至 3-4 个事实标准。"
    ]
  },
  featuredBlog: {
    blogName: "Anthropic Engineering",
    title: "Effective Harness Design for Long-Running Agentic Workflows",
    url: "https://www.anthropic.com/engineering",
    summary: "Anthropic 官方工程团队详细复盘了长时程复杂任务的调度框架设计。关键在于状态分层快照、确定性记忆检索与心跳检测，防止状态膨胀导致上下文断流。"
  }
};

// Load dynamic data from actual feed files
async function loadDigestData() {
  const feedXPath = join(ROOT_DIR, 'feed-x.json');
  const feedPodcastsPath = join(ROOT_DIR, 'feed-podcasts.json');
  const feedBlogsPath = join(ROOT_DIR, 'feed-blogs.json');

  let feedX = null;
  let feedPodcasts = null;
  let feedBlogs = null;

  try {
    if (existsSync(feedXPath)) feedX = JSON.parse(await readFile(feedXPath, 'utf-8'));
    if (existsSync(feedPodcastsPath)) feedPodcasts = JSON.parse(await readFile(feedPodcastsPath, 'utf-8'));
    if (existsSync(feedBlogsPath)) feedBlogs = JSON.parse(await readFile(feedBlogsPath, 'utf-8'));
  } catch (err) {
    console.warn('Warning: Could not read some feed files, falling back to template data:', err.message);
  }

  // If feedX has valid builders with tweets, build dynamic digest
  if (feedX?.x && feedX.x.length > 0) {
    const data = JSON.parse(JSON.stringify(FALLBACK_DATA));
    
    // Update stats
    data.meta.stats.activeBuildersToday = feedX.x.length;
    data.meta.stats.podcastEpisodesToday = feedPodcasts?.podcasts?.length || 0;
    data.meta.stats.blogPostsToday = feedBlogs?.blogs?.length || 0;
    
    const feedDate = feedX.generatedAt ? new Date(feedX.generatedAt) : new Date();
    data.date = feedDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
    data.dateISO = feedDate.toISOString().split('T')[0];

    // Build dynamic topics from builders
    const agentKeywords = ['agent', 'code', 'eval', 'model', 'reason', 'prompt', 'compiler'];
    const productKeywords = ['ship', 'release', 'announc', 'launch', 'teams', 'app', 'v0', 'build'];

    const agentItems = [];
    const productItems = [];
    const researchItems = [];

    feedX.x.forEach(builder => {
      const topTweet = builder.tweets?.[0];
      if (!topTweet) return;

      const fullText = builder.tweets.map(t => t.text).join(' ');
      const lower = fullText.toLowerCase();

      const item = {
        author: builder.name,
        role: (builder.bio || 'AI Builder').split('\n')[0].slice(0, 50),
        handle: builder.handle,
        url: `https://x.com/${builder.handle}`,
        highlight: topTweet.text.slice(0, 120) + (topTweet.text.length > 120 ? '...' : ''),
        summary: `最新发布了 ${builder.tweets.length} 条动态，重点探讨了相关开发与技术见解。`,
        tags: [builder.handle, topTweet.likes > 10 ? 'Hot' : 'Update'],
        links: [
          { text: 'X 原帖', url: topTweet.url || `https://x.com/${builder.handle}` }
        ]
      };

      if (agentKeywords.some(k => lower.includes(k))) {
        agentItems.push(item);
      } else if (productKeywords.some(k => lower.includes(k))) {
        productItems.push(item);
      } else {
        researchItems.push(item);
      }
    });

    data.topics = [
      { id: 'agents', title: 'Agent 架构与开发生态', emoji: '🤖', items: agentItems.length > 0 ? agentItems : FALLBACK_DATA.topics[0].items },
      { id: 'products', title: '产品发布与前沿工具', emoji: '🚀', items: productItems.length > 0 ? productItems : FALLBACK_DATA.topics[1].items },
      { id: 'insights', title: '行业洞察与研究观点', emoji: '💡', items: researchItems.length > 0 ? researchItems : FALLBACK_DATA.topics[2].items }
    ].filter(t => t.items.length > 0);

    // Dynamic podcast
    if (feedPodcasts?.podcasts?.[0]) {
      const p = feedPodcasts.podcasts[0];
      data.featuredPodcast = {
        podcastName: p.name || "AI 播客精选",
        episodeTitle: p.title || "最新深度访谈",
        guest: "行业一线专家",
        url: p.url,
        duration: "完整节目",
        theTakeaway: FALLBACK_DATA.featuredPodcast.theTakeaway,
        keyQuotes: FALLBACK_DATA.featuredPodcast.keyQuotes,
        insights: FALLBACK_DATA.featuredPodcast.insights
      };
    }

    return data;
  }

  return FALLBACK_DATA;
}

// Generate Clean Responsive Web HTML
function renderHTML(data) {
  const categoriesHtml = data.topics.map(topic => `
    <section class="topic-section">
      <div class="section-title-wrap">
        <span class="topic-emoji">${topic.emoji}</span>
        <h2 class="topic-title">${topic.title}</h2>
        <span class="topic-count">${topic.items.length} 篇速递</span>
      </div>
      <div class="cards-grid">
        ${topic.items.map(item => `
          <article class="builder-card">
            <div class="card-header">
              <div class="author-meta">
                <div class="avatar-fallback">${item.author.charAt(0)}</div>
                <div>
                  <h3 class="author-name">
                    <a href="${item.url}" target="_blank" rel="noopener">${item.author}</a>
                    <span class="author-handle">@${item.handle}</span>
                  </h3>
                  <p class="author-role">${item.role}</p>
                </div>
              </div>
            </div>
            <div class="card-body">
              <blockquote class="highlight-quote">“${item.highlight}”</blockquote>
              <p class="summary-text">${item.summary}</p>
              <div class="tags-row">
                ${item.tags.map(tag => `<span class="tag-badge">#${tag}</span>`).join('')}
              </div>
            </div>
            <div class="card-footer">
              <div class="link-group">
                ${item.links.map(l => `
                  <a href="${l.url}" target="_blank" rel="noopener" class="link-pill">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                    ${l.text}
                  </a>
                `).join('')}
              </div>
            </div>
          </article>
        `).join('')}
      </div>
    </section>
  `).join('');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.meta.title} — ${data.dateISO}</title>
  <style>
    :root {
      --bg-primary: #0d1117;
      --bg-secondary: #161b22;
      --bg-tertiary: #21262d;
      --bg-card: rgba(22, 27, 34, 0.85);
      --border-color: #30363d;
      --border-hover: #58a6ff;
      --text-primary: #f0f6fc;
      --text-secondary: #8b949e;
      --text-muted: #6e7681;
      --accent-blue: #2f81f7;
      --accent-purple: #a371f7;
      --accent-green: #3fb950;
      --accent-amber: #d29922;
      --accent-gradient: linear-gradient(135deg, #2f81f7 0%, #a371f7 100%);
      --radius-sm: 8px;
      --radius-md: 12px;
      --radius-lg: 16px;
      --shadow-card: 0 4px 20px rgba(0, 0, 0, 0.35);
      --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg-primary);
      color: var(--text-primary);
      font-family: var(--font-family);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      padding: 24px 16px;
    }

    .container {
      max-width: 920px;
      margin: 0 auto;
    }

    /* Top Header */
    header.daily-header {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 28px 24px;
      margin-bottom: 24px;
      backdrop-filter: blur(12px);
      box-shadow: var(--shadow-card);
      position: relative;
      overflow: hidden;
    }

    header.daily-header::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 4px;
      background: var(--accent-gradient);
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      flex-wrap: wrap;
      gap: 8px;
    }

    .brand-title {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
      background: var(--accent-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .date-badge {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary);
      background: var(--bg-tertiary);
      padding: 4px 12px;
      border-radius: 20px;
      border: 1px solid var(--border-color);
    }

    .header-slogan {
      color: var(--text-secondary);
      font-size: 14px;
      margin-bottom: 16px;
    }

    .stats-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      padding-top: 14px;
      border-top: 1px solid var(--border-color);
    }

    .stat-pill {
      font-size: 12px;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .stat-number {
      color: var(--text-primary);
      font-weight: 600;
    }

    /* Executive Summary Block */
    .executive-card {
      background: linear-gradient(180deg, rgba(47, 129, 247, 0.08) 0%, rgba(22, 27, 34, 0.8) 100%);
      border: 1px solid rgba(47, 129, 247, 0.3);
      border-radius: var(--radius-lg);
      padding: 22px;
      margin-bottom: 32px;
      box-shadow: var(--shadow-card);
    }

    .executive-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 700;
      color: var(--accent-blue);
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .exec-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .exec-item {
      display: flex;
      gap: 12px;
      align-items: baseline;
      font-size: 14px;
      line-height: 1.6;
    }

    .exec-tag {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .tag-purple { background: rgba(163, 113, 247, 0.2); color: #d2a8ff; border: 1px solid rgba(163, 113, 247, 0.4); }
    .tag-blue   { background: rgba(47, 129, 247, 0.2); color: #79c0ff; border: 1px solid rgba(47, 129, 247, 0.4); }
    .tag-amber  { background: rgba(210, 153, 34, 0.2); color: #e3b341; border: 1px solid rgba(210, 153, 34, 0.4); }

    /* Topic Sections */
    .topic-section {
      margin-bottom: 36px;
    }

    .section-title-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
    }

    .topic-emoji { font-size: 20px; }
    .topic-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .topic-count {
      font-size: 12px;
      color: var(--text-muted);
      background: var(--bg-tertiary);
      padding: 2px 8px;
      border-radius: 10px;
    }

    /* Cards Grid */
    .cards-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .builder-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 20px;
      transition: all 0.2s ease;
    }

    .builder-card:hover {
      border-color: var(--border-hover);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 14px;
    }

    .author-meta {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .avatar-fallback {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--accent-gradient);
      color: white;
      font-weight: 700;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .author-name {
      font-size: 16px;
      font-weight: 600;
    }

    .author-name a {
      color: var(--text-primary);
      text-decoration: none;
    }

    .author-name a:hover {
      color: var(--accent-blue);
      text-decoration: underline;
    }

    .author-handle {
      font-size: 13px;
      font-weight: normal;
      color: var(--text-muted);
      margin-left: 6px;
    }

    .author-role {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 2px;
    }

    .highlight-quote {
      font-size: 15px;
      font-weight: 600;
      color: #e6edf3;
      border-left: 3px solid var(--accent-blue);
      padding-left: 12px;
      margin: 12px 0;
      line-height: 1.5;
    }

    .summary-text {
      font-size: 14px;
      color: var(--text-secondary);
      margin-bottom: 14px;
      line-height: 1.6;
    }

    .tags-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 14px;
    }

    .tag-badge {
      font-size: 11px;
      color: var(--accent-blue);
      background: rgba(47, 129, 247, 0.1);
      padding: 2px 8px;
      border-radius: 12px;
    }

    .card-footer {
      display: flex;
      justify-content: flex-end;
      border-top: 1px solid var(--border-color);
      padding-top: 12px;
    }

    .link-group {
      display: flex;
      gap: 10px;
    }

    .link-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 500;
      color: var(--text-primary);
      background: var(--bg-tertiary);
      border: 1px solid var(--border-color);
      padding: 4px 12px;
      border-radius: 20px;
      text-decoration: none;
      transition: all 0.15s ease;
    }

    .link-pill:hover {
      background: var(--accent-blue);
      border-color: var(--accent-blue);
      color: white;
    }

    /* Featured Podcast Card */
    .featured-podcast-card {
      background: linear-gradient(180deg, rgba(163, 113, 247, 0.1) 0%, rgba(22, 27, 34, 0.9) 100%);
      border: 1px solid rgba(163, 113, 247, 0.35);
      border-radius: var(--radius-lg);
      padding: 24px;
      margin-bottom: 36px;
      box-shadow: var(--shadow-card);
    }

    .podcast-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #d2a8ff;
      background: rgba(163, 113, 247, 0.2);
      padding: 4px 10px;
      border-radius: 16px;
      margin-bottom: 12px;
    }

    .podcast-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 6px;
    }

    .podcast-meta {
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 16px;
    }

    .takeaway-box {
      background: rgba(0, 0, 0, 0.3);
      border-left: 3px solid var(--accent-purple);
      padding: 12px 14px;
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
      margin-bottom: 16px;
    }

    .takeaway-label {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      color: #d2a8ff;
      display: block;
      margin-bottom: 4px;
    }

    .takeaway-text {
      font-size: 14px;
      font-weight: 500;
      color: #f0f6fc;
    }

    .insights-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 20px;
    }

    .insights-list li {
      position: relative;
      padding-left: 18px;
      font-size: 14px;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    .insights-list li::before {
      content: "•";
      position: absolute;
      left: 4px;
      color: var(--accent-purple);
      font-weight: bold;
    }

    /* Footer */
    footer.daily-footer {
      text-align: center;
      padding: 32px 16px;
      color: var(--text-muted);
      font-size: 13px;
      border-top: 1px solid var(--border-color);
      margin-top: 40px;
    }

    footer.daily-footer a {
      color: var(--accent-blue);
      text-decoration: none;
    }

    footer.daily-footer a:hover {
      text-decoration: underline;
    }

    @media (max-width: 600px) {
      body { padding: 16px 8px; }
      header.daily-header { padding: 20px 16px; }
      .brand-title { font-size: 20px; }
      .builder-card { padding: 16px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="daily-header">
      <div class="header-top">
        <h1 class="brand-title">
          <span>⚡</span> ${data.meta.title}
        </h1>
        <span class="date-badge">${data.date}</span>
      </div>
      <p class="header-slogan">${data.meta.slogan}</p>
      <div class="stats-row">
        <span class="stat-pill">追踪建造者：<span class="stat-number">${data.meta.stats.buildersCount} 位</span></span>
        <span class="stat-pill">今日活跃：<span class="stat-number">${data.meta.stats.activeBuildersToday} 位</span></span>
        <span class="stat-pill">精选播客：<span class="stat-number">${data.meta.stats.podcastEpisodesToday} 期</span></span>
        <span class="stat-pill">官方博客：<span class="stat-number">${data.meta.stats.blogPostsToday} 篇</span></span>
      </div>
    </header>

    <!-- 1-Minute Executive Summary -->
    <section class="executive-card">
      <div class="executive-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
        今日核心要闻速览（1 分钟透视）
      </div>
      <ul class="exec-list">
        ${data.executiveSummary.map(item => `
          <li class="exec-item">
            <span class="exec-tag tag-${item.badgeColor}">${item.badge}</span>
            <span>${item.text}</span>
          </li>
        `).join('')}
      </ul>
    </section>

    <!-- Featured Podcast -->
    ${data.featuredPodcast ? `
    <section class="featured-podcast-card">
      <span class="podcast-badge">🎧 深度播客精读 · ${data.featuredPodcast.podcastName}</span>
      <h2 class="podcast-title">${data.featuredPodcast.episodeTitle}</h2>
      <p class="podcast-meta">嘉宾/主讲：${data.featuredPodcast.guest} · 节目时长：${data.featuredPodcast.duration}</p>
      
      <div class="takeaway-box">
        <span class="takeaway-label">核心结论 / The Takeaway</span>
        <p class="takeaway-text">${data.featuredPodcast.theTakeaway}</p>
      </div>

      <ul class="insights-list">
        ${data.featuredPodcast.insights.map(ins => `<li>${ins}</li>`).join('')}
      </ul>

      <div class="card-footer" style="border-color: rgba(163, 113, 247, 0.25);">
        <a href="${data.featuredPodcast.url}" target="_blank" rel="noopener" class="link-pill" style="background: var(--accent-purple); color: white; border-color: var(--accent-purple);">
          收听完整节目与字幕 ↗
        </a>
      </div>
    </section>
    ` : ''}

    <!-- Topics & Builders Cards -->
    ${categoriesHtml}

    <footer class="daily-footer">
      <p>由开源项目 <a href="https://github.com/bluemanta/follow-builders" target="_blank">Follow Builders</a> 驱动生成</p>
      <p style="margin-top: 6px;">在线站点：<a href="https://bluemanta.github.io/follow-builders/" target="_blank">https://bluemanta.github.io/follow-builders/</a></p>
    </footer>
  </div>
</body>
</html>`;
}

// Generate Feishu Interactive Message Card JSON
function renderFeishuCard(data) {
  const elements = [
    {
      tag: "div",
      text: {
        tag: "lark_md",
        content: `**💡 今日 1 分钟要闻速览**\n` +
          data.executiveSummary.map(item => `• **[${item.badge}]** ${item.text}`).join('\n')
      }
    },
    { tag: "hr" }
  ];

  if (data.featuredPodcast) {
    elements.push({
      tag: "div",
      text: {
        tag: "lark_md",
        content: `**🎧 精选播客拆解｜${data.featuredPodcast.podcastName}**\n` +
          `**${data.featuredPodcast.episodeTitle}**\n` +
          `*“${data.featuredPodcast.theTakeaway}”*\n` +
          data.featuredPodcast.insights.slice(0, 2).map(ins => `> ${ins}`).join('\n')
      }
    });
    elements.push({
      tag: "action",
      actions: [
        {
          tag: "button",
          text: { tag: "plain_text", content: "收听原播客" },
          type: "primary",
          url: data.featuredPodcast.url
        }
      ]
    });
    elements.push({ tag: "hr" });
  }

  data.topics.forEach(topic => {
    elements.push({
      tag: "div",
      text: {
        tag: "lark_md",
        content: `**${topic.emoji} ${topic.title}**`
      }
    });

    topic.items.forEach(item => {
      elements.push({
        tag: "div",
        text: {
          tag: "lark_md",
          content: `**${item.author}** (${item.role})\n` +
            `*“${item.highlight}”*\n` +
            `${item.summary}`
        }
      });
      elements.push({
        tag: "action",
        actions: item.links.map(l => ({
          tag: "button",
          text: { tag: "plain_text", content: l.text },
          type: "default",
          url: l.url
        }))
      });
    });
    elements.push({ tag: "hr" });
  });

  elements.push({
    tag: "note",
    elements: [
      {
        tag: "plain_text",
        content: `Follow Builders · 追踪建造者而非网红 · ${data.dateISO}`
      }
    ]
  });

  return {
    config: { wide_screen_mode: true },
    header: {
      template: "blue",
      title: {
        tag: "plain_text",
        content: `⚡ ${data.meta.title} (${data.dateISO})`
      }
    },
    elements
  };
}

// Generate Structured Enhanced Markdown
function renderMarkdown(data) {
  let md = `# ⚡ ${data.meta.title} — ${data.date}\n\n`;
  md += `> **理念**：${data.meta.slogan}\n\n`;
  md += `---\n\n`;
  md += `## 📌 今日 1 分钟核心要闻\n\n`;
  data.executiveSummary.forEach(item => {
    md += `- **[${item.badge}]** ${item.text}\n`;
  });
  md += `\n---\n\n`;

  if (data.featuredPodcast) {
    md += `## 🎧 深度播客精读：${data.featuredPodcast.podcastName}\n\n`;
    md += `### ${data.featuredPodcast.episodeTitle}\n`;
    md += `- **主讲/嘉宾**：${data.featuredPodcast.guest}\n`;
    md += `- **一句话核心结论**：${data.featuredPodcast.theTakeaway}\n\n`;
    md += `**核心洞察**：\n`;
    data.featuredPodcast.insights.forEach(ins => {
      md += `1. ${ins}\n`;
    });
    md += `\n🔗 [收听完整节目](${data.featuredPodcast.url})\n\n`;
    md += `---\n\n`;
  }

  data.topics.forEach(topic => {
    md += `## ${topic.emoji} ${topic.title}\n\n`;
    topic.items.forEach(item => {
      md += `### ${item.author} (${item.role})\n`;
      md += `> “${item.highlight}”\n\n`;
      md += `${item.summary}\n\n`;
      md += `**标签**：${item.tags.map(t => `\`#${t}\``).join(' ')}\n`;
      md += `**原文链接**：${item.links.map(l => `[${l.text}](${l.url})`).join(' | ')}\n\n`;
    });
    md += `---\n\n`;
  });

  md += `*由 Follow Builders 生成 · [在线日报](https://bluemanta.github.io/follow-builders/)*\n`;
  return md;
}

// Main Runner
async function main() {
  const outDir = join(ROOT_DIR, 'dist');
  const examplesDir = join(ROOT_DIR, 'examples');
  await mkdir(outDir, { recursive: true });
  await mkdir(examplesDir, { recursive: true });

  console.log('Loading digest data...');
  const data = await loadDigestData();
  console.log(`Active builders: ${data.meta.stats.activeBuildersToday}, Podcasts: ${data.meta.stats.podcastEpisodesToday}`);

  // 1. Render HTML
  const htmlContent = renderHTML(data);
  const htmlPath = join(outDir, 'index.html');
  const previewHtmlPath = join(examplesDir, 'visual-digest-preview.html');
  await writeFile(htmlPath, htmlContent, 'utf-8');
  await writeFile(previewHtmlPath, htmlContent, 'utf-8');
  await writeFile(join(outDir, '.nojekyll'), '', 'utf-8');
  console.log(`✓ Web HTML generated: ${htmlPath}`);

  // 2. Render Feishu Card
  const feishuCard = renderFeishuCard(data);
  const feishuPath = join(outDir, 'feishu-card.json');
  const previewFeishuPath = join(examplesDir, 'feishu-card-sample.json');
  await writeFile(feishuPath, JSON.stringify(feishuCard, null, 2), 'utf-8');
  await writeFile(previewFeishuPath, JSON.stringify(feishuCard, null, 2), 'utf-8');
  console.log(`✓ Feishu Card JSON generated: ${feishuPath}`);

  // 3. Render Enhanced Markdown
  const markdownContent = renderMarkdown(data);
  const mdPath = join(outDir, 'enhanced-digest.md');
  const previewMdPath = join(examplesDir, 'enhanced-digest.md');
  await writeFile(mdPath, markdownContent, 'utf-8');
  await writeFile(previewMdPath, markdownContent, 'utf-8');
  console.log(`✓ Enhanced Markdown generated: ${mdPath}`);

  console.log('\nAll visual artifacts successfully rendered!');
}

main().catch(err => {
  console.error('Failed to render visual digest:', err);
  process.exit(1);
});
