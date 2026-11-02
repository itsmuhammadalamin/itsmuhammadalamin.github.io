import fs from "node:fs/promises";
import path from "node:path";

const SUPABASE_URL = "https://ahfzumcsyjwkvpgcjuuy.supabase.co";
const SUPABASE_KEY = "sb_publishable_l6zAy75h8KD25MuVY3gcHw_tFrCFSX3";
const SITE = "https://itsmuhammadalamin.github.io";
const OUT = "posts";

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[c]);
}
function inlineMarkdown(value) {
  return esc(value)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}
function renderMarkdown(markdown = "") {
  const lines = String(markdown).replace(/\r/g, "").split("\n");
  const out = [];
  let paragraph = [];
  let list = [];
  const flushParagraph = () => {
    if (paragraph.length) {
      out.push("<p>" + inlineMarkdown(paragraph.join(" ")) + "</p>");
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      out.push("<ul>" + list.map(x => "<li>" + inlineMarkdown(x) + "</li>").join("") + "</ul>");
      list = [];
    }
  };
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { flushParagraph(); flushList(); continue; }
    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph(); flushList();
      const level = heading[1].length;
      out.push("<h" + level + ">" + inlineMarkdown(heading[2]) + "</h" + level + ">");
    } else if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph();
      list.push(trimmed.replace(/^[-*]\s+/, ""));
    } else {
      flushList();
      paragraph.push(trimmed);
    }
  }
  flushParagraph(); flushList();
  return out.join("\n");
}
function renderContent(content = "") {
  const source = String(content || "");
  // Supabase posts may contain authored HTML or plain Markdown.
  if (!/<\/?(?:p|h[1-6]|ul|ol|li|blockquote|strong|em|a|br|hr|img)\b/i.test(source)) {
    return renderMarkdown(source);
  }
  return source
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s+(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, "")
    .replace(/\\\\n/g, "\n");
}
function dateLabel(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-US", {
    year:"numeric", month:"long", day:"numeric", timeZone:"UTC"
  });
}
function page(post) {
  const url = SITE + "/posts/" + encodeURIComponent(post.slug) + "/";
  const description = (post.excerpt || post.content || "A story from Muhammad Alamin's personal chronicle.")
    .replace(/\s+/g, " ").slice(0, 155);
  const title = post.title + " | Chronicle — Muhammad Alamin";
  const image = post.image_url ? '<meta property="og:image" content="' + esc(post.image_url) + '">' : "";
  const cover = post.image_url ? '<img class="cover" src="' + esc(post.image_url) + '" alt="' + esc(post.title) + '">' : "";
  const credit = post.image_credit
    ? '<p class="credit">Photo credit: ' + esc(post.image_credit) +
      (post.image_source_url ? ' · <a href="' + esc(post.image_source_url) + '" target="_blank" rel="noopener noreferrer">Source</a>' : "") +
      "</p>" : "";
  return `<!doctype html>
<html lang="bn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#080808">
<meta name="robots" content="index,follow">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(url)}">
<link rel="icon" href="/favicon.svg?v=2" type="image/svg+xml">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Chronicle — Muhammad Alamin">
<meta property="og:title" content="${esc(post.title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
${image}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(post.title)}">
<meta name="twitter:description" content="${esc(description)}">
<style>
:root{--bg:#080808;--gold:#d8b45a;--gold2:#f5df9a;--muted:#b4b0a5;--white:#f7f4eb;--line:rgba(216,180,90,.22)}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at 50% -20%,rgba(216,180,90,.1),transparent 45%),var(--bg);color:var(--white);font-family:Inter,system-ui,sans-serif;line-height:1.8}
.wrap{width:min(1120px,calc(100% - 32px));margin:auto}.layout{display:grid;grid-template-columns:250px minmax(0,820px);gap:38px;align-items:start;justify-content:center}.popular{position:sticky;top:22px;margin:42px 0 70px;padding:20px;border:1px solid var(--line);border-radius:16px;background:rgba(17,17,15,.88)}.popular h2{font-size:1.05rem;color:var(--gold2);margin:0 0 14px}.popular-group{margin:0 0 18px}.popular-items{display:grid;grid-template-columns:minmax(0,1fr);gap:10px}.popular-card{display:flex;flex-direction:column;gap:6px;min-width:0;padding:7px;border:1px solid rgba(216,180,90,.12);border-radius:10px;background:rgba(255,255,255,.025)}.popular-card img{display:block;width:100%;aspect-ratio:16/9;height:auto;max-height:150px;object-fit:cover;border-radius:6px;background:#24221c}.popular-card-title{font-size:.78rem;line-height:1.35;color:#eee8d9;overflow-wrap:anywhere}.popular-card:hover{border-color:var(--gold)}.popular-category{font-size:.68rem;letter-spacing:.13em;color:var(--gold);font-weight:800;text-transform:uppercase;margin-bottom:7px}.popular a{display:block;color:#e8e2d4;font-size:.88rem;line-height:1.45;padding:7px 0;border-top:1px solid rgba(216,180,90,.1)}.popular-empty{font-size:.85rem;color:var(--muted)}@media(max-width:800px){.layout{grid-template-columns:1fr;gap:0}.popular{position:static;order:2;margin:0 0 35px}main{order:1}}header{display:flex;justify-content:space-between;align-items:center;padding:22px 0;border-bottom:1px solid var(--line)}a{color:var(--gold2);text-decoration:none}.brand{font-weight:850;letter-spacing:.08em}.brand span{color:var(--gold)}main{padding:42px 0 70px}.category{color:var(--gold2);font-size:.75rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.date{color:var(--muted);font-size:.85rem;margin-top:10px}h1{font-size:clamp(2rem,6vw,3.1rem);line-height:1.25;margin:12px 0}.excerpt{font-size:1.08rem;color:var(--muted);margin:20px 0 28px}.cover{width:100%;max-height:520px;object-fit:cover;border-radius:18px;border:1px solid var(--line);margin:12px 0 28px}.body{overflow-wrap:anywhere;font-size:1.04rem;color:#e0dccf}.body p{margin:0 0 1.2em}.body h2,.body h3{line-height:1.35;color:var(--gold2);margin:1.6em 0 .6em}.body ul{padding-left:1.4em}.credit{font-size:.82rem;color:var(--muted);margin-top:-18px;margin-bottom:25px}.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:35px;padding-top:22px;border-top:1px solid var(--line)}button{border:1px solid var(--line);border-radius:30px;padding:10px 17px;background:#171612;color:var(--gold2);font:inherit;cursor:pointer}footer{border-top:1px solid var(--line);padding:22px 0;color:var(--muted);font-size:.85rem}
</style>
<script type="application/ld+json">${JSON.stringify({
    "@context":"https://schema.org","@type":"BlogPosting",
    "headline":post.title,"description":description,"datePublished":post.created_at,
    "dateModified":post.updated_at || post.created_at,"mainEntityOfPage":url,
    "author":{"@type":"Person","name":"Muhammad Alamin","url":SITE},
    "publisher":{"@type":"Person","name":"Muhammad Alamin"},
    ...(post.image_url ? {"image":post.image_url} : {})
  }).replace(/</g,"\\u003c")}</script>
</head>
<body><div class="wrap">
<header><a class="brand" href="/">MA<span>.</span> CHRONICLE</a><a href="/all-posts.html">← All Posts</a></header>
<div class="layout"><aside class="popular" id="popularSidebar" aria-label="Popular reads"><h2>Popular Reads</h2><p class="popular-empty">Loading popular posts...</p></aside><main>
<span class="category">${esc(post.category || "Memories")}</span>
<h1>${esc(post.title)}</h1>
<div class="date">${esc(dateLabel(post.created_at))}</div>
${post.excerpt ? '<p class="excerpt">' + esc(post.excerpt) + "</p>" : ""}
${cover}${credit}
<article class="body">${renderContent(post.content || post.excerpt || "")}</article>
<div class="actions"><button id="share">↗ Share article</button></div>
</main></div>
<footer>© <span id="year"></span> Muhammad Alamin · A Personal Chronicle</footer>
</div>
<script>
const SUPABASE_URL = "https://ahfzumcsyjwkvpgcjuuy.supabase.co";
const SUPABASE_KEY = "sb_publishable_l6zAy75h8KD25MuVY3gcHw_tFrCFSX3";
const currentSlug = ${JSON.stringify(post.slug)};
(async function trackView(){
 try {
  const key="chronicle-viewed:"+currentSlug;
  if(sessionStorage.getItem(key)) return;
  await fetch(SUPABASE_URL+"/rest/v1/rpc/increment_post_view",{method:"POST",headers:{apikey:SUPABASE_KEY,Authorization:"Bearer "+SUPABASE_KEY,"Content-Type":"application/json"},body:JSON.stringify({p_slug:currentSlug})});
  sessionStorage.setItem(key,"1");
 } catch(e) { console.warn("View count update skipped",e); }
})();
(async function loadPopular(){
 const box=document.getElementById("popularSidebar");
 try {
  const headers={apikey:SUPABASE_KEY,Authorization:"Bearer "+SUPABASE_KEY};
  const endpoint=SUPABASE_URL+"/rest/v1/posts?select=title,slug,category,image_url,view_count,created_at&published=eq.true&order=view_count.desc,created_at.desc&limit=30";
  const response=await fetch(endpoint,{headers}); if(!response.ok) throw new Error("Popular posts request failed");
  const posts=await response.json(); const groups=new Map();
  posts.filter(p=>p.slug!==currentSlug).forEach(p=>{const key=p.category||"Other";if(!groups.has(key))groups.set(key,[]);if(groups.get(key).length<3)groups.get(key).push(p);});
  const chosen=[...groups.entries()].filter(([,items])=>items.length).slice(0,5);
  const safe=v=>String(v??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  box.innerHTML="<h2>Popular Reads</h2>"+(chosen.length?chosen.map(([name,items])=>'<section class="popular-group"><div class="popular-category">'+safe(name)+'</div><div class="popular-items">'+items.map(p=>'<a class="popular-card" href="/posts/'+encodeURIComponent(p.slug)+'/">'+(p.image_url?'<img loading="lazy" src="'+safe(p.image_url)+'" alt="">':'')+'<span class="popular-card-title">'+safe(p.title)+'</span></a>').join("")+'</div></section>').join(""):'<p class="popular-empty">Not enough popular posts yet.</p>');
 } catch(e) {console.error(e);box.innerHTML="<h2>Popular Reads</h2><p class=\"popular-empty\">Popular posts are temporarily unavailable.</p>";}
})();
document.getElementById("year").textContent = new Date().getFullYear();
document.getElementById("share").addEventListener("click", async () => {
 const data={title:${JSON.stringify(post.title)},text:${JSON.stringify(description)},url:location.href};
 try { if(navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(location.href); alert("Link copied."); } }
 catch(e) { if(e.name!=="AbortError") alert("Could not share: "+e.message); }
});
</script></body></html>`;
}

const endpoint = SUPABASE_URL + "/rest/v1/posts?select=title,slug,category,excerpt,content,image_url,image_credit,image_source_url,created_at,updated_at,published&published=eq.true&order=created_at.desc";
const response = await fetch(endpoint, { headers: {
  apikey: SUPABASE_KEY,
  Authorization: "Bearer " + SUPABASE_KEY
}});
if (!response.ok) throw new Error("Supabase request failed: " + response.status + " " + await response.text());
const posts = await response.json();
await fs.mkdir(OUT, { recursive:true });
const entries = [];
for (const post of posts) {
  if (!post.slug || !/^[a-z0-9-]+$/i.test(post.slug)) continue;
  const dir = path.join(OUT, post.slug);
  await fs.mkdir(dir, { recursive:true });
  await fs.writeFile(path.join(dir, "index.html"), page(post), "utf8");
  entries.push(`<url><loc>${SITE}/posts/${encodeURIComponent(post.slug)}/</loc><lastmod>${(post.updated_at || post.created_at || "").slice(0,10)}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`);
}
const staticUrls = [
  `<url><loc>${SITE}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
  `<url><loc>${SITE}/all-posts.html</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>`
];
const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  [...staticUrls, ...entries].join("\n") + '\n</urlset>\n';
await fs.writeFile("sitemap.xml", sitemap, "utf8");
console.log(`Generated ${entries.length} published article pages and sitemap.xml.`);
