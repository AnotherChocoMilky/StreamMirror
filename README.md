# 🎬 StreamMirror

**StreamMirror** is a proprietary Cloudflare Worker-powered **movie & TV streaming embed player**.  
It unifies **6 different streaming APIs** into one sleek interface, delivering fast, reliable streaming for movies, TV shows, and anime.

> ⚠️ **Proprietary Software** – Unauthorized use, reproduction, or redistribution is strictly prohibited and will result in legal action.

---

## ✨ Features

- 🌐 **Unified API** – Aggregates 6 streaming sources into one endpoint.  
- 🎥 **Movies & TV Shows** – Access a massive library instantly.  
- 🍥 **Anime Support** – VidLink server only.  
- 🔗 **Embed Anywhere** – iFrame-friendly for websites and apps.  
- ⚡ **Fast & Lightweight** – Powered by Cloudflare Workers.  
- 📱 **Cross-Platform** – Desktop, mobile, and tablet friendly.  

---

## 🔧 How It Works

StreamMirror acts as a **smart aggregator**:

1. Queries all 6 integrated APIs for your requested title.  
2. Picks the **best available source**.  
3. Returns a clean, embeddable player link.  
4. Streams content securely and efficiently via Cloudflare Workers.  

> Everything is proprietary and protected—only licensed users may access it.

---

## 🚀 Quick Start

Embed a movie, TV show, or anime player in seconds.

### 🎬 Movie Embed
<iframe 
  src="https://stream-mirror.jameslandon220.workers.dev/embed/movie/533535?autoPlay=true" 
  width="100%" 
  height="100%" 
  frameborder="0" 
  allowfullscreen
  allow="encrypted-media">
</iframe>

### 📺 TV Show Embed
<iframe 
  src="https://stream-mirror.jameslandon220.workers.dev/embed/tv/94997/1/1?autoPlay=true" 
  width="100%" 
  height="100%" 
  frameborder="0" 
  allowfullscreen
  allow="encrypted-media">
</iframe>

### 🍥 Anime Embed (VidLink Only)
<iframe 
  src="https://stream-mirror.jameslandon220.workers.dev/embed/anime/5/1/sub" 
  width="100%" 
  height="100%" 
  frameborder="0" 
  allowfullscreen
  allow="encrypted-media">
</iframe>

---

## 🖥️ Available Servers

Choose your preferred streaming server using the `server` parameter:

| Server ID   | Name       | Movie Example                               | TV Example                                  |
|-------------|------------|---------------------------------------------|---------------------------------------------|
| vidup       | VidUp      | `/embed/movie/533535?server=vidup`          | `/embed/tv/94997/1/1?server=vidup`         |
| mapple      | Mapple     | `/embed/movie/533535?server=mapple`         | `/embed/tv/94997/1/1?server=mapple`        |
| vidfast     | VidFast    | `/embed/movie/533535?server=vidfast`        | `/embed/tv/94997/1/1?server=vidfast`       |
| vidlink     | VidLink    | `/embed/movie/533535?server=vidlink`        | `/embed/tv/94997/1/1?server=vidlink`       |
| onemovies   | 111Movies  | `/embed/movie/533535?server=onemovies`      | `/embed/tv/94997/1/1?server=onemovies`     |
| videasy     | Videasy    | `/embed/movie/533535?server=videasy`        | `/embed/tv/94997/1/1?server=videasy`       |

> If no server is specified, StreamMirror automatically selects the best available source.

### 🎯 Server Selection Example
<iframe 
  src="https://stream-mirror.jameslandon220.workers.dev/embed/movie/533535?server=vidfast" 
  width="100%" 
  height="100%" 
  allowfullscreen>
</iframe>

---

## ⚖️ Legal Notice

**StreamMirror is proprietary software.**  

Unauthorized use, reproduction, redistribution, or self-hosting is strictly prohibited and will result in **legal action**.  

Do **not attempt to copy, reverse-engineer, or redistribute** this software.  

---

## 🎬 Ready to Stream

StreamMirror delivers movies, TV shows, and anime **instantly, safely, and reliably**.  
Use it responsibly and enjoy the content. 🍿
