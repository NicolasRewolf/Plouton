// Types du sous-ensemble Ricos réellement présent dans le corpus (voir
// contenu/reference/ricos-inventory.json : 26 types de nœuds, 8 décorations).
// Le renderer échoue bruyamment sur un type hors inventaire — `next build`
// sur les 422 posts sert de test de complétude.

export interface RicosDoc {
  nodes: RicosNode[]
  metadata?: unknown
  documentStyle?: unknown
}

export interface ContainerData {
  alignment?: "LEFT" | "CENTER" | "RIGHT" | string
  textWrap?: boolean
  width?: { size?: string; custom?: string }
  height?: { custom?: string }
  spoiler?: unknown
}

export interface RicosNode {
  type: string
  id?: string
  nodes?: RicosNode[]
  textData?: TextData
  paragraphData?: { textStyle?: TextStyle; indentation?: number }
  headingData?: { level?: number; textStyle?: TextStyle; indentation?: number }
  bulletedListData?: { indentation?: number }
  orderedListData?: { indentation?: number }
  blockquoteData?: { indentation?: number }
  codeBlockData?: { textStyle?: TextStyle }
  captionData?: { textStyle?: TextStyle }
  dividerData?: {
    lineStyle?: string
    width?: "LARGE" | "MEDIUM" | "SMALL" | string
    alignment?: string
    containerData?: ContainerData
  }
  imageData?: {
    image?: { src?: { url?: string; id?: string }; width?: number; height?: number }
    altText?: string
    caption?: string
    link?: RicosLink
    containerData?: ContainerData
  }
  videoData?: {
    video?: { src?: { url?: string; id?: string } }
    thumbnail?: { src?: { url?: string } }
    containerData?: ContainerData
  }
  galleryData?: {
    items?: Array<{ image?: { media?: { src?: { url?: string }; width?: number; height?: number } } }>
    containerData?: ContainerData
  }
  linkPreviewData?: {
    link?: RicosLink
    title?: string
    description?: string
    thumbnailUrl?: string
    containerData?: ContainerData
  }
  buttonData?: {
    text?: string
    styles?: { backgroundColor?: string; borderColor?: string; textColor?: string }
    link?: RicosLink
    containerData?: ContainerData
  }
  htmlData?: {
    html?: string
    /** Embed distant sans markup inline (ex. replay TF1) — cf. ricos-to-pm. */
    url?: string
    source?: string
    containerData?: ContainerData
  }
  fileData?: {
    name?: string
    path?: string
    sizeInKb?: string
    type?: string
    src?: { id?: string }
  }
  layoutData?: {
    gap?: number
    cellPadding?: number[]
    background?: { type?: string; color?: string }
    borderWidth?: number
    borderColor?: string
  }
  layoutCellData?: { colSpan?: number }
  tableData?: {
    dimensions?: { colsWidthRatio?: number[]; rowsHeight?: number[]; colsMinWidth?: number[] }
    cellPadding?: unknown
  }
  tableCellData?: { cellStyle?: { verticalAlignment?: string; backgroundColor?: string }; borderColors?: unknown }
  collapsibleListData?: { initialExpandedItems?: string; direction?: string }
}

export interface TextData {
  text?: string
  decorations?: RicosDecoration[]
}

export interface TextStyle {
  textAlignment?: "AUTO" | "LEFT" | "CENTER" | "RIGHT" | "JUSTIFY" | string
  lineHeight?: string
}

export interface RicosLink {
  url?: string
  target?: "BLANK" | "SELF" | string
  rel?: { nofollow?: boolean; sponsored?: boolean; ugc?: boolean }
  anchor?: string
}

export interface RicosDecoration {
  type: string
  linkData?: { link?: RicosLink }
  colorData?: { foreground?: string; background?: string }
  fontSizeData?: { unit?: string; value?: number }
  anchorData?: { anchor?: string }
  fontWeightValue?: number
  italicData?: boolean
  underlineData?: boolean
}
