import { convertHTMLToLexical } from '@payloadcms/richtext-lexical'
import { JSDOM } from 'jsdom'

type EditorConfig = Parameters<typeof convertHTMLToLexical>[0]['editorConfig']

// WordPress renders titles and excerpts as HTML with entities (&#8217;, &amp;); fields want text.
export function htmlText(html: string): string {
  // A space after each block, or "…Different</h3><p>Explain…" reads "DifferentExplain".
  const spaced = html.replace(/<\/(p|h[1-6]|li|div|figcaption)>|<br\s*\/?>/gi, '$& ')
  const { body } = new JSDOM(`<body>${spaced}</body>`).window.document
  return (body.textContent ?? '')
    .replace(/\[(…|&hellip;|\.\.\.)\]/g, '…')
    .replace(/\s+/g, ' ')
    .trim()
}

export type ImageRef = {
  // WordPress attachment id (`data-id` or the `wp-image-N` class), when the markup has one.
  wpId: number | null
  src: string
  caption: string
}

const attachmentId = (img: Element): number | null => {
  const id = img.getAttribute('data-id') ?? img.className.match(/wp-image-(\d+)/)?.[1]
  return id ? Number(id) : null
}

const captionOf = (img: Element): string => {
  const caption = img.closest('figure')?.querySelector(':scope > figcaption')
  return caption ? htmlText(caption.innerHTML) : ''
}

export function imageRefs(html: string): ImageRef[] {
  const { document } = new JSDOM(html).window
  return [...document.querySelectorAll('img')].map((img) => ({
    wpId: attachmentId(img),
    src: img.getAttribute('src') ?? '',
    caption: captionOf(img),
  }))
}

// Rewrites WordPress block markup into HTML the Lexical importer understands:
// - each <img> becomes a Payload upload node (`data-lexical-upload-id`), or is dropped when its
//   file could not be imported;
// - figures and galleries are unwrapped, captions kept as an italic line under the image;
// - images are lifted out of paragraphs and links (upload nodes are blocks);
// - h1 becomes h2 (the article page owns the h1), and empty paragraphs go.
export function prepareHtml(html: string, mediaId: (ref: ImageRef) => number | null): string {
  const { document } = new JSDOM(html).window

  for (const img of [...document.querySelectorAll('img')]) {
    const id = mediaId({ wpId: attachmentId(img), src: img.getAttribute('src') ?? '', caption: '' })
    if (id === null) {
      img.remove()
      continue
    }
    const upload = document.createElement('img')
    upload.setAttribute('data-lexical-upload-id', String(id))
    upload.setAttribute('data-lexical-upload-relation-to', 'media')
    img.replaceWith(upload)
  }

  for (const link of [...document.querySelectorAll('a')]) {
    if (
      link.children.length === 1 &&
      link.firstElementChild?.tagName === 'IMG' &&
      !link.textContent?.trim()
    ) {
      link.replaceWith(link.firstElementChild)
    }
  }

  // querySelectorAll is in document order (outer first); reversed, inner figures go first.
  for (const figure of [...document.querySelectorAll('figure')].reverse()) {
    const parts: Node[] = []
    for (const child of [...figure.childNodes]) {
      if (child.nodeName === 'FIGCAPTION') {
        const text = htmlText((child as Element).innerHTML)
        if (!text) continue
        const line = document.createElement('p')
        const em = document.createElement('em')
        em.textContent = text
        line.append(em)
        parts.push(line)
      } else {
        parts.push(child)
      }
    }
    figure.replaceWith(...parts)
  }

  for (const upload of [...document.querySelectorAll('p img, h2 img, h3 img, h4 img, li img')]) {
    const block = upload.closest('p, h2, h3, h4, li')!
    block.after(upload)
  }

  for (const heading of [...document.querySelectorAll('h1')]) {
    const h2 = document.createElement('h2')
    h2.innerHTML = heading.innerHTML
    heading.replaceWith(h2)
  }

  for (const paragraph of [...document.querySelectorAll('p')]) {
    if (!paragraph.textContent?.replace(/ /g, ' ').trim() && !paragraph.querySelector('img')) {
      paragraph.remove()
    }
  }

  return document.body.innerHTML
}

type LexicalNode = { type: string; value?: unknown; children?: LexicalNode[] }

// The DOM importer reads upload ids from an attribute, so they arrive as strings; Postgres ids are
// numbers, and Payload's validation rejects a string id.
const numericUploadIds = (node: LexicalNode) => {
  if (node.type === 'upload' && typeof node.value === 'string') node.value = Number(node.value)
  node.children?.forEach(numericUploadIds)
}

export function htmlToLexical(html: string, editorConfig: EditorConfig) {
  const state = convertHTMLToLexical({ editorConfig, html, JSDOM })
  numericUploadIds(state.root as LexicalNode)
  return state
}
