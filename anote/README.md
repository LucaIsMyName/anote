# anote

`anote`is a note taking and documentation app in ReactJs and Typescript.

## use
1. open the `anote` folder and
2. run `npm run dev`
3. select a folder on you Computer
4. Create Pages and insert Blocks in these Pages

`anote` stored the Pages as folder in your selected Project Folder and insert index.md file to every Folder with the Blocks Metadata and Content

## features

- `headings` and `paragraph`
- `tp-do` lists
- `image` upload
- `file` upload
- `table` support

## to do

### bugs
- bug: storing and displaying inline md work but it get's saved as `html` inside MD ...(eg `<em>` tags instead of `*...*`)
- bug: make drag/drop work on `<Sidebar />`
- bug: fix `<ImageBlock />` if nothing is uplaoded on initial insert of block

### features 
- feature: add relative times (for Created at: Last Week, Last Edited: Today) via date npm package
- feature/change: `<Suspense />` and placeholde content before `<Sidebar />` and `<ContentEditor />` are loaded
- feature (unsure): add `<DataBlock />` with tables framework, store them as JSON inside the and retrieve JSON from there instead of MD table 
- feature: `<TodoBlock />` -> add first item on newly created empty list automatically! -> focus and select the word!
- feature: implement hit "Enter" on `<ParagraphBlock />`, `<HeadingBlock />`, `<ImageBlock />`, `<TableBlock />` or any other Text based inputs Components
- feature: implement arrow up/down buttons to move `<BlockWrapper />` step by step up/down the List (optional instead of dragging which can act buggy)
- feature: loading spinner (eg `<Suspense />` ?) for `<Sidebar />` and `<ContentEditor />` until content is fully loaded
- feature: multiple `workspaces` support and drop-down nav on anote > workspace header (where to store workspaces infos? in localStorage?)
- feature: store workspace infos in seperate md file of root folder, eg: `_anote-settings.md`or `anote.settings.json` and retrieve from there instead of localStorage
  - `anote_current_page` -> string
  - `anote_expanded_paths` -> Object
  - `sidebar_open` -> boolean
  - `sidebar_width` -> number
  - `table-{id}-headers` -> Array
  - `table-{id}-widths` -> Array
- feature: `CanvasBlock` with mermaid support (`https://mermaid.js.org/`)
- feature: to give a block a due date?
- feature: `<CalendarBlock />`?