#!/usr/bin/env python3
"""Import Wix CSV → JSON avec HTML structuré (titres, listes, liens)."""

from __future__ import annotations

import csv
import html
import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

csv.field_size_limit(sys.maxsize)

ROOT = Path(__file__).resolve().parents[1]
CONTENU = ROOT / "contenu"
ARTICLES_DIR = CONTENU / "articles"
SOURCES_WIX = CONTENU / "sources" / "wix"
POSTS_CSV = SOURCES_WIX / "Posts.csv"
CATS_CSV = SOURCES_WIX / "Categories.csv"
EQUIPE_CSV = SOURCES_WIX / "Equipe.csv"
SITE_ORIGIN = "https://www.jplouton-avocat.fr"


def wix_image_to_url(raw: str | None) -> str | None:
  if not raw:
    return None
  raw = raw.strip()
  if raw.startswith("http"):
    return raw.split("#", 1)[0]
  m = re.search(r"wix:image://v1/([^/#]+)", raw)
  if m:
    return f"https://static.wixstatic.com/media/{m.group(1)}"
  return None


def rewrite_href(url: str | None) -> str:
  if not url:
    return "#"
  url = url.strip()
  if url.startswith(SITE_ORIGIN):
    path = url[len(SITE_ORIGIN) :] or "/"
    return path
  if url.startswith("http://www.jplouton-avocat.fr"):
    return url.replace("http://www.jplouton-avocat.fr", "") or "/"
  return url


def parse_list(raw: str | None) -> list:
  if not raw or not raw.strip():
    return []
  try:
    import ast

    return ast.literal_eval(raw)
  except Exception:
    return []


def text_nodes_html(nodes: list | None) -> str:
  parts: list[str] = []
  for n in nodes or []:
    if n.get("type") != "TEXT":
      parts.append(render_node(n))
      continue
    data = n.get("textData") or {}
    text = html.escape(data.get("text") or "")
    if not text:
      continue
    href = None
    target = None
    bold = italic = underline = False
    for dec in data.get("decorations") or []:
      t = dec.get("type")
      if t == "BOLD":
        bold = True
      elif t == "ITALIC":
        italic = True
      elif t == "UNDERLINE":
        underline = True
      elif t == "LINK":
        link = ((dec.get("linkData") or {}).get("link")) or {}
        href = rewrite_href(link.get("url"))
        target = link.get("target")
    if bold:
      text = f"<strong>{text}</strong>"
    if italic:
      text = f"<em>{text}</em>"
    if underline and not href:
      text = f"<u>{text}</u>"
    if href:
      rel = ' rel="noopener noreferrer"' if target == "BLANK" else ""
      tgt = ' target="_blank"' if target == "BLANK" else ""
      text = f'<a href="{html.escape(href, quote=True)}"{tgt}{rel}>{text}</a>'
    parts.append(text)
  return "".join(parts)


def is_empty_html(s: str) -> bool:
  return not re.sub(r"<[^>]+>|&nbsp;|\s", "", s)


def render_node(node: dict) -> str:
  t = node.get("type")
  children = node.get("nodes") or []

  if t == "HEADING":
    level = int((node.get("headingData") or {}).get("level") or 2)
    level = min(max(level, 2), 4)  # h2–h4 in article body (h1 = title)
    inner = text_nodes_html(children)
    if is_empty_html(inner):
      return ""
    return f"<h{level}>{inner}</h{level}>"

  if t == "PARAGRAPH":
    inner = text_nodes_html(children)
    if is_empty_html(inner):
      return ""
    return f"<p>{inner}</p>"

  if t == "BLOCKQUOTE":
    inner = "".join(render_node(c) for c in children)
    if is_empty_html(inner):
      return ""
    return f"<blockquote>{inner}</blockquote>"

  if t == "BULLETED_LIST":
    items = "".join(render_node(c) for c in children)
    return f"<ul>{items}</ul>" if items else ""

  if t == "ORDERED_LIST":
    items = "".join(render_node(c) for c in children)
    return f"<ol>{items}</ol>" if items else ""

  if t == "LIST_ITEM":
    # list item often wraps a paragraph
    inner = "".join(render_node(c) for c in children)
    inner = re.sub(r"^<p>(.*)</p>$", r"\1", inner, flags=re.S)
    return f"<li>{inner}</li>" if not is_empty_html(inner) else ""

  if t == "DIVIDER":
    return "<hr />"

  if t == "IMAGE":
    img = (node.get("imageData") or {}).get("image") or {}
    src = img.get("src") or {}
    url = None
    if isinstance(src, dict):
      url = src.get("url") or wix_image_to_url(src.get("id"))
    elif isinstance(src, str):
      url = wix_image_to_url(src) or src
    alt = html.escape((node.get("imageData") or {}).get("altText") or "")
    if not url:
      return ""
    return f'<figure class="article-image"><img src="{html.escape(url, quote=True)}" alt="{alt}" loading="lazy" /></figure>'

  if t == "TABLE":
    rows = "".join(render_node(c) for c in children)
    return f'<div class="table-wrap"><table>{rows}</table></div>' if rows else ""

  if t == "TABLE_ROW":
    cells = "".join(render_node(c) for c in children)
    return f"<tr>{cells}</tr>" if cells else ""

  if t == "TABLE_CELL":
    inner = "".join(render_node(c) for c in children)
    return f"<td>{inner}</td>"

  if t == "COLLAPSIBLE_LIST":
    return "".join(render_node(c) for c in children)

  if t == "COLLAPSIBLE_ITEM":
    title = ""
    body = ""
    for c in children:
      if c.get("type") == "COLLAPSIBLE_ITEM_TITLE":
        title = text_nodes_html(c.get("nodes") or []) or "".join(
          render_node(x) for x in (c.get("nodes") or [])
        )
        title = re.sub(r"</?p>", "", title)
      elif c.get("type") == "COLLAPSIBLE_ITEM_BODY":
        body = "".join(render_node(x) for x in (c.get("nodes") or []))
    if not title:
      return body
    return f"<details><summary>{title}</summary>{body}</details>"

  if t in ("COLLAPSIBLE_ITEM_TITLE", "COLLAPSIBLE_ITEM_BODY", "CAPTION"):
    return "".join(render_node(c) for c in children)

  if t == "LINK_PREVIEW":
    link = (node.get("linkPreviewData") or {}).get("link") or {}
    url = rewrite_href(link.get("url"))
    title = html.escape(link.get("title") or url or "Lien")
    if not url:
      return ""
    return f'<p><a href="{html.escape(url, quote=True)}">{title}</a></p>'

  if t == "BUTTON":
    btn = node.get("buttonData") or {}
    label = html.escape(btn.get("text") or "En savoir plus")
    link = (btn.get("link") or {}) if isinstance(btn.get("link"), dict) else {}
    url = rewrite_href(link.get("url") or btn.get("url"))
    if not url:
      return ""
    return f'<p><a class="btn-inline" href="{html.escape(url, quote=True)}">{label}</a></p>'

  if t == "VIDEO":
    video = node.get("videoData") or {}
    src = ((video.get("video") or {}).get("src") or {})
    url = src.get("url") if isinstance(src, dict) else None
    if url:
      return f'<p><a href="{html.escape(rewrite_href(url), quote=True)}" target="_blank" rel="noopener noreferrer">Voir la vidéo</a></p>'
    return ""

  if t == "CODE_BLOCK":
    code = text_nodes_html(children)
    return f"<pre><code>{code}</code></pre>" if code else ""

  if t == "HTML":
    raw = (node.get("htmlData") or {}).get("html") or ""
    # keep as-is only if same-site safe enough; strip scripts
    raw = re.sub(r"<script[\s\S]*?</script>", "", raw, flags=re.I)
    return raw

  if t in ("LAYOUT", "LAYOUT_CELL", "GALLERY"):
    return "".join(render_node(c) for c in children)

  if t == "FILE":
    return ""

  if t == "TEXT":
    return text_nodes_html([node])

  # fallback: render children
  return "".join(render_node(c) for c in children)


def rich_to_html(rich_raw: str | None) -> str:
  if not rich_raw:
    return ""
  try:
    data = json.loads(rich_raw)
  except json.JSONDecodeError:
    return ""
  parts = [render_node(n) for n in (data.get("nodes") or [])]
  html_out = "\n".join(p for p in parts if p)
  # collapse excessive blank
  html_out = re.sub(r"\n{3,}", "\n\n", html_out)
  return html_out.strip()


def plain_to_body(plain: str) -> list[str]:
  text = (plain or "").replace("\r\n", "\n").strip()
  if not text:
    return []
  parts = re.split(r"\n{2,}", text)
  body: list[str] = []
  for part in parts:
    line = re.sub(r"\n+", " ", part.strip())
    line = re.sub(r" +", " ", line).strip()
    if line:
      body.append(line)
  return body


def load_categories() -> tuple[list[dict], dict[str, str]]:
  with open(CATS_CSV, encoding="utf-8-sig", newline="") as f:
    rows = list(csv.DictReader(f))
  cats = []
  id_to_label: dict[str, str] = {}
  for r in rows:
    cat = {
      "id": r["ID"],
      "label": r["Label"],
      "slug": r["Slug"],
      "description": (r.get("Description") or "").strip(),
      "postCount": int(r.get("Post Count") or 0),
      "url": r.get("Category Page URL") or f"/blog/categories/{r['Slug']}",
      "coverImage": wix_image_to_url(r.get("Cover Image")),
      "language": r.get("Language") or "fr",
    }
    cats.append(cat)
    id_to_label[cat["id"]] = cat["label"]
  cats.sort(key=lambda c: (-c["postCount"], c["label"]))
  return cats, id_to_label


def import_equipe() -> list[dict]:
  with open(EQUIPE_CSV, encoding="utf-8-sig", newline="") as f:
    rows = list(csv.DictReader(f))
  order = [
    "julien plouton",
    "mathilde manson",
    "andéol brachanet",
    "andeol brachanet",
    "jade adil",
    "axelle fesneau",
    "alexia simonini",
  ]

  def sort_key(r: dict) -> tuple:
    name = (r.get("Nom Prénom") or "").strip().lower().replace("me ", "")
    for i, key in enumerate(order):
      if key in name:
        return (i, name)
    return (99, name)

  members = []
  for r in sorted(rows, key=sort_key):
    members.append(
      {
        "id": r["ID"],
        "name": (r.get("Nom Prénom") or "").strip(),
        "role": (r.get("Titre") or "").strip(),
        "short": (r.get("Description - Short") or "").strip(),
        "bio": (r.get("Description longue") or "").strip(),
        "formation": (r.get("Formation") or "").strip(),
        "image": wix_image_to_url(r.get("Image")),
        "imageSquare": wix_image_to_url(r.get("Square image")),
        "linkedin": (r.get("Linkedin") or "").strip() or None,
      }
    )
  return members


def import_posts(id_to_label: dict[str, str]) -> list[dict]:
  with open(POSTS_CSV, encoding="utf-8-sig", newline="") as f:
    rows = list(csv.DictReader(f))

  articles = []
  for r in rows:
    slug = (r.get("Slug") or "").strip()
    if not slug:
      continue
    cat_ids = parse_list(r.get("Categories"))
    labels = [id_to_label[i] for i in cat_ids if i in id_to_label]
    main_id = (r.get("Main Category") or "").strip()
    if main_id and main_id in id_to_label and id_to_label[main_id] not in labels:
      labels.insert(0, id_to_label[main_id])

    published = (r.get("Published Date") or "").strip()
    last = (r.get("Last Published Date") or "").strip() or published
    try:
      minutes = int(float(r.get("Time To Read") or 0)) or None
    except ValueError:
      minutes = None

    body_html = rich_to_html(r.get("Rich Content"))
    body_plain = plain_to_body(r.get("Plain Content") or "")

    article = {
      "slug": slug,
      "title": (r.get("Title") or "").strip(),
      "excerpt": (r.get("Excerpt") or "").strip(),
      "publishedAt": published[:10] if published else "",
      "updatedAt": last[:10] if last else "",
      "status": "published",
      "author": (r.get("Author") or "").strip(),
      "categories": labels,
      "categoryIds": cat_ids,
      "coverImage": wix_image_to_url(r.get("Cover Image")),
      "minutesToRead": minutes,
      "viewCount": int(r.get("View Count") or 0),
      "url": r.get("Post Page URL") or f"/post/{slug}",
      "wixId": r.get("ID") or r.get("Internal ID"),
      "bodyHtml": body_html,
      "body": body_plain,  # fallback / admin
    }
    articles.append(article)
  articles.sort(key=lambda a: a["publishedAt"], reverse=True)
  return articles


def write_json(path: Path, data) -> None:
  path.parent.mkdir(parents=True, exist_ok=True)
  path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main() -> None:
  cats, id_to_label = load_categories()
  write_json(CONTENU / "categories.json", cats)
  print(f"categories: {len(cats)}")

  equipe = import_equipe()
  write_json(CONTENU / "equipe.json", equipe)
  print(f"equipe: {len(equipe)}")

  articles = import_posts(id_to_label)
  for old in ARTICLES_DIR.glob("*.json"):
    old.unlink()
  for a in articles:
    write_json(ARTICLES_DIR / f"{a['slug']}.json", a)

  index = [
    {
      "slug": a["slug"],
      "title": a["title"],
      "excerpt": a["excerpt"],
      "publishedAt": a["publishedAt"],
      "categories": a["categories"],
      "coverImage": a["coverImage"],
      "minutesToRead": a["minutesToRead"],
      "url": a["url"],
    }
    for a in articles
  ]
  write_json(CONTENU / "articles-index.json", index)

  with_html = sum(1 for a in articles if a["bodyHtml"])
  with_h2 = sum(1 for a in articles if "<h2>" in a["bodyHtml"])
  with_a = sum(1 for a in articles if "<a href=" in a["bodyHtml"])
  print(f"articles: {len(articles)} (html:{with_html} h2:{with_h2} links:{with_a})")


if __name__ == "__main__":
  main()
