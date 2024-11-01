import JSZip from "jszip";
import { WorkspaceService } from "./WorkspaceService.ts";
import { FileService } from "./FileService.ts";

// Workspace JSON format
interface ANoteWorkspace {
  version: string;
  metadata: {
    name: string;
    createdAt: string;
    lastModified: string;
    pageCount: number;
  };
  pages: ANotePage[];
}

// Page JSON format
interface ANotePage {
  id: string;
  path: string;
  metadata: {
    title: string;
    createdAt: string;
    lastEdited: string;
    tags: string[];
  };
  blocks: {
    id: number;
    type: string;
    content?: string;
    level?: number;
    items?: Array<{
      id: number;
      text: string;
      completed?: boolean;
    }>;
    src?: string;
    caption?: string;
    data?: Array<Array<string>>;
    language?: string;
    isMultiline?: boolean;
    listType?: "unordered" | "ordered" | "todo";
  }[];
  children?: ANotePage[];
}

export class ImportExportService {
  static async exportWorkspaceToJson(workspace: string): Promise<ANoteWorkspace> {
    const pages = await FileService.listPages(workspace);
    const pageData = await this.getAllPagesData(workspace, pages);

    return {
      version: "1.0.0",
      metadata: {
        name: workspace.split("/").pop() || "anote-workspace",
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        pageCount: pageData.length,
      },
      pages: pageData,
    };
  }

  static async importWorkspaceFromJson(json: ANoteWorkspace, targetHandle: FileSystemDirectoryHandle): Promise<boolean> {
    try {
      // Validate JSON format
      if (!json.version || !json.pages) throw new Error("Invalid workspace format");

      // Create workspace structure
      await WorkspaceService.createWorkspaceStructure(targetHandle);

      // Import all pages
      for (const page of json.pages) {
        await this.importPageFromJson(targetHandle, page);
      }

      return true;
    } catch (error) {
      console.error("Error importing workspace:", error);
      return false;
    }
  }

  static async exportPageToJson(workspace: string, path: string): Promise<ANotePage> {
    const { blocks, metadata } = await FileService.readPage(workspace, path);
    return {
      id: metadata.id,
      path,
      metadata,
      blocks,
    };
  }

  static async exportPageToMd(workspace: string, path: string): Promise<string> {
    const { blocks } = await FileService.readPage(workspace, path);

    // Convert blocks to clean markdown without metadata
    let markdown = "";

    for (const block of blocks) {
      switch (block.type) {
        case "heading":
          markdown += `${"#".repeat(block.level || 1)} ${block.content}\n\n`;
          break;
        case "paragraph":
          markdown += `${block.content}\n\n`;
          break;
        case "list":
          if (block.items) {
            block.items.forEach((item, index) => {
              switch (block.listType) {
                case "ordered":
                  markdown += `${index + 1}. ${item.text}\n`;
                  break;
                case "todo":
                  markdown += `- [${item.completed ? "x" : " "}] ${item.text}\n`;
                  break;
                default:
                  markdown += `- ${item.text}\n`;
              }
            });
            markdown += "\n";
          }
          break;
        case "code":
          if (block.isMultiline) {
            markdown += `\`\`\`${block.language || ""}\n${block.content}\n\`\`\`\n\n`;
          } else {
            markdown += `\`${block.content}\`\n\n`;
          }
          break;
        // Add other block types as needed
      }
    }

    return markdown.trim();
  }

  private static async getAllPagesData(workspace: string, pages: any[], parentPath = ""): Promise<ANotePage[]> {
    const results = [];

    for (const page of pages) {
      const path = parentPath ? `${parentPath}/${page.name}` : page.name;
      const pageData = await this.exportPageToJson(workspace, path);

      if (page.children?.length > 0) {
        pageData.children = await this.getAllPagesData(workspace, page.children, path);
      }

      results.push(pageData);
    }

    return results;
  }

  private static async importPageFromJson(workspace: FileSystemDirectoryHandle, page: ANotePage) {
    await FileService.writePage(workspace, page.path, page.blocks, page.metadata);

    if (page.children?.length > 0) {
      for (const child of page.children) {
        await this.importPageFromJson(workspace, child);
      }
    }
  }
}

export default ImportExportService;