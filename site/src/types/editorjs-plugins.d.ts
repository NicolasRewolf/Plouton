declare module "@editorjs/link" {
  import type { ToolConstructable, ToolSettings } from "@editorjs/editorjs"
  const LinkTool: ToolConstructable | ToolSettings
  export default LinkTool
}

declare module "@editorjs/header" {
  import type { ToolConstructable, ToolSettings } from "@editorjs/editorjs"
  const Header: ToolConstructable | ToolSettings
  export default Header
}

declare module "@editorjs/list" {
  import type { ToolConstructable, ToolSettings } from "@editorjs/editorjs"
  const List: ToolConstructable | ToolSettings
  export default List
}

declare module "@editorjs/quote" {
  import type { ToolConstructable, ToolSettings } from "@editorjs/editorjs"
  const Quote: ToolConstructable | ToolSettings
  export default Quote
}

declare module "@editorjs/delimiter" {
  import type { ToolConstructable, ToolSettings } from "@editorjs/editorjs"
  const Delimiter: ToolConstructable | ToolSettings
  export default Delimiter
}

declare module "@editorjs/paragraph" {
  import type { ToolConstructable, ToolSettings } from "@editorjs/editorjs"
  const Paragraph: ToolConstructable | ToolSettings
  export default Paragraph
}
