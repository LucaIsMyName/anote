import matter from "gray-matter";
import { marked } from "marked";
import { v4 as uuidv4 } from "uuid";

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

interface PageMetadata {
  id: string;
  title: string;
  createdAt: string;
  lastEdited: string;
  tags: string[];
}

export class FileService {
  static async movePage(dirHandle: string, sourcePath: string, targetPath: string) {
    try {
      // Don't move if source and target are the same
      if (sourcePath === targetPath) return;

      // Create target directory structure
      const targetParts = targetPath.split("/").filter(Boolean);
      let currentHandle = dirHandle;
      for (let i = 0; i < targetParts.length - 1; i++) {
        currentHandle = await currentHandle.getDirectoryHandle(targetParts[i], { create: true });
      }

      // Copy content to new location
      await this.copyDirectory(await this.getDirectoryHandle(dirHandle, sourcePath), await this.getDirectoryHandle(dirHandle, targetPath));

      // Delete old location
      await this.deletePage(dirHandle, sourcePath);

      return true;
    } catch (error) {
      console.error("Error moving page:", error);
      throw error;
    }
  }

  static async findPagePathById(dirHandle: string, pageId: string): Promise<string | null> {
    const searchDirectory = async (handle: FileSystemDirectoryHandle, path = ""): Promise<string | null> => {
      for await (const entry of handle.values()) {
        if (entry.name === "assets" || entry.name.startsWith(".")) continue;

        if (entry.kind === "directory") {
          try {
            const fileHandle = await entry.getFileHandle("index.md");
            const file = await fileHandle.getFile();
            const content = await file.text();

            const pageMetadataMatch = content.match(/<page-metadata>([\s\S]*?)<\/page-metadata>/);
            if (pageMetadataMatch) {
              const metadata = JSON.parse(pageMetadataMatch[1]);
              if (metadata.id === pageId) {
                return path ? `${path}/${entry.name}` : entry.name;
              }
            }

            // Search recursively
            const nestedPath = path ? `${path}/${entry.name}` : entry.name;
            const result = await searchDirectory(entry, nestedPath);
            if (result) return result;
          } catch (error) {
            continue;
          }
        }
      }
      return null;
    };

    return searchDirectory(dirHandle);
  }
  /**
   *
   * @param {string} dirHandle
   * @param {string} path
   * @param {Array<any>} blocks
   */
  static async writeMarkdownFile(dirHandle: string, path: string, blocks: Block[]) {
    try {
      // Convert blocks to markdown with front matter
      const metadata = {
        title: path.split("/").pop(),
        createdAt: new Date().toISOString(),
        lastEdited: new Date().toISOString(),
        tags: ["general"],
      };

      let content = "";
      for (const block of blocks) {
        content += `\n::: block ${JSON.stringify({
          type: block.type,
          id: block.id,
          createdAt: block.createdAt,
          lastEdited: new Date().toISOString(),
        })}\n`;

        switch (block.type) {
          case "heading":
            content += `${"#".repeat(block.level || 1)} ${block.content}\n`;
            break;
          case "paragraph":
            content += `${block.content}\n`;
            break;
          case "todo":
            content += block.items?.map((item) => `- [${item.completed ? "x" : " "}] ${item.text}`).join("\n") + "\n";
            break;
          case "table":
            if (block.data?.length) {
              content += block.data.map((row) => `| ${row.join(" | ")} |`).join("\n") + "\n";
            }
            break;
          case "image":
            content += `![${block.caption || ""}](${block.src})\n`;
            break;
          case "file":
            content += `[FILE_BLOCK]![${block.caption || ""}](${block.data})[/FILE_BLOCK]\n`;
        }
        content += ":::\n";
      }

      // Create markdown with front matter
      const markdown = matter.stringify(content, metadata);

      // Save to file
      const pathParts = path.split("/").filter(Boolean);
      let currentHandle = dirHandle;
      for (let i = 0; i < pathParts.length - 1; i++) {
        currentHandle = await currentHandle.getDirectoryHandle(pathParts[i], { create: true });
      }

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
  static async readMarkdownFile(dirHandle: string, path: string) {
    try {
      const pathParts = path.split("/").filter(Boolean);
      let currentHandle = dirHandle;

      for (let i = 0; i < pathParts.length - 1; i++) {
        currentHandle = await currentHandle.getDirectoryHandle(pathParts[i]);
      }

      const fileName = `${pathParts[pathParts.length - 1]}.md`;
      const fileHandle = await currentHandle.getFileHandle(fileName);
      const file = await fileHandle.getFile();
      const content = await file.text();

      // Parse front matter and content
      const { data: metadata, content: markdownContent } = matter(content);

      // Parse blocks
      const blocks: Block[] = [];
      let currentBlock: any = null;

      const blockRegex = /^:::[\s]*block[\s]*(.*?)$([\s\S]*?)^:::$/gm;
      let match;

      while ((match = blockRegex.exec(markdownContent)) !== null) {
        try {
          const blockMetadata = JSON.parse(match[1]);
          const blockContent = match[2].trim();

          const block = {
            id: blockMetadata.id,
            type: blockMetadata.type,
            createdAt: blockMetadata.createdAt,
            lastEdited: blockMetadata.lastEdited,
          };

          // Parse block content based on type
          switch (block.type) {
            case "heading":
              const headingMatch = blockContent.match(/^(#{1,6})\s+(.+)$/);
              if (headingMatch) {
                block.level = headingMatch[1].length;
                block.content = headingMatch[2];
              }
              break;
            case "paragraph":
              block.content = blockContent;
              break;
            case "todo":
              block.items = blockContent
                .split("\n")
                .map((line) => {
                  const todoMatch = line.match(/^-\s*\[([ x])\]\s*(.+)$/);
                  return todoMatch
                    ? {
                        id: Date.now() + Math.random(),
                        completed: todoMatch[1] === "x",
                        text: todoMatch[2],
                      }
                    : null;
                })
                .filter(Boolean);
              break;
            case "table":
              block.data = blockContent.split("\n").map((row) =>
                row
                  .replace(/^\||\|$/g, "")
                  .split("|")
                  .map((cell) => cell.trim())
              );
              break;
            case "image":
              const imageMatch = blockContent.match(/!\[(.*?)\]\((.*?)\)/);
              if (imageMatch) {
                block.caption = imageMatch[1];
                block.src = imageMatch[2];
              }
              break;

            case "file":
              const fileMatch = blockContent.match(/\[FILE_BLOCK\]!\[(.*?)\]\((.*?)\)\[\/FILE_BLOCK\]/);
              if (fileMatch) {
                block.caption = fileMatch[1];
                block.data = fileMatch[2];
              }
              break;
          }

          blocks.push(block);
        } catch (error) {
          console.error("Error parsing block:", error);
        }
      }

      return { blocks, metadata };
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
  // In FileService.ts, modify parseMarkdownToBlocks and writePage

  static async parseMarkdownToBlocks(markdown: string) {
    if (!markdown) return { blocks: [], metadata: null };

    const blocks: Block[] = [];
    let pageMetadata = null;

    const pageMetadataMatch = markdown.match(/<page-metadata>([\s\S]*?)<\/page-metadata>/);
    if (pageMetadataMatch) {
      try {
        pageMetadata = JSON.parse(pageMetadataMatch[1]);
      } catch (e) {
        console.error("Error parsing page metadata:", e);
      }
    }

    const blockSections = markdown.split("<block-metadata>");

    for (let i = 1; i < blockSections.length; i++) {
      const section = blockSections[i];
      const metadataEndIndex = section.indexOf("</block-metadata>");

      if (metadataEndIndex === -1) continue;

      try {
        const metadata = JSON.parse(section.substring(0, metadataEndIndex));
        let content = section.substring(metadataEndIndex + 16).trim();

        if (metadata.type === "heading") {
          // Remove all markdown heading markers and clean content
          const cleanContent = content
            .replace(/^#{1,6}\s+/, "")
            .replace(/^>+\s*/, "")
            .trim();
          blocks.push({
            ...metadata,
            content: cleanContent,
            level: metadata.level || 2, // Use metadata level or default to 2
          });
        } else if (metadata.type === "image") {
          const imgMatch = content.match(/!\[(.*?)\]\((.*?)\)/);
          if (imgMatch) {
            blocks.push({
              ...metadata,
              caption: imgMatch[1],
              src: imgMatch[2],
            });
          }
        } else if (metadata.type === "todo") {
          // Parse todo items
          const items = content.split("\n").map((line) => {
            const todoMatch = line.match(/^-\s*\[([ x])\]\s*(.+)$/);
            return todoMatch
              ? {
                  id: Date.now() + Math.random(),
                  completed: todoMatch[1] === "x",
                  text: todoMatch[2],
                }
              : null;
          });
          blocks.push({
            ...metadata,
            items: items.filter(Boolean),
          });
        } else if (metadata.type === "table") {
          // Parse table data
          const cleanLines = content
            .split("\n")
            .filter((line) => line.trim() && !line.match(/^\|?\s*>\s*\|?$/))
            .map((line) => line.replace(/^>+\s*/, "").trim());

          if (cleanLines.length > 0) {
            // Filter out separator rows (containing only dashes)
            const dataRows = cleanLines.filter((row) => !row.match(/^\|?\s*[-|]+\s*\|?$/));
            const data = dataRows.map((row) =>
              row
                .replace(/^\||\|$/g, "") // Remove leading/trailing pipes
                .split("|")
                .map((cell) => cell.trim())
            );

            blocks.push({
              ...metadata,
              data,
            });
          }
        } else {
          // Handle other block types
          blocks.push({
            ...metadata,
            content: content.replace(/^>+\s*/, "").trim(),
            level: undefined,
            items: metadata.type === "todo" ? [] : undefined,
            data: metadata.type === "table" ? [] : undefined,
          });
        }
      } catch (e) {
        console.error("Error parsing block metadata:", e);
      }
    }

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
      const pathParts = path.split("/").filter(Boolean);
      if (pathParts.includes("assets")) {
        throw new Error('Cannot create a page named "assets"');
      }

      let currentHandle = dirHandle;
      for (const part of pathParts) {
        currentHandle = await currentHandle.getDirectoryHandle(part, { create: true });
      }

      const timestamp = new Date().toISOString();
      const pageId = uuidv4(); // Generate unique ID

      const pageMetadata = {
        id: pageId,
        title: pathParts[pathParts.length - 1],
        createdAt: timestamp,
        lastEdited: timestamp,
        tags: ["general"],
      };

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

      await this.writePage(dirHandle, path, initialBlocks, pageMetadata);
      return pageId;
    } catch (error) {
      console.error("Error creating page:", error);
      throw error;
    }
  }

  static async readPage(dirHandle: string, path: string) {
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

      for (const part of pathParts) {
        currentHandle = await currentHandle.getDirectoryHandle(part);
      }

      const fileHandle = await currentHandle.getFileHandle("index.md");
      const file = await fileHandle.getFile();
      const content = await file.text();

      return this.parseMarkdownToBlocks(content);
    } catch (error) {
      console.error("Error reading page:", error);
      throw error;
    }
  }

  static async writePage(dirHandle: string, path: string, blocks: Block[], metadata = null) {
    try {
      if (!path) return false;

      const pathParts = path.split("/").filter(Boolean);
      let currentHandle = dirHandle;

      for (const part of pathParts) {
        currentHandle = await currentHandle.getDirectoryHandle(part, { create: true });
      }

      const metadataToWrite = metadata || {
        createdAt: new Date().toISOString(),
        lastEdited: new Date().toISOString(),
      };

      let content = `<page-metadata>\n${JSON.stringify(metadataToWrite, null, 2)}\n</page-metadata>\n\n`;

      if (Array.isArray(blocks)) {
        for (const block of blocks) {
          const blockMetadata = {
            type: block.type,
            id: block.id,
            level: block.type === "heading" ? block.level : undefined, // Include level in metadata
            createdAt: block.createdAt || new Date().toISOString(),
            lastEdited: new Date().toISOString(),
          };

          content += `<block-metadata>${JSON.stringify(blockMetadata)}</block-metadata>\n`;

          switch (block.type) {
            case "heading":
              // Don't add markdown markers here - just the clean content
              content += `${block.content || ""}\n\n`;
              break;
            case "paragraph":
              content += `${block.content || ""}\n\n`;
              break;
            case "image":
              content += `![${block.caption || ""}](${block.src})\n\n`;
              break;
            case "todo":
              if (block.items && Array.isArray(block.items)) {
                content += block.items.map((item) => `- [${item.completed ? "x" : " "}] ${item.text}`).join("\n") + "\n\n";
              }
              break;
            case "table":
              if (block.data?.length > 0) {
                // Add data rows without any extra formatting
                const tableContent = block.data.map((row) => `| ${row.join(" | ")} |`).join("\n");
                content += `${tableContent}\n\n`;
              }
              break;
          }
        }
      }

      const fileHandle = await currentHandle.getFileHandle("index.md", { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();

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

  static async createInitialPage(dirHandle: string) {
    const initialPage = {
      title: "Welcome to Your Workspace",
      createdAt: new Date().toISOString(),
      lastEdited: new Date().toISOString(),
      id: uuidv4(),
      tags: ["getting-started"],
    };

    const initialBlocks = [
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
