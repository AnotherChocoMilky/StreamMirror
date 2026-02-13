const SERVERS = {
  vidup: {
    name: 'VidUp',
    movieUrl: (id, params) => `https://vidup.to/movie/${id}${params}`,
    tvUrl: (id, season, episode, params) => `https://vidup.to/tv/${id}/${season}/${episode}${params}`,
  },
  mapple: {
    name: 'Mapple',
    movieUrl: (id, params) => `https://mapple.uk/watch/movie/${id}${params}`,
    tvUrl: (id, season, episode, params) => `https://mapple.uk/watch/tv/${id}-${season}-${episode}${params}`,
  },
  vidfast: {
    name: 'VidFast',
    movieUrl: (id, params) => `https://vidfast.pro/movie/${id}${params}`,
    tvUrl: (id, season, episode, params) => `https://vidfast.pro/tv/${id}/${season}/${episode}${params}`,
  },
  vidlink: {
    name: 'VidLink',
    movieUrl: (id, params) => `https://vidlink.pro/movie/${id}${params}`,
    tvUrl: (id, season, episode, params) => `https://vidlink.pro/tv/${id}/${season}/${episode}${params}`,
  },
  onemovies: {
    name: '111Movies',
    movieUrl: (id, params) => `https://111movies.com/movie/${id}${params}`,
    tvUrl: (id, season, episode, params) => `https://111movies.com/tv/${id}/${season}/${episode}${params}`,
  },
  videasy: {
    name: 'Videasy',
    movieUrl: (id, params) => `https://player.videasy.net/movie/${id}${params}`,
    tvUrl: (id, season, episode, params) => `https://player.videasy.net/tv/${id}/${season}/${episode}${params}`,
  },
};

const DEFAULT_SERVER = 'vidfast';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Route: Home page
    if (path === '/' || path === '') {
      return new Response(renderHomePage(), {
        headers: { 'Content-Type': 'text/html;charset=UTF-8', ...corsHeaders },
      });
    }

    // Route: API docs
    if (path === '/api' || path === '/api/docs') {
      return new Response(renderApiDocs(), {
        headers: { 'Content-Type': 'text/html;charset=UTF-8', ...corsHeaders },
      });
    }

    // Route: API JSON docs
    if (path === '/api/docs.json') {
      return Response.json(getApiDocsJson(), {
        headers: corsHeaders,
      });
    }

    // Route: Movie embed
    const movieMatch = path.match(/^\/embed\/movie\/([^\/]+)\/?$/);
    if (movieMatch) {
      const id = movieMatch[1];
      const server = url.searchParams.get('server') || DEFAULT_SERVER;
      const queryParams = buildQueryString(url.searchParams, ['server']);
      return new Response(renderPlayerPage('movie', id, null, null, server, url.searchParams), {
        headers: { 'Content-Type': 'text/html;charset=UTF-8', ...corsHeaders },
      });
    }

    // Route: TV embed
    const tvMatch = path.match(/^\/embed\/tv\/([^\/]+)\/(\d+)\/(\d+)\/?$/);
    if (tvMatch) {
      const id = tvMatch[1];
      const season = tvMatch[2];
      const episode = tvMatch[3];
      const server = url.searchParams.get('server') || DEFAULT_SERVER;
      return new Response(renderPlayerPage('tv', id, season, episode, server, url.searchParams), {
        headers: { 'Content-Type': 'text/html;charset=UTF-8', ...corsHeaders },
      });
    }

    // Route: Anime embed (vidlink only)
    const animeMatch = path.match(/^\/embed\/anime\/([^\/]+)\/(\d+)\/([^\/]+)\/?$/);
    if (animeMatch) {
      const malId = animeMatch[1];
      const number = animeMatch[2];
      const subOrDub = animeMatch[3];
      const queryParams = buildQueryString(url.searchParams, ['server']);
      const embedUrl = `https://vidlink.pro/anime/${malId}/${number}/${subOrDub}${queryParams}`;
      return new Response(renderDirectPlayer(embedUrl, `Anime - ${malId}`, url.searchParams), {
        headers: { 'Content-Type': 'text/html;charset=UTF-8', ...corsHeaders },
      });
    }

    // Route: Get embed URL (API)
    if (path === '/api/embed-url') {
      const type = url.searchParams.get('type');
      const id = url.searchParams.get('id');
      const season = url.searchParams.get('season');
      const episode = url.searchParams.get('episode');
      const server = url.searchParams.get('server') || DEFAULT_SERVER;

      if (!type || !id) {
        return Response.json({ error: 'Missing required parameters: type, id' }, { status: 400, headers: corsHeaders });
      }

      const serverConfig = SERVERS[server];
      if (!serverConfig) {
        return Response.json({ error: `Invalid server: ${server}. Available: ${Object.keys(SERVERS).join(', ')}` }, { status: 400, headers: corsHeaders });
      }

      const queryParams = buildQueryString(url.searchParams, ['type', 'id', 'season', 'episode', 'server']);

      let embedUrl;
      if (type === 'movie') {
        embedUrl = serverConfig.movieUrl(id, queryParams);
      } else if (type === 'tv') {
        if (!season || !episode) {
          return Response.json({ error: 'Missing required parameters for TV: season, episode' }, { status: 400, headers: corsHeaders });
        }
        embedUrl = serverConfig.tvUrl(id, season, episode, queryParams);
      } else {
        return Response.json({ error: 'Invalid type. Use "movie" or "tv"' }, { status: 400, headers: corsHeaders });
      }

      return Response.json({
        embedUrl,
        server: server,
        serverName: serverConfig.name,
        type,
        id,
        ...(season && { season }),
        ...(episode && { episode }),
      }, { headers: corsHeaders });
    }

    // Route: List servers
    if (path === '/api/servers') {
      const serverList = Object.entries(SERVERS).map(([key, val]) => ({
        id: key,
        name: val.name,
      }));
      return Response.json({ servers: serverList, default: DEFAULT_SERVER }, { headers: corsHeaders });
    }

    // 404
    return new Response(render404Page(), {
      status: 404,
      headers: { 'Content-Type': 'text/html;charset=UTF-8', ...corsHeaders },
    });
  },
};

function buildQueryString(searchParams, excludeKeys = []) {
  const params = new URLSearchParams();
  for (const [key, value] of searchParams.entries()) {
    if (!excludeKeys.includes(key)) {
      params.append(key, value);
    }
  }
  const str = params.toString();
  return str ? `?${str}` : '';
}

function getEmbedUrl(type, id, season, episode, server, searchParams) {
  const serverConfig = SERVERS[server] || SERVERS[DEFAULT_SERVER];
  const queryParams = buildQueryString(searchParams, ['server']);

  if (type === 'movie') {
    return serverConfig.movieUrl(id, queryParams);
  } else if (type === 'tv') {
    return serverConfig.tvUrl(id, season, episode, queryParams);
  }
  return '';
}

function getBaseStyles() {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #0a0a0f;
      color: #e4e4e7;
      min-height: 100vh;
    }
    a { color: #818cf8; text-decoration: none; }
    a:hover { color: #a5b4fc; text-decoration: underline; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .header {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-bottom: 1px solid #2d2d44;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .logo {
      font-size: 1.5rem;
      font-weight: 800;
      background: linear-gradient(135deg, #818cf8, #c084fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .nav { display: flex; gap: 16px; }
    .nav a {
      color: #a1a1aa;
      font-size: 0.9rem;
      padding: 6px 12px;
      border-radius: 6px;
      transition: all 0.2s;
    }
    .nav a:hover { background: #27273a; color: #e4e4e7; text-decoration: none; }
    .btn {
      display: inline-block;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    .btn-primary {
      background: linear-gradient(135deg, #818cf8, #6366f1);
      color: white;
    }
    .btn-primary:hover { opacity: 0.9; text-decoration: none; }
    .btn-sm { padding: 6px 14px; font-size: 0.8rem; }
    code {
      background: #1e1e2e;
      padding: 2px 8px;
      border-radius: 4px;
      font-family: 'Fira Code', 'JetBrains Mono', monospace;
      font-size: 0.85em;
      color: #c084fc;
    }
    pre {
      background: #12121a;
      border: 1px solid #2d2d44;
      border-radius: 10px;
      padding: 20px;
      overflow-x: auto;
      margin: 12px 0;
    }
    pre code {
      background: none;
      padding: 0;
      color: #e4e4e7;
      font-size: 0.85rem;
      line-height: 1.6;
    }
    .card {
      background: #141420;
      border: 1px solid #2d2d44;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
    }
    .card h2 {
      font-size: 1.3rem;
      margin-bottom: 12px;
      color: #f4f4f5;
    }
    .card h3 {
      font-size: 1.05rem;
      margin-bottom: 8px;
      color: #d4d4d8;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
    }
    th, td {
      text-align: left;
      padding: 10px 14px;
      border-bottom: 1px solid #2d2d44;
      font-size: 0.9rem;
    }
    th {
      background: #1a1a2e;
      font-weight: 600;
      color: #a1a1aa;
      text-transform: uppercase;
      font-size: 0.75rem;
      letter-spacing: 0.05em;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-required { background: #7f1d1d; color: #fca5a5; }
    .badge-optional { background: #1e3a5f; color: #93c5fd; }
    .badge-get { background: #064e3b; color: #6ee7b7; }
    .server-btn {
      padding: 8px 16px;
      border-radius: 8px;
      border: 2px solid #2d2d44;
      background: #1a1a2e;
      color: #a1a1aa;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
      transition: all 0.2s;
    }
    .server-btn:hover { border-color: #818cf8; color: #e4e4e7; }
    .server-btn.active {
      border-color: #818cf8;
      background: linear-gradient(135deg, #1e1b4b, #1a1a2e);
      color: #818cf8;
    }
  `;
}

function renderLayout(title, content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - StreamMirror</title>
  <style>${getBaseStyles()}</style>
</head>
<body>
  <div class="header">
    <a href="/" class="logo" style="text-decoration:none">🎬 StreamMirror</a>
    <div class="nav">
      <a href="/">Home</a>
      <a href="/api/docs">API Docs</a>
      <a href="/api/servers">Servers</a>
    </div>
  </div>
  ${content}
</body>
</html>`;
}

function renderHomePage() {
  return renderLayout('Home', `
  <div class="container" style="padding-top: 40px;">
    <div style="text-align: center; margin-bottom: 48px;">
      <h1 style="font-size: 2.8rem; font-weight: 800; margin-bottom: 16px;">
        <span style="background: linear-gradient(135deg, #818cf8, #c084fc, #f472b6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
          StreamMirror
        </span>
      </h1>
      <p style="color: #a1a1aa; font-size: 1.15rem; max-width: 600px; margin: 0 auto;">
        Multi-server movie & TV show embed player. Mirror embeds from 6 different providers through a single unified API.
      </p>
    </div>

    <div class="card">
      <h2>🚀 Quick Start</h2>
      <p style="color: #a1a1aa; margin-bottom: 16px;">Embed a movie or TV show player in seconds:</p>
      
      <h3>Movie Embed</h3>
      <pre><code>&lt;iframe 
  src="https://stream-mirror.jameslandon220.workers.dev/embed/movie/533535?autoPlay=true" 
  width="100%" height="100%" 
  frameborder="0" allowfullscreen
  allow="encrypted-media"
&gt;&lt;/iframe&gt;</code></pre>

      <h3 style="margin-top: 20px;">TV Show Embed</h3>
      <pre><code>&lt;iframe 
  src="https://stream-mirror.jameslandon220.workers.dev/embed/tv/94997/1/1?autoPlay=true" 
  width="100%" height="100%" 
  frameborder="0" allowfullscreen
  allow="encrypted-media"
&gt;&lt;/iframe&gt;</code></pre>

      <h3 style="margin-top: 20px;">Anime Embed (VidLink only)</h3>
      <pre><code>&lt;iframe 
  src="https://stream-mirror.jameslandon220.workers.dev/embed/anime/5/1/sub" 
  width="100%" height="100%" 
  frameborder="0" allowfullscreen
  allow="encrypted-media"
&gt;&lt;/iframe&gt;</code></pre>
    </div>

    <div class="card">
      <h2>🖥️ Available Servers</h2>
      <table>
        <thead><tr><th>Server ID</th><th>Name</th><th>Movie Example</th><th>TV Example</th></tr></thead>
        <tbody>
          ${Object.entries(SERVERS).map(([key, s]) => `
          <tr>
            <td><code>${key}</code></td>
            <td>${s.name}</td>
            <td><a href="/embed/movie/533535?server=${key}&autoPlay=true">/embed/movie/533535?server=${key}</a></td>
            <td><a href="/embed/tv/94997/1/1?server=${key}&autoPlay=true">/embed/tv/94997/1/1?server=${key}</a></td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <div class="card">
      <h2>🧪 Live Demo</h2>
      <p style="color: #a1a1aa; margin-bottom: 16px;">Try the player with Deadpool & Wolverine (TMDB: 533535)</p>
      <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px;">
        <a href="/embed/movie/533535?autoPlay=true" class="btn btn-primary">▶ Watch Movie Demo</a>
        <a href="/embed/tv/94997/1/1?autoPlay=true" class="btn btn-primary">📺 Watch TV Demo</a>
        <a href="/api/docs" class="btn btn-primary" style="background: linear-gradient(135deg, #c084fc, #818cf8);">📖 API Docs</a>
      </div>
    </div>
  </div>`);
}

function renderPlayerPage(type, id, season, episode, server, searchParams) {
  const currentServer = SERVERS[server] ? server : DEFAULT_SERVER;
  const embedUrl = getEmbedUrl(type, id, season, episode, currentServer, searchParams);

  const basePath = type === 'movie'
    ? `/embed/movie/${id}`
    : `/embed/tv/${id}/${season}/${episode}`;

  // Build param string without server for switching
  const otherParams = new URLSearchParams();
  for (const [key, value] of searchParams.entries()) {
    if (key !== 'server') {
      otherParams.append(key, value);
    }
  }
  const otherParamStr = otherParams.toString();

  const title = type === 'movie' ? `Movie: ${id}` : `TV: ${id} S${season}E${episode}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - StreamMirror</title>
  <style>
    ${getBaseStyles()}
    body { background: #000; overflow: hidden; }
    .player-wrapper {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      display: flex;
      flex-direction: column;
    }
    .player-toolbar {
      background: rgba(10, 10, 15, 0.95);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid #2d2d44;
      padding: 8px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 10;
      flex-shrink: 0;
    }
    .toolbar-left { display: flex; align-items: center; gap: 12px; }
    .toolbar-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #e4e4e7;
    }
    .server-group {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .server-pill {
      padding: 4px 12px;
      border-radius: 20px;
      border: 1px solid #2d2d44;
      background: transparent;
      color: #71717a;
      cursor: pointer;
      font-size: 0.78rem;
      font-weight: 600;
      transition: all 0.2s;
      text-decoration: none;
    }
    .server-pill:hover {
      border-color: #818cf8;
      color: #c4b5fd;
      text-decoration: none;
    }
    .server-pill.active {
      border-color: #818cf8;
      background: #818cf8;
      color: #fff;
    }
    .player-frame {
      flex: 1;
      width: 100%;
      border: none;
    }
  </style>
</head>
<body>
  <div class="player-wrapper">
    <div class="player-toolbar">
      <div class="toolbar-left">
        <span class="toolbar-title">🎬 ${title}</span>
      </div>
      <div class="server-group">
        ${Object.entries(SERVERS).map(([key, s]) => {
          const paramStr = otherParamStr ? `server=${key}&${otherParamStr}` : `server=${key}`;
          const href = `${basePath}?${paramStr}`;
          const activeClass = key === currentServer ? 'active' : '';
          return `<a href="${href}" class="server-pill ${activeClass}">${s.name}</a>`;
        }).join('')}
      </div>
    </div>
    <iframe 
      src="${embedUrl}" 
      class="player-frame" 
      allowfullscreen 
      allow="encrypted-media; autoplay; fullscreen"
      referrerpolicy="origin"
    ></iframe>
  </div>
</body>
</html>`;
}

function renderDirectPlayer(embedUrl, title, searchParams) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - StreamMirror</title>
  <style>
    ${getBaseStyles()}
    body { background: #000; overflow: hidden; }
    .player-wrapper {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      display: flex; flex-direction: column;
    }
    .player-toolbar {
      background: rgba(10,10,15,0.95);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid #2d2d44;
      padding: 8px 16px;
      display: flex; align-items: center; gap: 12px;
      z-index: 10; flex-shrink: 0;
    }
    .toolbar-title { font-size: 0.9rem; font-weight: 600; color: #e4e4e7; }
    .player-frame { flex: 1; width: 100%; border: none; }
  </style>
</head>
<body>
  <div class="player-wrapper">
    <div class="player-toolbar">
      <span class="toolbar-title">🎬 ${title} (VidLink)</span>
    </div>
    <iframe 
      src="${embedUrl}" 
      class="player-frame" 
      allowfullscreen 
      allow="encrypted-media; autoplay; fullscreen"
      referrerpolicy="origin"
    ></iframe>
  </div>
</body>
</html>`;
}

function renderApiDocs() {
  return renderLayout('API Documentation', `
  <div class="container" style="padding-top: 32px;">
    <h1 style="font-size: 2rem; margin-bottom: 8px;">📖 API Documentation</h1>
    <p style="color: #a1a1aa; margin-bottom: 32px;">Complete reference for the StreamMirror embed player API.</p>

    <!-- Embed Endpoints -->
    <div class="card">
      <h2>🎬 Movie Embed</h2>
      <p style="margin-bottom: 8px;"><span class="badge badge-get">GET</span></p>
      <pre><code>/embed/movie/{id}</code></pre>
      
      <h3 style="margin-top: 16px;">Required Parameters</h3>
      <table>
        <thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>{id}</code></td><td><span class="badge badge-required">required</span></td><td>Movie identifier from IMDB (with <code>tt</code> prefix) or TMDB (numeric)</td></tr>
        </tbody>
      </table>

      <h3 style="margin-top: 16px;">Optional Query Parameters</h3>
      <table>
        <thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>server</code></td><td><span class="badge badge-optional">optional</span></td><td>Server to use: <code>vidup</code>, <code>mapple</code>, <code>vidfast</code>, <code>vidlink</code>, <code>onemovies</code>, <code>videasy</code>. Default: <code>vidfast</code></td></tr>
          <tr><td><code>autoPlay</code></td><td><span class="badge badge-optional">optional</span></td><td>Auto-play the video (<code>true</code>/<code>false</code>)</td></tr>
          <tr><td><code>title</code></td><td><span class="badge badge-optional">optional</span></td><td>Show/hide media title</td></tr>
          <tr><td><code>poster</code></td><td><span class="badge badge-optional">optional</span></td><td>Show/hide poster image</td></tr>
          <tr><td><code>startAt</code></td><td><span class="badge badge-optional">optional</span></td><td>Start time in seconds</td></tr>
          <tr><td><code>theme</code></td><td><span class="badge badge-optional">optional</span></td><td>Player accent color (hex, no #)</td></tr>
          <tr><td><code>sub</code></td><td><span class="badge badge-optional">optional</span></td><td>Default subtitle language (e.g. <code>en</code>, <code>es</code>)</td></tr>
          <tr><td><code>hideServer</code></td><td><span class="badge badge-optional">optional</span></td><td>Hide server selector in upstream player</td></tr>
          <tr><td><code>chromecast</code></td><td><span class="badge badge-optional">optional</span></td><td>Show/hide Chromecast button</td></tr>
          <tr><td><code>fullscreenButton</code></td><td><span class="badge badge-optional">optional</span></td><td>Show/hide fullscreen button</td></tr>
        </tbody>
      </table>

      <h3 style="margin-top: 16px;">Examples</h3>
      <pre><code>GET /embed/movie/533535
GET /embed/movie/533535?server=vidup&autoPlay=true
GET /embed/movie/tt6263850?server=mapple&theme=FF0000
GET /embed/movie/1084199?server=vidlink&primaryColor=B20710</code></pre>
    </div>

    <div class="card">
      <h2>📺 TV Show Embed</h2>
      <p style="margin-bottom: 8px;"><span class="badge badge-get">GET</span></p>
      <pre><code>/embed/tv/{id}/{season}/{episode}</code></pre>

      <h3 style="margin-top: 16px;">Required Parameters</h3>
      <table>
        <thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>{id}</code></td><td><span class="badge badge-required">required</span></td><td>TV show identifier from IMDB or TMDB</td></tr>
          <tr><td><code>{season}</code></td><td><span class="badge badge-required">required</span></td><td>Season number</td></tr>
          <tr><td><code>{episode}</code></td><td><span class="badge badge-required">required</span></td><td>Episode number</td></tr>
        </tbody>
      </table>

      <h3 style="margin-top: 16px;">Optional Query Parameters</h3>
      <table>
        <thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>server</code></td><td><span class="badge badge-optional">optional</span></td><td>Server to use (see movie section)</td></tr>
          <tr><td><code>autoPlay</code></td><td><span class="badge badge-optional">optional</span></td><td>Auto-play the video</td></tr>
          <tr><td><code>nextButton</code></td><td><span class="badge badge-optional">optional</span></td><td>Show next episode button at 90% progress</td></tr>
          <tr><td><code>autoNext</code></td><td><span class="badge badge-optional">optional</span></td><td>Auto-play next episode (requires nextButton on some servers)</td></tr>
          <tr><td><code>title</code></td><td><span class="badge badge-optional">optional</span></td><td>Show/hide media title</td></tr>
          <tr><td><code>poster</code></td><td><span class="badge badge-optional">optional</span></td><td>Show/hide poster</td></tr>
          <tr><td><code>startAt</code></td><td><span class="badge badge-optional">optional</span></td><td>Start time in seconds</td></tr>
          <tr><td><code>theme</code></td><td><span class="badge badge-optional">optional</span></td><td>Player accent color (hex)</td></tr>
          <tr><td><code>sub</code></td><td><span class="badge badge-optional">optional</span></td><td>Default subtitle language</td></tr>
        </tbody>
      </table>

      <h3 style="margin-top: 16px;">Examples</h3>
      <pre><code>GET /embed/tv/94997/1/1
GET /embed/tv/94997/1/1?server=vidup&autoPlay=true
GET /embed/tv/tt4052886/1/5?server=vidfast&nextButton=true&autoNext=true
GET /embed/tv/83867/1/1?server=mapple&autoPlay=true</code></pre>
    </div>

    <div class="card">
      <h2>🎌 Anime Embed</h2>
      <p style="color: #a1a1aa; margin-bottom: 8px;">Powered by VidLink only</p>
      <p style="margin-bottom: 8px;"><span class="badge badge-get">GET</span></p>
      <pre><code>/embed/anime/{malId}/{number}/{subOrDub}</code></pre>

      <h3 style="margin-top: 16px;">Required Parameters</h3>
      <table>
        <thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>{malId}</code></td><td><span class="badge badge-required">required</span></td><td>MyAnimeList ID</td></tr>
          <tr><td><code>{number}</code></td><td><span class="badge badge-required">required</span></td><td>Episode number</td></tr>
          <tr><td><code>{subOrDub}</code></td><td><span class="badge badge-required">required</span></td><td><code>sub</code> or <code>dub</code></td></tr>
        </tbody>
      </table>

      <h3 style="margin-top: 16px;">Optional Query Parameters</h3>
      <table>
        <thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>fallback</code></td><td><span class="badge badge-optional">optional</span></td><td>Set <code>true</code> to fallback to opposite audio type</td></tr>
          <tr><td><code>primaryColor</code></td><td><span class="badge badge-optional">optional</span></td><td>Player primary color (hex, no #)</td></tr>
          <tr><td><code>secondaryColor</code></td><td><span class="badge badge-optional">optional</span></td><td>Progress bar background color</td></tr>
          <tr><td><code>iconColor</code></td><td><span class="badge badge-optional">optional</span></td><td>Icon color</td></tr>
          <tr><td><code>icons</code></td><td><span class="badge badge-optional">optional</span></td><td>Icon style: <code>vid</code> or <code>default</code></td></tr>
          <tr><td><code>player</code></td><td><span class="badge badge-optional">optional</span></td><td>Player type: <code>jw</code> or default</td></tr>
        </tbody>
      </table>

      <h3 style="margin-top: 16px;">Examples</h3>
      <pre><code>GET /embed/anime/5/1/sub
GET /embed/anime/5/1/dub?fallback=true
GET /embed/anime/21/1/sub?primaryColor=FF6B00&icons=vid</code></pre>
    </div>

    <!-- REST API -->
    <div class="card">
      <h2>🔌 REST API Endpoints</h2>

      <h3 style="margin-top: 16px;"><span class="badge badge-get">GET</span> <code>/api/servers</code></h3>
      <p style="color: #a1a1aa;">Returns a list of all available servers.</p>
      <pre><code>// Response
{
  "servers": [
    { "id": "vidup", "name": "VidUp" },
    { "id": "mapple", "name": "Mapple" },
    { "id": "vidfast", "name": "VidFast" },
    { "id": "vidlink", "name": "VidLink" },
    { "id": "onemovies", "name": "111Movies" },
    { "id": "videasy", "name": "Videasy" }
  ],
  "default": "vidlink"
}</code></pre>

      <h3 style="margin-top: 24px;"><span class="badge badge-get">GET</span> <code>/api/embed-url</code></h3>
      <p style="color: #a1a1aa;">Get the direct upstream embed URL for a given media item and server.</p>
      <table>
        <thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>type</code></td><td><span class="badge badge-required">required</span></td><td><code>movie</code> or <code>tv</code></td></tr>
          <tr><td><code>id</code></td><td><span class="badge badge-required">required</span></td><td>IMDB or TMDB ID</td></tr>
          <tr><td><code>season</code></td><td><span class="badge badge-optional">for tv</span></td><td>Season number</td></tr>
          <tr><td><code>episode</code></td><td><span class="badge badge-optional">for tv</span></td><td>Episode number</td></tr>
          <tr><td><code>server</code></td><td><span class="badge badge-optional">optional</span></td><td>Server ID (default: <code>vidfast</code>)</td></tr>
        </tbody>
      </table>
      <pre><code>// GET /api/embed-url?type=movie&id=533535&server=vidup
// Response
{
  "embedUrl": "https://vidup.to/movie/533535",
  "server": "vidup",
  "serverName": "VidUp",
  "type": "movie",
  "id": "533535"
}</code></pre>

      <h3 style="margin-top: 24px;"><span class="badge badge-get">GET</span> <code>/api/docs.json</code></h3>
      <p style="color: #a1a1aa;">Returns API documentation in JSON format.</p>
    </div>

    <!-- Server Details -->
    <div class="card">
      <h2>🖥️ Server Details & Compatibility</h2>
      <table>
        <thead><tr><th>Server</th><th>ID</th><th>IMDB</th><th>TMDB</th><th>TV</th><th>Anime</th><th>Notable Features</th></tr></thead>
        <tbody>
          <tr><td>VidUp</td><td><code>vidup</code></td><td>✅</td><td>✅</td><td>✅</td><td>❌</td><td>Server selector, Chromecast, subtitle control</td></tr>
          <tr><td>Mapple</td><td><code>mapple</code></td><td>✅</td><td>✅</td><td>✅</td><td>❌</td><td>nextButton, autoNext for TV</td></tr>
          <tr><td>VidFast</td><td><code>vidfast</code></td><td>✅</td><td>✅</td><td>✅</td><td>❌</td><td>Server selector, Chromecast, subtitle, nextButton</td></tr>
          <tr><td>VidLink</td><td><code>vidlink</code></td><td>❌</td><td>✅</td><td>✅</td><td>✅</td><td>Anime support, JW Player option, custom icons, external subs</td></tr>
          <tr><td>111Movies</td><td><code>onemovies</code></td><td>✅</td><td>✅</td><td>✅</td><td>❌</td><td>Simple, minimal parameters</td></tr>
          <tr><td>Videasy</td><td><code>videasy</code></td><td>❌</td><td>✅</td><td>✅</td><td>❌</td><td>Clean player, simple integration</td></tr>
        </tbody>
      </table>
    </div>
  </div>`);
}

function render404Page() {
  return renderLayout('404 Not Found', `
  <div class="container" style="text-align: center; padding-top: 80px;">
    <h1 style="font-size: 5rem; margin-bottom: 16px; opacity: 0.3;">404</h1>
    <h2 style="margin-bottom: 12px;">Page Not Found</h2>
    <p style="color: #a1a1aa; margin-bottom: 24px;">The page you're looking for doesn't exist.</p>
    <a href="/" class="btn btn-primary">← Back to Home</a>
  </div>`);
}

function getApiDocsJson() {
  return {
    name: 'StreamMirror API',
    version: '1.0.0',
    description: 'Multi-server movie & TV show embed player API',
    baseUrl: 'https://your-worker.workers.dev',
    endpoints: {
      embed: {
        movie: {
          method: 'GET',
          path: '/embed/movie/{id}',
          description: 'Returns an HTML page with the embedded movie player',
          requiredParams: {
            id: 'Movie identifier from IMDB (tt prefix) or TMDB (numeric)',
          },
          optionalQueryParams: {
            server: 'Server ID: vidup, mapple, vidfast, vidlink, onemovies, videasy (default: vidfast)',
            autoPlay: 'Auto-play (true/false)',
            title: 'Show/hide title',
            poster: 'Show/hide poster',
            startAt: 'Start time in seconds',
            theme: 'Player color (hex, no #)',
            sub: 'Default subtitle language code',
            hideServer: 'Hide server selector in upstream player',
            chromecast: 'Show/hide Chromecast button',
            fullscreenButton: 'Show/hide fullscreen button',
          },
          examples: [
            '/embed/movie/533535',
            '/embed/movie/533535?server=vidup&autoPlay=true',
            '/embed/movie/tt6263850?server=mapple&theme=FF0000',
          ],
        },
        tv: {
          method: 'GET',
          path: '/embed/tv/{id}/{season}/{episode}',
          description: 'Returns an HTML page with the embedded TV show player',
          requiredParams: {
            id: 'TV show identifier from IMDB or TMDB',
            season: 'Season number',
            episode: 'Episode number',
          },
          optionalQueryParams: {
            server: 'Server ID (default: vidfast)',
            autoPlay: 'Auto-play',
            nextButton: 'Show next episode button at 90%',
            autoNext: 'Auto-play next episode',
            title: 'Show/hide title',
            poster: 'Show/hide poster',
            startAt: 'Start time in seconds',
            theme: 'Player color (hex)',
            sub: 'Default subtitle language',
          },
          examples: [
            '/embed/tv/94997/1/1',
            '/embed/tv/94997/1/1?server=vidup&autoPlay=true',
            '/embed/tv/tt4052886/1/5?server=vidfast&nextButton=true&autoNext=true',
          ],
        },
        anime: {
          method: 'GET',
          path: '/embed/anime/{malId}/{number}/{subOrDub}',
          description: 'Returns an HTML page with the embedded anime player (VidLink only)',
          requiredParams: {
            malId: 'MyAnimeList ID',
            number: 'Episode number',
            subOrDub: 'Audio type: sub or dub',
          },
          optionalQueryParams: {
            fallback: 'Fallback to opposite audio type (true/false)',
            primaryColor: 'Player primary color (hex, no #)',
            secondaryColor: 'Progress bar background color',
            iconColor: 'Icon color (hex)',
            icons: 'Icon style: vid or default',
            player: 'Player type: jw or default',
          },
          examples: [
            '/embed/anime/5/1/sub',
            '/embed/anime/5/1/dub?fallback=true',
          ],
        },
      },
      api: {
        servers: {
          method: 'GET',
          path: '/api/servers',
          description: 'Returns list of available servers',
        },
        embedUrl: {
          method: 'GET',
          path: '/api/embed-url',
          description: 'Returns the upstream embed URL for a given media item',
          requiredQueryParams: {
            type: 'movie or tv',
            id: 'IMDB or TMDB ID',
          },
          conditionalQueryParams: {
            season: 'Required for TV shows',
            episode: 'Required for TV shows',
          },
          optionalQueryParams: {
            server: 'Server ID (default: vidfast)',
          },
        },
        docs: {
          method: 'GET',
          path: '/api/docs.json',
          description: 'Returns this API documentation as JSON',
        },
      },
    },
    servers: Object.entries(SERVERS).map(([key, val]) => ({
      id: key,
      name: val.name,
    })),
  };
}
