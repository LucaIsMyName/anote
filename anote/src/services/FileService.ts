interface File {
  name: string;
  type: string;
  size: number;
  data: Blob;
}

interface Block {
  id: number;
  type: string;
  content?: string;
  level?: number;
  items?: Array<TodoItem>;
  src?: string;
  caption?: string;
  data?: Array<Array<string>>;
  fileData?: {
    name: string;
    base64: string;
  };
}

interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
}

interface Page {
  blocks: Array<Block>;
  metadata: {
    createdAt: string;
    lastEdited: string;
  };
}

interface PageNode {
  name: string;
  type: string;
  children: Array<PageNode>;
}

export class FileService {
  /**
   *
   * @param {string} dirHandle
   * @param {string} path
   * @param {Array<any>} blocks
   */
  static async writeMarkdownFile(dirHandle: string, path: string, blocks: Block[]) {
    try {
      // Convert blocks to markdown
      let markdown = "";

      for (const block of blocks) {
        switch (block.type) {
          case "heading":
            const level = block.level || 1; // Default to 1 if no level specified
            console.log("Adding heading block:", block.content);
            markdown += `${"#".repeat(level)} ${block.content}\n\n`;
            break;

          case "paragraph":
            markdown += `${block.content}\n\n`;
            break;

          case "todo":
            markdown += block.items?.map((item) => `- [${item.completed ? "x" : " "}] ${item.text}`).join("\n") + "\n\n";
            break;

          case "image":
            if (block.src && block.src.startsWith("data:")) {
              const fileName = `image-${Date.now()}.png`;
              const assetPath = await this.saveAssetFile(dirHandle, fileName, block.src);
              markdown += `![${block.caption || ""}](${assetPath})\n\n`;
            } else if (block.src) {
              markdown += `![${block.caption || ""}](${block.src})\n\n`;
            }
            break;

          case "table":
            if (block.data && block.data.length > 0) {
              markdown += "| " + block.data[0].map(() => "---").join(" | ") + " |\n";
              markdown += block.data.map((row) => "| " + row.map((cell) => cell || "").join(" | ") + " |").join("\n") + "\n\n";
            }
            break;

          case "file":
            if (block.fileData) {
              const { name, base64 } = block.fileData;
              markdown += `[FILE-BLOCK]\n${JSON.stringify({ name, base64 })}\n[/FILE-BLOCK]\n\n`;
            }
            break;
        }
      }

      // Ensure the directory exists
      const pathParts = path.split("/").filter(Boolean);
      let currentHandle = dirHandle;

      // Create directories if they don't exist
      for (let i = 0; i < pathParts.length - 1; i++) {
        currentHandle = await currentHandle.getDirectoryHandle(pathParts[i], { create: true });
      }

      // Create or update the markdown file
      const fileName = `${pathParts[pathParts.length - 1]}.md`;
      const fileHandle = await currentHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(markdown);
      await writable.close();

      return true;
    } catch (error) {
      console.error("Error writing markdown file:", error);
      throw error;
    }
  }

  /**
   *
   * @param {string} dirHandle
   * @param {string} path
   * @returns {Promise<Array<any>>}
   */
  static async readMarkdownFile(dirHandle, path) {
    try {
      // Navigate to the correct directory
      const pathParts = path.split("/").filter(Boolean);
      let currentHandle = dirHandle;

      // Navigate through directories
      for (let i = 0; i < pathParts.length - 1; i++) {
        currentHandle = await currentHandle.getDirectoryHandle(pathParts[i]);
      }

      // Get the file
      const fileName = `${pathParts[pathParts.length - 1]}.md`;
      const fileHandle = await currentHandle.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      const content = await file.text();

      // Parse markdown to blocks (basic implementation)
      const blocks = await this.parseMarkdownToBlocks(content);

      return blocks;
    } catch (error) {
      console.error("Error reading markdown file:", error);
      throw error;
    }
  }

  /**
   *
   * @param {string} dirHandle
   * @param {string} fileName
   * @param {string} dataUrl
   * @returns {Promise<string>}
   * @throws {Error}
   */
  static async saveAssetFile(dirHandle, fileName, dataUrl) {
    try {
      // Get assets directory
      const assetsHandle = await dirHandle.getDirectoryHandle("assets", { create: true });

      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Save file
      const fileHandle = await assetsHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();

      return `/assets/${fileName}`;
    } catch (error) {
      console.error("Error saving asset file:", error);
      throw error;
    }
  }

  /**
   * @param {string} markdown
   * @returns {Array<any>}
   * @throws {Error}
   */
  static async parseMarkdownToBlocks(markdown: string) {
    if (!markdown) return { blocks: [], metadata: null };
  
    const blocks: Block[] = [];
    let pageMetadata = null;
    let currentBlock: any = null;
    let collectingContent = false;
    
    const lines = markdown.split("\n");
    let i = 0;
  
    while (i < lines.length) {
      const line = lines[i].trim();
  
      // Handle metadata/block comments
      if (line.startsWith("<!--")) {
        collectingContent = false; // Stop collecting content when we hit a comment
        let metadataContent = "";
        i++; // Skip opening <!--
  
        // Collect metadata until end of comment
        while (i < lines.length && !lines[i].trim().endsWith("-->")) {
          metadataContent += lines[i];
          i++;
        }
        if (i < lines.length) {
          metadataContent += lines[i].replace("-->", "");
        }
        i++;
  
        try {
          console.log("Parsing metadata:", metadataContent);
          // Extract JSON from the metadata content
          const jsonStart = metadataContent.indexOf('{');
          const jsonEnd = metadataContent.lastIndexOf('}') + 1;
          if (jsonStart !== -1 && jsonEnd > jsonStart) {
        
            const metadata = JSON.parse(metadataContent.substring(jsonStart, jsonEnd));
            console.log("Parsed metadata:", metadata);
            if (metadata.type) {
              // If we had a previous block, save it
              if (currentBlock && currentBlock.content) {
                blocks.push({...currentBlock});
              }
  
              // Start new block
              currentBlock = {
                id: metadata.id,
                type: metadata.type,
                createdAt: metadata.createdAt,
                lastEdited: metadata.lastEdited,
                content: "",
                level: metadata.type === "heading" ? 1 : undefined,
                items: metadata.type === "todo" ? [] : undefined,
                data: metadata.type === "table" ? [] : undefined,
              };
              collectingContent = true; // Start collecting content for the new block
            } else {
              pageMetadata = metadata;
            }
          }
        } catch (e) {
          console.error("Error parsing metadata:", e);
        }
        continue;
      }
  
      // Handle block content
      if (currentBlock && collectingContent && line !== "") {
        switch (currentBlock.type) {
          case "paragraph":
            currentBlock.content = currentBlock.content ? 
              `${currentBlock.content}\n${line}` : line;
            break;
  
          case "heading":
            const match = line.match(/^(#{1,6})\s+(.+)$/);
            if (match) {
              currentBlock.level = match[1].length;
              currentBlock.content = match[2];
            }
            break;
  
          case "todo":
            const todoMatch = line.match(/^-\s*\[([ x])\]\s*(.+)$/);
            if (todoMatch) {
              if (!currentBlock.items) currentBlock.items = [];
              currentBlock.items.push({
                id: Date.now() + Math.random(),
                completed: todoMatch[1] === "x",
                text: todoMatch[2]
              });
            }
            break;
  
          case "table":
            if (line.startsWith("|") && !line.includes("---")) {
              if (!currentBlock.data) currentBlock.data = [];
              const cells = line
                .split("|")
                .slice(1, -1)
                .map(cell => cell.trim());
              currentBlock.data.push(cells);
            }
            break;

        case "file":
          const fileMatch = line.match(/^\[FILE-BLOCK\]({.*})\[\/FILE-BLOCK\]$/);
          if (fileMatch) {
            try {
              const { name, base64 } = JSON.parse(fileMatch[1]);
              currentBlock.fileData = { name, base64 };
            } catch (e) {
              console.error("Error parsing file block:", e);
            }
          }
          break;
        case "image": 
          const imageMatch = line.match(/^!\[(.*)\]\((.*)\)$/);
          if (imageMatch) {
            currentBlock.src = imageMatch[2];
            currentBlock.caption = imageMatch[1];
          }
        }
      }
  
      i++;
    }
  
    // Don't forget the last block
    if (currentBlock && (currentBlock.content || currentBlock.items?.length || currentBlock.data?.length)) {
      blocks.push({...currentBlock});
    }
  
    console.log("Parsed blocks:", blocks);
    return { blocks, metadata: pageMetadata };
  }

  static async saveFile(dirHandle, file) {
    try {
      // Get assets directory
      const assetsHandle = await dirHandle.getDirectoryHandle("assets", { create: true });

      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;

      // Save file to assets
      const fileHandle = await assetsHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(file.data);
      await writable.close();

      return {
        name: file.name,
        type: file.type,
        size: file.size,
        path: `/assets/${fileName}`,
      };
    } catch (error) {
      console.error("Error saving file:", error);
      throw error;
    }
  }

  static async createPage(dirHandle: string, path: string) {
    try {
      // Prevent creation of "assets" folder as a page
      const pathParts = path.split("/").filter(Boolean);
      if (pathParts.includes("assets")) {
        throw new Error('Cannot create a page named "assets"');
      }

      let currentHandle = dirHandle;
      // Create directory path
      for (const part of pathParts) {
        currentHandle = await currentHandle.getDirectoryHandle(part, { create: true });
      }

      const timestamp = new Date().toISOString();

      // Create initial page metadata
      const pageMetadata = {
        title: pathParts[pathParts.length - 1],
        createdAt: timestamp,
        lastEdited: timestamp,
        tags: ["general"],
      };

      // Create initial blocks with metadata
      const initialBlocks = [
        {
          id: Date.now(),
          type: "heading",
          level: 1,
          content: pathParts[pathParts.length - 1],
          createdAt: timestamp,
          lastEdited: timestamp,
        },
        {
          id: Date.now() + 1,
          type: "paragraph",
          content: "Start writing here...",
          createdAt: timestamp,
          lastEdited: timestamp,
        },
      ];

      // Write the page with metadata and blocks
      await this.writePage(dirHandle, path, initialBlocks, pageMetadata);

      return true;
    } catch (error) {
      console.error("Error creating page:", error);
      throw error;
    }
  }

  static async readPage(dirHandle, path) {
    try {
      if (!path) {
        return {
          blocks: [],
          metadata: {
            createdAt: new Date().toISOString(),
            lastEdited: new Date().toISOString(),
          },
        };
      }

      const pathParts = path.split("/").filter(Boolean);
      let currentHandle = dirHandle;

      // Navigate to the page directory
      for (const part of pathParts) {
        currentHandle = await currentHandle.getDirectoryHandle(part);
      }

      // Read index.md from the directory
      const fileHandle = await currentHandle.getFileHandle("index.md");
      const file = await fileHandle.getFile();
      const content = await file.text();

      // Parse the content
      const { blocks, metadata } = await this.parseMarkdownToBlocks(content);

      return {
        blocks: blocks || [],
        metadata: metadata || {
          createdAt: new Date().toISOString(),
          lastEdited: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("Error reading page:", error);
      throw error;
    }
  }

  static async writePage(dirHandle, path, blocks, metadata = null) {
    try {
      if (!path) return false;

      const pathParts = path.split("/").filter(Boolean);
      let currentHandle = dirHandle;

      for (const part of pathParts) {
        currentHandle = await currentHandle.getDirectoryHandle(part, { create: true });
      }

      // Write page metadata
      const metadataToWrite = metadata || {
        createdAt: new Date().toISOString(),
        lastEdited: new Date().toISOString(),
      };

      let fullContent = `<!--\n${JSON.stringify(metadataToWrite, null, 2)}\n-->\n\n`;

      // Add each block with its metadata
      if (Array.isArray(blocks)) {
        console.log("Writing blocks:", blocks);

        for (const block of blocks) {
          // Add block metadata
          const blockMetadata = {
            type: block.type,
            id: block.id,
            createdAt: block.createdAt || new Date().toISOString(),
            lastEdited: new Date().toISOString(),
          };

          fullContent += `<!--${JSON.stringify(blockMetadata)}-->\n`;

          // Add block content based on type
          switch (block.type) {
            case "paragraph":
              fullContent += `${block.content || ""}\n\n`;
              break;

            case "heading":
              fullContent += `${"#".repeat(block.level || 1)} ${block.content || ""}\n\n`;
              break;

            case "table":
              if (block.data && block.data.length > 0) {
                // Add separator row
                fullContent += "| " + block.data[0].map(() => "---").join(" | ") + " |\n";
                // Add data rows
                fullContent += block.data.map((row) => "| " + row.map((cell) => cell || "").join(" | ") + " |").join("\n") + "\n\n";
              }
              break;

            case "todo":
              if (block.items && Array.isArray(block.items)) {
                fullContent += block.items.map((item) => `- [${item.completed ? "x" : " "}] ${item.text}`).join("\n") + "\n\n";
              }
              break;
            
          }
        }
      }

      // Write to index.md
      const fileHandle = await currentHandle.getFileHandle("index.md", { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(fullContent);
      await writable.close();

      console.log("Wrote content:", fullContent);
      return true;
    } catch (error) {
      console.error("Error writing page:", error);
      throw error;
    }
  }

  static async listPages(dirHandle: string, path = "") {
    try {
      const pages = [];
      let currentHandle = dirHandle;

      // Navigate to the correct directory if path is provided
      if (path) {
        const pathParts = path.split("/").filter(Boolean);
        for (const part of pathParts) {
          currentHandle = await currentHandle.getDirectoryHandle(part);
        }
      }

      // List all entries
      for await (const entry of currentHandle.values()) {
        // Skip assets directory and system files
        if (entry.name === "assets" || entry.name.startsWith(".")) continue;

        if (entry.kind === "directory") {
          // Check if directory has index.md
          try {
            await entry.getFileHandle("index.md");
            // Recursively get children
            const children = await this.listPages(currentHandle, entry.name);
            pages.push({
              name: entry.name,
              type: "directory",
              children,
            });
          } catch {
            // Skip directories without index.md
            continue;
          }
        }
      }

      return pages.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error("Error listing pages:", error);
      throw error;
    }
  }

  static blocksToMarkdown(blocks: Block[], pageMetadata: any = null) {
    if (!Array.isArray(blocks)) return "";

    let markdown = "";

    // Add page metadata
    if (pageMetadata) {
      // Use compact JSON formatting for metadata
      const metadataStr = JSON.stringify(pageMetadata);
      markdown += `<!--${metadataStr}-->\n\n`;
    }

    // Convert each block with its metadata
    for (const block of blocks) {
      const blockMetadata = {
        type: block.type,
        id: block.id,
        createdAt: block.createdAt || new Date().toISOString(),
        lastEdited: new Date().toISOString(),
      };

      // Use compact JSON formatting for block metadata
      const metadataStr = JSON.stringify(blockMetadata);
      markdown += `<!--${metadataStr}-->\n`;

      // Add block content
      switch (block.type) {
        case "paragraph":
          markdown += `${block.content || ""}\n\n`;
          break;

        case "heading":
          markdown += `${"#".repeat(block.level || 1)} ${block.content || ""}\n\n`;
          break;

        case "todo":
          if (block.items && Array.isArray(block.items)) {
            markdown += block.items.map((item) => `- [${item.completed ? "x" : " "}] ${item.text}`).join("\n") + "\n\n";
          }
          break;

        case "table":
          if (block.data && block.data.length > 0) {
            markdown += block.data.map((row) => "| " + row.map((cell) => cell || "").join(" | ") + " |").join("\n") + "\n\n";
          }
          break;

        case "image":
          if (block.src) {
            markdown += `![${block.caption || ""}](${block.src})\n\n`;
          }
          break;
        case "file":
          if (block.src) {
            markdown += `[FILE_BLOCK]![${block.caption || ""}](${block.src})[/FILE_BLOCK]\n\n`;
          }
          break;
      }
    }

    return markdown;
  }

  static async deletePage(dirHandle, path) {
    try {
      const pathParts = path.split("/").filter(Boolean);
      let parentHandle = dirHandle;

      // Navigate to parent directory
      for (let i = 0; i < pathParts.length - 1; i++) {
        parentHandle = await parentHandle.getDirectoryHandle(pathParts[i]);
      }

      // Remove the directory recursively
      await parentHandle.removeEntry(pathParts[pathParts.length - 1], { recursive: true });

      // Check if this was a root-level page
      if (pathParts.length === 1) {
        // If it was in the root, ensure there's still at least one page
        return await this.ensureRootHasPage(dirHandle);
      }

      return null;
    } catch (error) {
      console.error("Error deleting page:", error);
      throw error;
    }
  }

  static async renamePage(dirHandle: string, oldPath: string, newName: string) {
    try {
      const pathParts = oldPath.split("/").filter(Boolean);
      const newPath = [...pathParts.slice(0, -1), newName].join("/");

      // First, create the new directory structure
      await this.createPage(dirHandle, newPath);

      // Copy all content from old to new
      await this.copyDirectory(await this.getDirectoryHandle(dirHandle, oldPath), await this.getDirectoryHandle(dirHandle, newPath));

      // Delete the old directory
      const result = await this.deletePage(dirHandle, oldPath);

      // If result is not null, it means a new initial page was created
      // In this case, we should keep the renamed page instead
      if (result) {
        await this.deletePage(dirHandle, result);
      }

      return newPath;
    } catch (error) {
      console.error("Error renaming page:", error);
      throw error;
    }
  }

  static async copyDirectory(sourceDir: string, targetDir: string) {
    for await (const entry of sourceDir.values()) {
      if (entry.kind === "file") {
        const file = await entry.getFile();
        const writer = await targetDir.getFileHandle(entry.name, { create: true });
        const writable = await writer.createWritable();
        await writable.write(await file.arrayBuffer());
        await writable.close();
      } else if (entry.kind === "directory") {
        const newDir = await targetDir.getDirectoryHandle(entry.name, { create: true });
        await this.copyDirectory(await sourceDir.getDirectoryHandle(entry.name), newDir);
      }
    }
  }

  static async getDirectoryHandle(rootHandle: string, path: string) {
    let current = rootHandle;
    const parts = path.split("/").filter(Boolean);
    for (const part of parts) {
      current = await current.getDirectoryHandle(part);
    }
    return current;
  }

  static async movePage(dirHandle: string, sourcePath: string, targetPath: string) {
    try {
      // Create new location
      await this.createPage(dirHandle, targetPath);

      // Copy content
      await this.copyDirectory(await this.getDirectoryHandle(dirHandle, sourcePath), await this.getDirectoryHandle(dirHandle, targetPath));

      // Delete old location and handle potential initial page creation
      const result = await this.deletePage(dirHandle, sourcePath);

      // If result is not null, it means a new initial page was created
      // In this case, we should keep the moved page instead
      if (result) {
        await this.deletePage(dirHandle, result);
      }

      return true;
    } catch (error) {
      console.error("Error moving page:", error);
      throw error;
    }
  }

  static async createInitialPage(dirHandle: string) {
    const initialPage = {
      title: "Welcome",
      createdAt: new Date().toISOString(),
      lastEdited: new Date().toISOString(),
      tags: ["getting-started"],
    };

    const initialBlocks = [
      {
        id: Date.now(),
        type: "heading",
        level: 1,
        content: "Welcome to Your Workspace",
        createdAt: new Date().toISOString(),
        lastEdited: new Date().toISOString(),
      },
      {
        id: Date.now() + 1,
        type: "paragraph",
        content: "This is your first page. Start writing or use the menu to create new pages.",
        createdAt: new Date().toISOString(),
        lastEdited: new Date().toISOString(),
      },
    ];

    try {
      // Create the welcome page
      await this.createPage(dirHandle, "Welcome");
      await this.writePage(dirHandle, "Welcome", initialBlocks, initialPage);
      return "Welcome";
    } catch (error) {
      console.error("Error creating initial page:", error);
      throw error;
    }
  }
  static async ensureRootHasPage(dirHandle: string) {
    try {
      const pages = await this.listPages(dirHandle);
      if (pages.length === 0) {
        return await this.createInitialPage(dirHandle);
      }
      return null;
    } catch (error) {
      console.error("Error ensuring root has page:", error);
      throw error;
    }
  }
}
