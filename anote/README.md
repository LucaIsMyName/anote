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

- bug: storing and displaying inline md work but it get's saved as `html` inside MD ...
- bug: `<SwitchableEditor />` for `<ParagraphBlock />` and `<HeadingBlock />` jumping around on keystrokes and making a '.' when hitting spacebar 2 times
- feature (unsure): add `<DataBlock />` with tables framework, store them as JSON inside the and retrieve JSON from there instead of MD table 
- feature: `<TodoBlock />` -> add first item on newly created empty list automatically! -> focus and select the word!
- feature: implement hit "Enter" on `<ParagraphBlock />`, `<HeadingBlock />`, `<ImageBlock />`, `<TableBlock />` or any other Text based inputs Components
- feature: implement arrow up/down buttons to move `<BlockWrapper />` step by step up/down the List (optional instead of dragging which can act buggy)
- bug: make drag blocks work smoother on `<BlockWrapper />` & `<ContentEditor />`
- bug: make drag/drop work on `<Sidebar />`
- bug: make `<FileBlock />` store and retrieve from/to MD file (like image!)
- bug: fix `<ImageBlock />` if nothing is uplaoded on initial insert of block
- bug: when resizing the `<Sidebar />` it doesnt resize the height of `<Textarea />` comoponent (so `<Textarea />` have cut-off lines or too much space on bottom)