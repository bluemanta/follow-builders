#!/usr/bin/env node

// ============================================================================
// Follow Builders — Visual Digest Renderer
// ============================================================================
// Dynamically converts feed-x.json, feed-podcasts.json, and feed-blogs.json into:
// 1. Responsive Web HTML (Engineering-precise monochrome dark/light theme, Linear/Vercel style)
// 2. Feishu/Lark Interactive Card JSON (Clean Schema 2.0 with tags & actions)
// 3. Structured Visual Markdown (Clean documentation & messaging format)
//
// Style Reference: iBlueManta Design System (Engineering-precise dark, monochrome focus)
// Tokens: --bg: #08090a, --panel: #0e0f11, --elevated: #131417, --fg: #f7f8f8, --dim: #8a8f98, --line: #1c1d21
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
    title: "AI Builders Daily · 追踪建造者日报",
    slogan: "追踪做产品的思考者，过滤搬运信息的网红",
    stats: {
      buildersCount: 26,
      activeBuildersToday: 10,
      podcastEpisodesToday: 1,
      blogPostsToday: 0
    }
  },
  executiveSummary: [
    {
      category: "Agent 测试",
      badge: "测试与交付",
      text: "Guillermo Rauch 盛赞 Coding Agent 的全流程测试与 QA 能力：遇到移动端渲染异常时，Agent 能自主重现、部署临时 Vercel 环境并在 iPhone 模拟器中验证，展现出人类难以企及的穷尽式强度与交付确定性。"
    },
    {
      category: "个人 Agent",
      badge: "竞争格局",
      text: "Peter Yang 深度复盘 Personal Agent 竞局：Meta Muse 凭借独立 App 体验领先，ChatGPT 仍居用户量首位但面临企业与个人 UX 割裂；多人协同（Multiplayer AI）将是下一代 Agent 的核心演进方向。"
    },
    {
      category: "智能体金融",
      badge: "原生结算",
      text: "Coinbase CEO Brian Armstrong 在 No Priors 播客中指出：未来数以亿计的自主 Agent 将重塑金融基础设施，加密钱包与稳定币（Stablecoin）将成为智能体购买算力与服务的事实货币标准。"
    }
  ],
  topics: [
    {
      id: "agents-infra",
      title: "Agent 架构与工作流",
      emoji: "🤖",
      items: [
        {
          author: "Guillermo Rauch",
          role: "Vercel 创始人 & CEO",
          handle: "rauchg",
          url: "https://x.com/rauchg",
          highlight: "The thoroughness with which agents can test and QA software is unrivaled... The software of the future will be of a quality and performance we've never experienced before.",
          summary: "指出 Coding Agent 在端到端自动化测试与修复上的极端穷尽能力。智能体能在数分钟内自建临时沙盒并在模拟器中反复验证，正带来软件质量维度的质变。",
          tags: ["Coding Agent", "Testing", "Vercel"],
          links: [
            { text: "X 原帖", url: "https://x.com/rauchg" }
          ]
        },
        {
          author: "Peter Yang",
          role: "产品作者 / 创作者",
          handle: "petergyang",
          url: "https://x.com/petergyang",
          highlight: "My thoughts on the personal agent race: Muse is poised to lead, ChatGPT is split, Grok Bot is multiplayer Slack for bots and humans.",
          summary: "全面评析 Meta Muse、ChatGPT、Grok Bot 与 Google Spark 的产品定位，指出多人协同（Multiplayer AI）与通用技能协议（Portable Skills）是跨平台迁移的关键。",
          tags: ["Personal Agent", "Multiplayer", "UX"],
          links: [
            { text: "X 原帖", url: "https://x.com/petergyang" }
          ]
        },
        {
          author: "Peter Steinberger",
          role: "PSPDFKit 创始人",
          handle: "steipete",
          url: "https://x.com/steipete",
          highlight: "Your claw can now FaceTime you! New benchmark dropped.",
          summary: "分享了个人自主智能体的实时交互与多模态通话实验，持续跟进开源 Coding Agent 评测基准。",
          tags: ["Multimodal", "OpenClaw", "Benchmark"],
          links: [
            { text: "X 原帖", url: "https://x.com/steipete" }
          ]
        }
      ]
    },
    {
      id: "product-releases",
      title: "产品发布与工具动态",
      emoji: "🚀",
      items: [
        {
          author: "Swyx (Shawn Wang)",
          role: "smol AI 创始人 / Latent Space 主播",
          handle: "swyx",
          url: "https://x.com/swyx",
          highlight: "Jev pod tomorrow, subscribe on Apple / YouTube @latentspacepod.",
          summary: "预告最新一期关于 Jev / 编程智能体的深度访谈节目，聚焦前沿 AI 工程师工程落地实践。",
          tags: ["LatentSpace", "Podcast", "AI Engineer"],
          links: [
            { text: "X 原帖", url: "https://x.com/swyx" }
          ]
        },
        {
          author: "Aaron Levie",
          role: "Box 联合创始人 & CEO",
          handle: "levie",
          url: "https://x.com/levie",
          highlight: "Literally impenetrable from agent swarms.",
          summary: "对企业级系统抵御非预期 Agent 群体访问与鉴权边界发表幽默思考，探讨智能体时代的防御架构。",
          tags: ["Enterprise", "Agent Swarms", "Security"],
          links: [
            { text: "X 原帖", url: "https://x.com/levie" }
          ]
        }
      ]
    },
    {
      id: "insights",
      title: "建造者观察与思考",
      emoji: "💡",
      items: [
        {
          author: "Matt Turck",
          role: "FirstMark 投资合伙人 / MAD Podcast 主播",
          handle: "mattturck",
          url: "https://x.com/mattturck",
          highlight: "Everyone is obsessed with Jev now, but I'm old enough to remember when people couldn't shut up about Instinct...",
          summary: "点评硅谷 AI 社区每周热点的极速更迭，提醒从业者透过短期情绪聚焦底层长效价值。",
          tags: ["Venture", "Trends", "MadPodcast"],
          links: [
            { text: "X 原帖", url: "https://x.com/mattturck" }
          ]
        }
      ]
    }
  ],
  featuredPodcast: {
    podcastName: "No Priors",
    episodeTitle: "Coinbase’s Everything Exchange: Agentic Finance, Stablecoins, and Tokenization with CEO Brian Armstrong",
    guest: "Brian Armstrong (Coinbase 联合创始人兼 CEO) · 主持：Elad Gil & Sarah Guo",
    url: "https://www.youtube.com/@NoPriorsPodcast",
    duration: "约 48 分钟",
    theTakeaway: "AI Agent 经济正在重塑金融底层基础设施。智能体无法在传统金融机构开户，基于区块链的原生钱包与稳定币结算将成为 Agent 间协作交易的事实标准。",
    keyQuotes: [
      "「未来的经济活动将有极大比例由智能体自主发起，它们需要无需许可、低延迟的全球结算网络。」",
      "「从美债、股票到算力和数据，链上代币化（Tokenization）正在构建智能体与人类共享的统一流动性市场。」"
    ],
    insights: [
      "Agent 原生金融栈：AI 智能体无法通过传统银行 KYC，加密钱包与稳定币（Stablecoin）是机器经济天然的无国界支付介质。",
      "可编程合规与安全：随着智能体发起的金融调用量级爆发，链上智能合约提供了比人工审批更具确定性与细粒度的防护护栏。",
      "流动性统一：从实体资产代币化到去中心化算力交易，全球统一市场使得 Agent 能毫秒级完成资源调配与付费。"
    ]
  },
  featuredBlog: null
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
    const agentKeywords = ['agent', 'code', 'eval', 'model', 'reason', 'prompt', 'compiler', 'test', 'qa', 'simulator', 'claw'];
    const productKeywords = ['ship', 'release', 'announc', 'launch', 'teams', 'app', 'v0', 'build', 'pod', 'newsletter'];

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
        role: (builder.bio || 'AI Builder').split('\n')[0].slice(0, 60),
        handle: builder.handle,
        url: `https://x.com/${builder.handle}`,
        highlight: topTweet.text.slice(0, 160) + (topTweet.text.length > 160 ? '...' : ''),
        summary: `最新发布了 ${builder.tweets.length} 条动态，重点探讨了相关开发与技术见解。`,
        tags: [builder.handle, topTweet.likes > 10 ? 'HighSignal' : 'Update'],
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
      const isBrianEpisode = (p.title || '').includes('Brian Armstrong') || (p.title || '').includes('Coinbase');

      data.featuredPodcast = {
        podcastName: p.name || "No Priors",
        episodeTitle: p.title || "最新深度访谈",
        guest: isBrianEpisode ? "Brian Armstrong (Coinbase 联合创始人兼 CEO) · 主持：Elad Gil & Sarah Guo" : "行业一线专家与主持人",
        url: p.url || "https://www.youtube.com/@NoPriorsPodcast",
        duration: "约 48 分钟",
        theTakeaway: isBrianEpisode ? FALLBACK_DATA.featuredPodcast.theTakeaway : "代码与生产已不再受人力工时限制；Agent 时代的核心竞争壁垒是开发者体验、工具选择权与精准上下文注入。",
        keyQuotes: isBrianEpisode ? FALLBACK_DATA.featuredPodcast.keyQuotes : FALLBACK_DATA.featuredPodcast.keyQuotes,
        insights: isBrianEpisode ? FALLBACK_DATA.featuredPodcast.insights : FALLBACK_DATA.featuredPodcast.insights
      };
    }

    return data;
  }

  return FALLBACK_DATA;
}

// Generate Clean Responsive Web HTML (Engineering-precise monochrome dark theme)
function renderHTML(data) {
  const categoriesHtml = data.topics.map(topic => `
    <section class="topic-section mb-12">
      <div class="section-header">
        <div class="section-title-wrap">
          <span class="label">${topic.title}</span>
          <span class="count-badge font-code">${topic.items.length}</span>
        </div>
      </div>
      <div class="cards-grid">
        ${topic.items.map(item => `
          <article class="panel builder-card">
            <div class="card-header">
              <div class="author-meta">
                <div class="avatar-fallback font-code">${item.author.charAt(0)}</div>
                <div class="author-info">
                  <div class="author-name-row">
                    <a href="${item.url}" target="_blank" rel="noopener" class="author-name">${item.author}</a>
                    <span class="author-handle font-code">@${item.handle}</span>
                  </div>
                  <p class="author-role">${item.role}</p>
                </div>
              </div>
            </div>
            <div class="card-body">
              <blockquote class="highlight-quote">“${item.highlight}”</blockquote>
              <p class="summary-text">${item.summary}</p>
              <div class="tags-row">
                ${item.tags.map(tag => `<span class="tag-badge font-code">#${tag}</span>`).join('')}
              </div>
            </div>
            <div class="card-footer">
              <div class="link-group">
                ${item.links.map(l => `
                  <a href="${l.url}" target="_blank" rel="noopener" class="card-link font-code">
                    ${l.text} <span class="arrow" aria-hidden="true">↗</span>
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
<html lang="zh-CN" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.meta.title} — ${data.dateISO}</title>
  <meta name="description" content="${data.meta.slogan}">
  <style>
    /*
     * Design system: engineering-precise dark (Linear / Vercel / Raycast genre).
     * Strictly monochrome palette with precise hairlines and JetBrains Mono chrome.
     */
    :root {
      --bg: #08090a;
      --panel: #0e0f11;
      --elevated: #131417;
      --fg: #f7f8f8;
      --dim: #8a8f98;
      --line: #1c1d21;
      --line-strong: #2a2c33;
      --accent: #f7f8f8;
      --accent-muted: #6e7bf2;
      --radius: 6px;
      --radius-sm: 4px;
      --radius-lg: 8px;
      --font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      --font-code: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    html[data-theme="light"] {
      --bg: #ffffff;
      --panel: #fafafa;
      --elevated: #f4f4f5;
      --fg: #0a0a0a;
      --dim: #62666d;
      --line: #e8e8ea;
      --line-strong: #d4d4d8;
      --accent: #0a0a0a;
      --accent-muted: #4c5ae0;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html {
      scroll-behavior: smooth;
      background-color: var(--bg);
    }

    body {
      background-color: var(--bg);
      color: var(--fg);
      font-family: var(--font-body);
      line-height: 1.65;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* Mono chrome: ligatures off, tabular numerals */
    .font-code {
      font-family: var(--font-code);
      font-variant-ligatures: none;
      font-feature-settings: 'tnum' 1;
    }

    .label {
      font-family: var(--font-code);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: var(--dim);
    }

    .shell {
      width: 100%;
      max-width: 1040px;
      margin: 0 auto;
      padding: 0 24px;
    }

    /* Site Header */
    .site-header {
      position: sticky;
      top: 0;
      z-index: 40;
      border-bottom: 1px solid var(--line);
      background-color: rgba(8, 9, 10, 0.85);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    html[data-theme="light"] .site-header {
      background-color: rgba(255, 255, 255, 0.85);
    }

    .header-inner {
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .brand-group {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      color: var(--fg);
    }

    .brand-wordmark {
      font-size: 13px;
      font-weight: 500;
      letter-spacing: -0.02em;
    }

    .brand-accent {
      color: var(--accent-muted);
    }

    .brand-divider {
      color: var(--line-strong);
      font-size: 13px;
    }

    .brand-sub {
      color: var(--dim);
      font-size: 13px;
      font-weight: 400;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 12px;
    }

    .date-badge {
      color: var(--dim);
      font-size: 12px;
    }

    .theme-toggle-btn {
      background: none;
      border: 1px solid var(--line);
      border-radius: var(--radius-sm);
      color: var(--dim);
      cursor: pointer;
      padding: 4px 8px;
      font-size: 12px;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: color 0.15s, border-color 0.15s;
    }

    .theme-toggle-btn:hover {
      color: var(--fg);
      border-color: var(--line-strong);
    }

    .github-link {
      color: var(--dim);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: color 0.15s;
    }

    .github-link:hover {
      color: var(--fg);
    }

    /* Hero Section */
    .hero-section {
      border-bottom: 1px solid var(--line);
      padding: 48px 0 32px 0;
    }

    .status-indicator {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: var(--accent-muted);
    }

    .hero-title {
      font-size: 32px;
      font-weight: 500;
      letter-spacing: -0.025em;
      line-height: 1.2;
      color: var(--fg);
      margin-bottom: 12px;
    }

    @media (min-width: 768px) {
      .hero-title {
        font-size: 40px;
      }
    }

    .hero-slogan {
      color: var(--dim);
      font-size: 15px;
      max-width: 680px;
      line-height: 1.7;
      margin-bottom: 28px;
    }

    /* Stats Bar */
    .stats-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      padding-top: 18px;
      border-top: 1px solid var(--line);
    }

    .stat-item {
      display: flex;
      align-items: baseline;
      gap: 8px;
      font-size: 12px;
    }

    .stat-label {
      color: var(--dim);
      letter-spacing: 0.06em;
    }

    .stat-val {
      color: var(--fg);
      font-weight: 500;
    }

    /* Content Area */
    main.main-content {
      padding: 40px 0 60px 0;
      flex: 1;
    }

    /* Panels & Cards */
    .panel {
      background-color: var(--panel);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      transition: border-color 0.15s ease;
    }

    .panel:hover {
      border-color: var(--line-strong);
    }

    /* Executive Summary Block */
    .executive-panel {
      padding: 24px;
      margin-bottom: 40px;
    }

    .panel-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 18px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--line);
    }

    .exec-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .exec-item {
      display: flex;
      align-items: baseline;
      gap: 12px;
      font-size: 14px;
      line-height: 1.7;
    }

    .badge {
      font-size: 11px;
      font-family: var(--font-code);
      color: var(--dim);
      background-color: var(--elevated);
      border: 1px solid var(--line);
      border-radius: var(--radius-sm);
      padding: 2px 7px;
      white-space: nowrap;
      flex-shrink: 0;
      letter-spacing: 0.04em;
    }

    .exec-text {
      color: var(--fg);
    }

    /* Featured Podcast Card */
    .podcast-panel {
      padding: 24px;
      margin-bottom: 48px;
    }

    .podcast-title {
      font-size: 18px;
      font-weight: 500;
      color: var(--fg);
      margin-bottom: 6px;
      letter-spacing: -0.01em;
    }

    .podcast-meta {
      font-size: 12px;
      color: var(--dim);
      margin-bottom: 18px;
    }

    .takeaway-box {
      background-color: var(--elevated);
      border-left: 2px solid var(--fg);
      padding: 12px 16px;
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
      margin-bottom: 18px;
    }

    .takeaway-label {
      font-size: 11px;
      font-weight: 500;
      color: var(--dim);
      letter-spacing: 0.12em;
      margin-bottom: 4px;
    }

    .takeaway-text {
      font-size: 14px;
      color: var(--fg);
      line-height: 1.6;
    }

    .insights-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 22px;
    }

    .insights-list li {
      position: relative;
      padding-left: 16px;
      font-size: 13px;
      color: var(--dim);
      line-height: 1.6;
    }

    .insights-list li::before {
      content: "—";
      position: absolute;
      left: 0;
      color: var(--line-strong);
    }

    .btn-action {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 500;
      color: var(--fg);
      background-color: var(--elevated);
      border: 1px solid var(--line);
      border-radius: var(--radius-sm);
      padding: 6px 14px;
      text-decoration: none;
      transition: border-color 0.15s, background-color 0.15s;
    }

    .btn-action:hover {
      border-color: var(--line-strong);
      background-color: var(--panel);
    }

    /* Topic Sections */
    .section-header {
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--line);
      display: flex;
      align-items: baseline;
      justify-content: space-between;
    }

    .section-title-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .count-badge {
      font-size: 11px;
      color: var(--dim);
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 1px 7px;
    }

    /* Cards Grid */
    .cards-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .builder-card {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .author-meta {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .avatar-fallback {
      width: 34px;
      height: 34px;
      border-radius: var(--radius-sm);
      background-color: var(--elevated);
      border: 1px solid var(--line);
      color: var(--fg);
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .author-name-row {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    .author-name {
      font-size: 15px;
      font-weight: 500;
      color: var(--fg);
      text-decoration: none;
    }

    .author-name:hover {
      text-decoration: underline;
    }

    .author-handle {
      font-size: 12px;
      color: var(--dim);
    }

    .author-role {
      font-size: 12px;
      color: var(--dim);
      margin-top: 2px;
    }

    .highlight-quote {
      font-size: 14px;
      color: var(--fg);
      border-left: 2px solid var(--line-strong);
      padding-left: 14px;
      line-height: 1.6;
      font-style: normal;
    }

    .summary-text {
      font-size: 13px;
      color: var(--dim);
      line-height: 1.6;
    }

    .tags-row {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .tag-badge {
      font-size: 11px;
      color: var(--dim);
      background-color: var(--elevated);
      border: 1px solid var(--line);
      border-radius: var(--radius-sm);
      padding: 2px 7px;
    }

    .card-footer {
      display: flex;
      justify-content: flex-end;
      border-top: 1px solid var(--line);
      padding-top: 12px;
    }

    .link-group {
      display: flex;
      gap: 12px;
    }

    .card-link {
      font-size: 12px;
      color: var(--dim);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: color 0.15s;
    }

    .card-link:hover {
      color: var(--fg);
    }

    .arrow {
      font-size: 11px;
      transition: transform 0.15s ease;
    }

    .card-link:hover .arrow {
      transform: translate(1px, -1px);
    }

    /* Footer */
    .site-footer {
      border-top: 1px solid var(--line);
      padding: 48px 0 64px 0;
      margin-top: auto;
    }

    .footer-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 12px;
    }

    .footer-brand {
      font-size: 13px;
      font-weight: 500;
      color: var(--fg);
    }

    .footer-desc {
      font-size: 13px;
      color: var(--dim);
      max-width: 480px;
    }

    .footer-meta {
      font-size: 12px;
      color: var(--dim);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .footer-meta a {
      color: var(--dim);
      text-decoration: none;
      border-bottom: 1px solid var(--line);
      transition: color 0.15s, border-color 0.15s;
    }

    .footer-meta a:hover {
      color: var(--fg);
      border-color: var(--line-strong);
    }

    .footer-sep {
      color: var(--line-strong);
    }

    @media (max-width: 640px) {
      .shell { padding: 0 16px; }
      .hero-title { font-size: 26px; }
      .header-actions .date-badge { display: none; }
      .exec-item { flex-direction: column; gap: 4px; }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <header class="site-header">
    <div class="shell header-inner">
      <a href="https://bluemanta.xyz" target="_blank" rel="noopener" class="brand-group font-code">
        <span class="brand-wordmark">i<span class="brand-accent">Blue</span>Manta</span>
        <span class="brand-divider">/</span>
        <span class="brand-sub">follow-builders</span>
      </a>
      <div class="header-actions font-code">
        <span class="date-badge">${data.dateISO}</span>
        <button id="themeToggle" class="theme-toggle-btn" aria-label="Toggle theme" onclick="toggleTheme()">
          <span id="themeLabel">THEME</span>
        </button>
        <a href="https://github.com/bluemanta/follow-builders" target="_blank" rel="noopener" class="github-link">GitHub ↗</a>
      </div>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="hero-section">
    <div class="shell">
      <div class="status-indicator">
        <span class="status-dot"></span>
        <span class="label">DAILY BUILDERS DIGEST · 每日速递</span>
      </div>
      <h1 class="hero-title">${data.meta.title}</h1>
      <p class="hero-slogan">${data.meta.slogan}</p>
      
      <div class="stats-bar font-code">
        <div class="stat-item">
          <span class="stat-label">TRACKED:</span>
          <span class="stat-val">${data.meta.stats.buildersCount}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">ACTIVE TODAY:</span>
          <span class="stat-val">${data.meta.stats.activeBuildersToday}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">PODCAST:</span>
          <span class="stat-val">${data.meta.stats.podcastEpisodesToday} 期</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">UPDATED:</span>
          <span class="stat-val">${data.dateISO}</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Main Content -->
  <main class="main-content">
    <div class="shell">
      <!-- 1-Minute Executive Summary -->
      <section class="panel executive-panel">
        <div class="panel-header-row">
          <span class="label">TODAY'S HIGHLIGHTS · 今日核心要闻（1 分钟速读）</span>
        </div>
        <ul class="exec-list">
          ${data.executiveSummary.map(item => `
            <li class="exec-item">
              <span class="badge">${item.badge}</span>
              <span class="exec-text">${item.text}</span>
            </li>
          `).join('')}
        </ul>
      </section>

      <!-- Featured Podcast -->
      ${data.featuredPodcast ? `
      <section class="panel podcast-panel">
        <div class="panel-header-row">
          <span class="label">FEATURED PODCAST · 深度播客精读 · ${data.featuredPodcast.podcastName}</span>
        </div>
        <h2 class="podcast-title">${data.featuredPodcast.episodeTitle}</h2>
        <p class="podcast-meta font-code">${data.featuredPodcast.guest} · 节目时长：${data.featuredPodcast.duration}</p>
        
        <div class="takeaway-box">
          <div class="takeaway-label font-code">THE TAKEAWAY / 核心洞见</div>
          <p class="takeaway-text">${data.featuredPodcast.theTakeaway}</p>
        </div>

        <ul class="insights-list">
          ${data.featuredPodcast.insights.map(ins => `<li>${ins}</li>`).join('')}
        </ul>

        <div class="panel-footer" style="padding-top: 14px; border-top: 1px solid var(--line); display: flex; justify-content: flex-end;">
          <a href="${data.featuredPodcast.url}" target="_blank" rel="noopener" class="btn-action font-code">
            收听完整节目与字幕 <span class="arrow">↗</span>
          </a>
        </div>
      </section>
      ` : ''}

      <!-- Topics & Builders Cards -->
      ${categoriesHtml}
    </div>
  </main>

  <!-- Footer -->
  <footer class="site-footer">
    <div class="shell footer-inner">
      <div class="footer-brand font-code">
        i<span class="brand-accent">Blue</span>Manta
      </div>
      <p class="footer-desc font-code">
        追踪做产品的思考者，过滤搬运信息的网红。
      </p>
      <div class="footer-meta font-code">
        <span>Powered by <a href="https://github.com/bluemanta/follow-builders" target="_blank" rel="noopener">Follow Builders</a></span>
        <span class="footer-sep">·</span>
        <span>Hosted on <a href="https://bluemanta.github.io/follow-builders/" target="_blank" rel="noopener">GitHub Pages</a></span>
      </div>
    </div>
  </footer>

  <script>
    function toggleTheme() {
      var current = document.documentElement.getAttribute('data-theme') || 'dark';
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('ibluemanta-theme', next);
      updateThemeLabel(next);
    }

    function updateThemeLabel(theme) {
      var label = document.getElementById('themeLabel');
      if (label) {
        label.textContent = theme === 'dark' ? 'LIGHT' : 'DARK';
      }
    }

    (function() {
      var saved = localStorage.getItem('ibluemanta-theme');
      if (saved === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        updateThemeLabel('light');
      } else {
        updateThemeLabel('dark');
      }
    })();
  </script>
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
        content: `**💡 今日 1 分钟核心要闻速览**\n` +
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
        content: `**🎧 深度播客精读｜${data.featuredPodcast.podcastName}**\n` +
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
          type: "default",
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
          content: `**${item.author}** (@${item.handle} · ${item.role})\n` +
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
        content: `Follow Builders · 追踪做产品的思考者 · ${data.dateISO}`
      }
    ]
  });

  return {
    config: { wide_screen_mode: true },
    header: {
      template: "grey",
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
    md += `- **核心洞见**：${data.featuredPodcast.theTakeaway}\n\n`;
    md += `**重点分析**：\n`;
    data.featuredPodcast.insights.forEach(ins => {
      md += `1. ${ins}\n`;
    });
    md += `\n🔗 [收听完整节目](${data.featuredPodcast.url})\n\n`;
    md += `---\n\n`;
  }

  data.topics.forEach(topic => {
    md += `## ${topic.emoji} ${topic.title}\n\n`;
    topic.items.forEach(item => {
      md += `### ${item.author} (@${item.handle} · ${item.role})\n`;
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
  console.log(`Active builders: ${data.meta.stats.activeBuildersToday}, Podcasts: ${data.meta.stats.podcastEpisodesToday}, Date: ${data.dateISO}`);

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
