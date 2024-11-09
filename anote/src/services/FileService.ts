import matter from "gray-matter";
import { marked } from "marked";
import { v4 as uuidv4 } from "uuid";

import { BlockReference } from "../components/blocks/user/ReferenceBlock";

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
  language?: string;
  isMultiline?: boolean;
  listType?: "unordered" | "ordered" | "todo";
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
  static async searchBlocks(dirHandle: string, searchTerm: string): Promise<BlockReference[]> {
    const results: BlockReference[] = [];

    // Helper function to search blocks in a page
    const searchPageBlocks = async (pagePath: string, pageTitle: string) => {
      try {
        const { blocks } = await this.readPage(dirHandle, pagePath);

        for (const block of blocks) {
          const blockContent = block.content || "";
          const searchableContent = `${blockContent} ${JSON.stringify(block)}`.toLowerCase();

          if (searchableContent.includes(searchTerm.toLowerCase())) {
            results.push({
              id: block.id.toString(),
              type: block.type,
              content: block.content,
              pageId: pagePath,
              pagePath: pagePath,
              pageTitle: pageTitle,
              createdAt: block.createdAt,
              lastEdited: block.lastEdited,
            });
          }
        }
      } catch (error) {
        console.error(`Error searching in page ${pagePath}:`, error);
      }
    };

    // Recursive function to search through directory structure
    const searchDirectory = async (currentPath = "") => {
      try {
        let handle = dirHandle;

        // Navigate to current directory if not at root
        if (currentPath) {
          const pathParts = currentPath.split("/");
          for (const part of pathParts) {
            handle = await handle.getDirectoryHandle(part);
          }
        }

        // List all entries in current directory
        for await (const entry of handle.values()) {
          // Skip assets directory and hidden files
          if (entry.name === "assets" || entry.name.startsWith(".")) continue;

          if (entry.kind === "directory") {
            const newPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;

            try {
              // Check if this directory is a page (has index.md)
              await entry.getFileHandle("index.md");
              await searchPageBlocks(newPath, entry.name);
            } catch (error) {
              // If no index.md, just skip searching this directory as a page
              console.debug(`No index.md found in ${newPath}`);
            }

            // Recursively search subdirectories regardless of whether they're pages
            await searchDirectory(newPath);
          }
        }
      } catch (error) {
        console.error(`Error searching directory ${currentPath}:`, error);
      }
    };

    await searchDirectory();
    return results;
  }

  static async getBlockReference(dirHandle: string, referenceId: string): Promise<BlockReference | null> {
    // Recursive function to search through directory structure
    const searchDirectory = async (currentPath = ""): Promise<BlockReference | null> => {
      try {
        let handle = dirHandle;

        // Navigate to current directory if not at root
        if (currentPath) {
          const pathParts = currentPath.split("/");
          for (const part of pathParts) {
            handle = await handle.getDirectoryHandle(part);
          }
        }

        // Check current directory for index.md
        try {
          const { blocks } = await this.readPage(dirHandle, currentPath);
          const block = blocks.find((b) => b.id.toString() === referenceId);
          if (block) {
            return {
              id: block.id.toString(),
              type: block.type,
              content: block.content,
              pageId: currentPath,
              pagePath: currentPath,
              pageTitle: currentPath.split("/").pop() || "",
              createdAt: block.createdAt,
              lastEdited: block.lastEdited,
            };
          }
        } catch (error) {
          // If no index.md or error reading page, continue searching
          console.debug(`No index.md found in ${currentPath}`);
        }

        // Search through subdirectories
        for await (const entry of handle.values()) {
          // Skip assets directory and hidden files
          if (entry.name === "assets" || entry.name.startsWith(".")) continue;

          if (entry.kind === "directory") {
            const newPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
            const result = await searchDirectory(newPath);
            if (result) return result;
          }
        }

        return null;
      } catch (error) {
        console.error(`Error searching directory ${currentPath}:`, error);
        return null;
      }
    };

    return searchDirectory();
  }

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

  static transformInlineMarkdownToHtml(markdown: string): string {
    if (!markdown) return "";

    // First preserve spaces by converting multiple spaces to nbsp
    let html = markdown.replace(/  +/g, (match) => "&nbsp;".repeat(match.length));

    // Process markdown with improved patterns that preserve spaces
    const patterns = [
      {
        // Bold with asterisks - preserve spaces around
        pattern: /(\s|^)\*\*([^*]+)\*\*(\s|$)/g,
        replacement: "$1<strong>$2</strong>$3",
      },
      {
        // Bold with asterisks - preserve spaces around
        pattern: /(\s|^)\*\*\*([^*]+)\*\*\*(\s|$)/g,
        replacement: "$1<strong><i>$2</i></strong>$3",
      },
      {
        // Bold with underscores - preserve spaces around
        pattern: /(\s|^)__([^_]+)__(\s|$)/g,
        replacement: "$1<strong>$2</strong>$3",
      },
      {
        // Italic with asterisks - preserve spaces around
        pattern: /(\s|^)\*([^*]+)\*(\s|$)/g,
        replacement: "$1<em>$2</em>$3",
      },
      {
        // Italic with underscores - preserve spaces around
        pattern: /(\s|^)_([^_]+)_(\s|$)/g,
        replacement: "$1<em>$2</em>$3",
      },
      {
        // Inline code - preserve spaces around
        pattern: /(\s|^)`([^`]+)`(\s|$)/g,
        replacement: "$1<code>$2</code>$3",
      },
      {
        // Links - preserve spaces around
        pattern: /(\s|^)\[([^\]]+)\]\(([^)]+)\)(\s|$)/g,
        replacement: '$1<a href="$3" class="text-sky-600 hover:underline">$2</a>$4',
      },
    ];

    // Apply each pattern while preserving spaces
    patterns.forEach(({ pattern, replacement }) => {
      html = html.replace(pattern, replacement);
    });

    // Handle line breaks while preserving spaces
    return html
      .split("\n")
      .map((line) => line || "&nbsp;")
      .join("<br />");
  }

  static transformInlineHtmlToMarkdown(html: string): string {
    if (!html) return "";

    // If it's already markdown or plain text, preserve spaces
    if (!/[<>]/.test(html)) {
      return html.replace(/&nbsp;/g, " ");
    }

    let markdown = html
      // First handle spaces and entities
      .replace(/&nbsp;/g, " ")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");

    // Convert HTML to markdown with improved patterns that preserve spaces
    const conversions = [
      {
        // Line breaks
        pattern: /<br\s*\/?>\s*/g,
        replacement: "\n",
      },
      {
        // Bold - preserve spaces around
        pattern: /(\s|^)<(strong|b)>([^<]*)<\/\2>(\s|$)/g,
        replacement: "$1**$3**$4",
      },
      {
        // Bold & Italic - preserve spaces around
        pattern: /(\s|^)<(strong|b)><i>([^<]*)<\/i><\/\2>(\s|$)/g,
        replacement: "$1***$3***$4",
      },
      {
        // Italic - preserve spaces around
        pattern: /(\s|^)<(em|i)>([^<]*)<\/\2>(\s|$)/g,
        replacement: "$1*$3*$4",
      },
      {
        // Code - preserve spaces around
        pattern: /(\s|^)<code>([^<]*)<\/code>(\s|$)/g,
        replacement: "$1`$2`$3",
      },
      {
        // Links - preserve spaces around
        pattern: /(\s|^)<a[^>]+href="([^"]*)"[^>]*>([^<]*)<\/a>(\s|$)/g,
        replacement: "$1[$3]($2)$4",
      },
    ];

    // Apply conversions while preserving spaces
    conversions.forEach(({ pattern, replacement }) => {
      markdown = markdown.replace(pattern, replacement);
    });

    // Clean up remaining HTML tags while better preserving whitespace
    markdown = markdown
      .replace(/<[^>]+>/g, "")
      .replace(/\s{2,}/g, " ") // Collapse multiple spaces to single space
      .trim();

    return markdown;
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
          case "quote":
            content += `> ${block.content}\n`;
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
            case "quote":
              if (block.content.startsWith(">")) {
                block.content = block.content.replace(">", "");
              }
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
        if (metadata.type === "code") {
          let codeContent = "";
          let language = metadata.language || "javascript";
          let isMultiline = metadata.isMultiline !== false;

          // Extract content between triple backticks, accounting for language specification
          const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/;
          const match = content.match(codeBlockRegex);

          if (match) {
            // If there's a language specified in the markdown, use it
            if (match[1]) {
              language = match[1];
            }
            // Get the actual code content, preserving whitespace but trimming extra newlines
            codeContent = match[2].replace(/^\n+|\n+$/g, "");
          }

          blocks.push({
            ...metadata,
            content: codeContent,
            language,
            isMultiline,
          });
        } else if (metadata.type === "heading") {
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
        } else if (metadata.type === "list") {
          const items = content
            .split("\n")
            .map((line) => {
              let match;
              switch (metadata.listType) {
                case "todo":
                  match = line.match(/^-\s*\[([ x])\]\s*(.+)$/);
                  return match
                    ? {
                        id: Date.now() + Math.random(),
                        text: match[2],
                        completed: match[1] === "x",
                      }
                    : null;
                case "ordered":
                  match = line.match(/^\d+\.\s+(.+)$/);
                  return match
                    ? {
                        id: Date.now() + Math.random(),
                        text: match[1],
                      }
                    : null;
                case "unordered":
                default:
                  match = line.match(/^-\s+(.+)$/);
                  return match
                    ? {
                        id: Date.now() + Math.random(),
                        text: match[1],
                      }
                    : null;
              }
            })
            .filter(Boolean);

          blocks.push({
            ...metadata,
            items,
            listType: metadata.listType || "unordered",
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
        } else if (metadata.type === "file") {
          // Parse file block content
          const fileMatch = content.match(/\[FILE\](.*?)\[\/FILE\]/);
          const captionMatch = content.match(/\[CAPTION\](.*?)\[\/CAPTION\]/);

          if (fileMatch) {
            blocks.push({
              ...metadata,
              src: fileMatch[1],
              caption: captionMatch ? captionMatch[1] : "",
            });
          }
        } else if (metadata.type === "reference") {
          const referenceMatch = content.match(/\[REFERENCE\](.*?)\[\/REFERENCE\]/);
          if (referenceMatch) {
            blocks.push({
              ...metadata,
              referenceId: referenceMatch[1],
            });
          }
        } else if (metadata.type === "quote") {
          const cleanContent = content.replace(/^>\s*/, "").trim();

          // Handle quote blocks
          blocks.push({
            ...metadata,
            content: cleanContent,
          });
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
          let blockMetadata;

          if (block.type === "code") {
            // Special handling for code blocks
            blockMetadata = {
              type: block.type,
              id: block.id,
              createdAt: block.createdAt || new Date().toISOString(),
              lastEdited: new Date().toISOString(),
              language: block.language || "javascript",
              isMultiline: block.isMultiline !== false,
            };
          } else if (block.type === "list") {
            // Special handling for list blocks
            blockMetadata = {
              type: block.type,
              id: block.id,
              createdAt: block.createdAt || new Date().toISOString(),
              lastEdited: new Date().toISOString(),
              listType: block.listType || "unordered", // Include list type in metadata
            };
          } else {
            blockMetadata = {
              type: block.type,
              id: block.id,
              level: block.type === "heading" ? block.level : undefined, // Include level in metadata
              createdAt: block.createdAt || new Date().toISOString(),
              lastEdited: new Date().toISOString(),
            };
          }

          content += `<block-metadata>${JSON.stringify(blockMetadata)}</block-metadata>\n`;

          switch (block.type) {
            case "heading":
              // Don't add markdown markers here - just the clean content
              content += `${block.content || ""}\n\n`;
              break;
            case "paragraph":
              content += `${block.content || ""}\n\n`;
              break;
            case "divider":
              content += `---\n\n`;
              break;
            case "quote":
              // content += `> ${block.content || ""}\n\n`;
              if (block.content?.startsWith(">")) {
                content += `${block.content || ""}\n\n`;
              } else {
                content += `> ${block.content || ""}\n\n`;
              }
              break;
            case "code":
              if (block.isMultiline) {
                content += `\`\`\`${block.language || "javascript"}\n${block.content || ""}\n\`\`\`\n\n`;
              } else {
                content += `\`${block.content || ""}\`\n\n`;
              }
              break;

            case "image":
              content += `![${block.caption || ""}](${block.src})\n\n`;
              break;
            case "list":
              if (block.items && Array.isArray(block.items)) {
                content +=
                  block.items
                    .map((item, index) => {
                      switch (block.listType) {
                        case "todo":
                          return `- [${item.completed ? "x" : " "}] ${item.text}`;
                        case "ordered":
                          return `${index + 1}. ${item.text}`;
                        case "unordered":
                        default:
                          return `- ${item.text}`;
                      }
                    })
                    .join("\n") + "\n\n";
              }
              break;
            case "table":
              if (block.data?.length > 0) {
                // Add data rows without any extra formatting
                const tableContent = block.data.map((row) => `| ${row.join(" | ")} |`).join("\n");
                content += `${tableContent}\n\n`;
              }
              break;
            case "file":
              // Only write file data if it exists and is valid
              if (block.src && block.src !== "undefined") {
                content += `[FILE]${block.src}[/FILE]\n`;
                if (block.caption) {
                  content += `[CAPTION]${block.caption}[/CAPTION]\n`;
                }
              }
              content += "\n";
              break;
            case "reference":
              content += `[REFERENCE]${block.referenceId}[/REFERENCE]\n\n`;
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
          markdown += `${this.transformInlineHtmlToMarkdown(block.content) || ""}\n\n`;
          break;

        case "heading":
          markdown += `${"#".repeat(parseInt(block.level) + 1 || 1)} ${this.transformInlineHtmlToMarkdown(block.content) || ""}\n\n`;
          break;

        case "quote":
          markdown += `> ${this.transformInlineHtmlToMarkdown(block.content) || ""}\n\n`;
          break;

        case "divider":
          markdown += `---\n\n`;
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
