// Renderer Ricos → JSX (server component pur, zéro JS client).
// Sous-ensemble fermé : tout type hors inventaire fait échouer le build
// (contenu/reference/ricos-inventory.json). Le style visuel vit dans
// .prose-blog / .ricos-* (globals.css) — ici, uniquement la structure et les
// styles portés par les données (couleurs, tailles, alignements).
import type { JSX, ReactNode } from "react"
import type { RicosDoc, RicosNode, RicosDecoration, TextStyle } from "./types"

/** Les liens internes absolus du live deviennent relatifs (marche sur preview
 * et prod ; les chemins hérités passent par les 301 de next.config). */
const SITE_ORIGIN_RE = /^https?:\/\/(www\.)?jplouton-avocat\.fr(?=\/|$)/

function internalizeHref(url: string): string {
  return url.replace(SITE_ORIGIN_RE, "") || "/"
}

/** URL média wixstatic — accepte l'URL complète ou l'ID nu.
 * (Rapatriement des médias = tâche pré-cutover, hors convergence.) */
function wixMediaUrl(srcOrId: string): string {
  if (srcOrId.startsWith("http")) return srcOrId
  return `https://static.wixstatic.com/media/${srcOrId}`
}

function relAttr(link?: { rel?: { nofollow?: boolean; sponsored?: boolean; ugc?: boolean }; target?: string }): string | undefined {
  const parts: string[] = []
  if (link?.rel?.nofollow) parts.push("nofollow")
  if (link?.rel?.sponsored) parts.push("sponsored")
  if (link?.rel?.ugc) parts.push("ugc")
  if (link?.target === "BLANK") parts.push("noopener")
  return parts.length ? parts.join(" ") : undefined
}

function alignStyle(ts?: TextStyle): React.CSSProperties | undefined {
  if (!ts?.textAlignment || ts.textAlignment === "AUTO") return undefined
  return { textAlign: ts.textAlignment.toLowerCase() as React.CSSProperties["textAlign"] }
}

/** Applique les décorations d'un run de texte, de l'intérieur vers l'extérieur. */
function decorate(text: string, decorations: RicosDecoration[] | undefined, key: number): ReactNode {
  let node: ReactNode = text
  if (!decorations?.length) return text
  for (const d of decorations) {
    switch (d.type) {
      case "BOLD":
        node = <strong>{node}</strong>
        break
      case "ITALIC":
        node = <em>{node}</em>
        break
      case "UNDERLINE":
        node = <u>{node}</u>
        break
      case "SUPERSCRIPT":
        node = <sup>{node}</sup>
        break
      case "COLOR": {
        const style: React.CSSProperties = {}
        if (d.colorData?.foreground) style.color = d.colorData.foreground
        if (d.colorData?.background && !/rgba\(0,\s*0,\s*0,\s*0\)/.test(d.colorData.background))
          style.backgroundColor = d.colorData.background
        if (Object.keys(style).length) node = <span style={style}>{node}</span>
        break
      }
      case "FONT_SIZE":
        if (d.fontSizeData?.value)
          node = <span style={{ fontSize: `${d.fontSizeData.value}${d.fontSizeData.unit === "EM" ? "em" : "px"}` }}>{node}</span>
        break
      case "ANCHOR":
        node = <span id={d.anchorData?.anchor}>{node}</span>
        break
      case "LINK": {
        const link = d.linkData?.link
        if (link?.url) {
          const href = internalizeHref(link.url) + (link.anchor ? `#${link.anchor}` : "")
          node = (
            <a href={href} target={link.target === "BLANK" ? "_blank" : undefined} rel={relAttr(link)}>
              {node}
            </a>
          )
        }
        break
      }
      default:
        throw new Error(`Ricos : décoration inconnue "${d.type}"`)
    }
  }
  return <span key={key}>{node}</span>
}

function renderChildren(nodes: RicosNode[] | undefined, ctx: Ctx): ReactNode[] {
  return (nodes || []).map((n, i) => renderNode(n, i, ctx))
}

/** Texte brut d'un sous-arbre (CODE_BLOCK, summary…). */
function plainText(node: RicosNode): string {
  if (node.type === "TEXT") return node.textData?.text || ""
  return (node.nodes || []).map(plainText).join("")
}

interface Ctx {
  slug: string
}

function renderNode(node: RicosNode, key: number, ctx: Ctx): ReactNode {
  switch (node.type) {
    case "TEXT":
      return decorate(node.textData?.text || "", node.textData?.decorations, key)

    case "PARAGRAPH": {
      const kids = renderChildren(node.nodes, ctx)
      const style = {
        ...alignStyle(node.paragraphData?.textStyle),
        ...(node.paragraphData?.indentation ? { paddingLeft: node.paragraphData.indentation * 32 } : {}),
      }
      // Paragraphe vide = ligne d'espacement sur le live (hauteur d'une ligne).
      return (
        <p key={key} style={Object.keys(style).length ? style : undefined}>
          {kids.length ? kids : <br />}
        </p>
      )
    }

    case "HEADING": {
      const level = Math.min(Math.max(node.headingData?.level || 2, 1), 6)
      const Tag = `h${level}` as keyof JSX.IntrinsicElements
      return (
        <Tag key={key} style={alignStyle(node.headingData?.textStyle)}>
          {renderChildren(node.nodes, ctx)}
        </Tag>
      )
    }

    case "BULLETED_LIST":
      return <ul key={key}>{renderChildren(node.nodes, ctx)}</ul>
    case "ORDERED_LIST":
      return <ol key={key}>{renderChildren(node.nodes, ctx)}</ol>
    case "LIST_ITEM":
      return <li key={key}>{renderChildren(node.nodes, ctx)}</li>

    case "BLOCKQUOTE":
      return <blockquote key={key}>{renderChildren(node.nodes, ctx)}</blockquote>

    case "DIVIDER": {
      const width = (node.dividerData?.width || "LARGE").toLowerCase()
      return <hr key={key} className={`ricos-divider ricos-divider-${width}`} />
    }

    case "TABLE": {
      const ratios = node.tableData?.dimensions?.colsWidthRatio || []
      const total = ratios.reduce((a, b) => a + b, 0)
      return (
        <div key={key} className="table-wrap">
          <table>
            {total > 0 && (
              <colgroup>
                {ratios.map((r, i) => (
                  <col key={i} style={{ width: `${((r / total) * 100).toFixed(2)}%` }} />
                ))}
              </colgroup>
            )}
            <tbody>{renderChildren(node.nodes, ctx)}</tbody>
          </table>
        </div>
      )
    }
    case "TABLE_ROW":
      return <tr key={key}>{renderChildren(node.nodes, ctx)}</tr>
    case "TABLE_CELL": {
      const bg = node.tableCellData?.cellStyle?.backgroundColor
      return (
        <td key={key} style={bg ? { backgroundColor: bg } : undefined}>
          {renderChildren(node.nodes, ctx)}
        </td>
      )
    }

    case "COLLAPSIBLE_LIST":
      return (
        <div key={key} className="ricos-collapsible">
          {renderChildren(node.nodes, ctx)}
        </div>
      )
    case "COLLAPSIBLE_ITEM": {
      const title = (node.nodes || []).find((n) => n.type === "COLLAPSIBLE_ITEM_TITLE")
      const body = (node.nodes || []).find((n) => n.type === "COLLAPSIBLE_ITEM_BODY")
      return (
        <details key={key}>
          <summary>{title ? plainText(title) : ""}</summary>
          {body ? renderChildren(body.nodes, ctx) : null}
        </details>
      )
    }
    case "COLLAPSIBLE_ITEM_TITLE":
    case "COLLAPSIBLE_ITEM_BODY":
      // Rendus par COLLAPSIBLE_ITEM ; jamais seuls dans le corpus.
      return null

    case "IMAGE": {
      const src = node.imageData?.image?.src?.url || node.imageData?.image?.src?.id
      if (!src) return null
      const { width, height } = node.imageData?.image || {}
      const img = (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={wixMediaUrl(src)}
          alt={node.imageData?.altText || ""}
          width={width || undefined}
          height={height || undefined}
          loading="lazy"
        />
      )
      const link = node.imageData?.link
      return (
        <figure key={key} className="article-image">
          {link?.url ? (
            <a href={internalizeHref(link.url)} target={link.target === "BLANK" ? "_blank" : undefined} rel={relAttr(link)}>
              {img}
            </a>
          ) : (
            img
          )}
          {node.imageData?.caption ? <figcaption>{node.imageData.caption}</figcaption> : null}
        </figure>
      )
    }

    case "VIDEO": {
      const url = node.videoData?.video?.src?.url
      if (!url) return null
      return (
        <div key={key} className="ricos-video">
          <iframe src={url} title="Vidéo" allowFullScreen allow="autoplay; fullscreen; picture-in-picture" />
        </div>
      )
    }

    case "GALLERY": {
      const items = node.galleryData?.items || []
      return (
        <div key={key} className="ricos-gallery">
          {items.map((it, i) => {
            const src = it.image?.media?.src?.url
            if (!src) return null
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={wixMediaUrl(src)}
                alt=""
                width={it.image?.media?.width || undefined}
                height={it.image?.media?.height || undefined}
                loading="lazy"
              />
            )
          })}
        </div>
      )
    }

    case "LINK_PREVIEW": {
      const d = node.linkPreviewData
      if (!d?.link?.url) return null
      return (
        <a
          key={key}
          className="ricos-link-preview"
          href={internalizeHref(d.link.url)}
          target={d.link.target === "BLANK" ? "_blank" : undefined}
          rel={relAttr(d.link)}
        >
          {d.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={d.thumbnailUrl} alt="" loading="lazy" />
          ) : null}
          <span className="ricos-link-preview-text">
            <strong>{d.title}</strong>
            {d.description ? <span>{d.description}</span> : null}
          </span>
        </a>
      )
    }

    case "BUTTON": {
      const d = node.buttonData
      if (!d?.link?.url) return null
      return (
        <a
          key={key}
          className="ricos-button"
          href={internalizeHref(d.link.url)}
          target={d.link.target === "BLANK" ? "_blank" : undefined}
          rel={relAttr(d.link)}
          style={d.styles?.backgroundColor ? { backgroundColor: d.styles.backgroundColor } : undefined}
        >
          {d.text}
        </a>
      )
    }

    case "HTML": {
      // Contenu embed posé par le propriétaire du site (6 occurrences : players
      // TF1/YouTube…) — rendu tel quel, comme sur le live.
      const d = node.htmlData
      if (!d?.html) return null
      const w = d.containerData?.width && "custom" in d.containerData.width ? Number((d.containerData.width as { custom?: string }).custom) : undefined
      const h = d.containerData?.height && "custom" in d.containerData.height ? Number((d.containerData.height as { custom?: string }).custom) : undefined
      return (
        <div
          key={key}
          className="ricos-html"
          style={{ maxWidth: w || undefined, height: h || undefined }}
          dangerouslySetInnerHTML={{ __html: d.html }}
        />
      )
    }

    case "FILE": {
      const d = node.fileData
      if (!d?.path) return null
      // Fichier hébergé Wix — à rapatrier avant la bascule DNS (1 occurrence).
      return (
        <a key={key} className="ricos-file" href={`https://www.jplouton-avocat.fr/_files/ugd/${d.path}`} target="_blank" rel="noopener">
          {d.name || d.path} {d.sizeInKb ? `(${d.sizeInKb} Ko)` : ""}
        </a>
      )
    }

    case "LAYOUT": {
      const d = node.layoutData
      return (
        <div
          key={key}
          className="ricos-layout"
          style={{
            gap: d?.gap,
            backgroundColor: d?.background?.type === "COLOR" ? d.background.color : undefined,
          }}
        >
          {renderChildren(node.nodes, ctx)}
        </div>
      )
    }
    case "LAYOUT_CELL":
      return (
        <div key={key} className="ricos-layout-cell">
          {renderChildren(node.nodes, ctx)}
        </div>
      )

    case "CODE_BLOCK":
      return (
        <pre key={key}>
          <code>{(node.nodes || []).map(plainText).join("\n")}</code>
        </pre>
      )

    case "CAPTION":
      return (
        <p key={key} className="ricos-caption" style={alignStyle(node.captionData?.textStyle)}>
          {renderChildren(node.nodes, ctx)}
        </p>
      )

    default:
      throw new Error(`Ricos : nœud inconnu "${node.type}" (article ${ctx.slug}) — étendre le renderer.`)
  }
}

export function RicosBody({ doc, slug }: { doc: RicosDoc; slug: string }) {
  return <>{renderChildren(doc.nodes, { slug })}</>
}
