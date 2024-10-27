export class FileService {
  /**
   * 
   * @param {string} dirHandle 
   * @param {string} path 
   * @param {Array<any>} blocks 
   */
  static async writeMarkdownFile(dirHandle, path, blocks) {
    try {
      // Convert blocks to markdown
      let markdown = '';

      for (const block of blocks) {
        switch (block.type) {
          case 'heading':
            const level = block.level || 1; // Default to 1 if no level specified
            console.log("Adding heading block:", block.content);
            markdown += `${'#'.repeat(level)} ${block.content}\n\n`;
            break;

          case 'paragraph':
            markdown += `${block.content}\n\n`;
            break;

          case 'todo':
            markdown += block.items.map(item =>
              `- [${item.completed ? 'x' : ' '}] ${item.text}`
            ).join('\n') + '\n\n';
            break;

          case 'image':
            if (block.src && block.src.startsWith('data:')) {
              const fileName = `image-${Date.now()}.png`;
              const assetPath = await this.saveAssetFile(dirHandle, fileName, block.src);
              markdown += `![${block.caption || ''}](${assetPath})\n\n`;
            } else if (block.src) {
              markdown += `![${block.caption || ''}](${block.src})\n\n`;
            }
            break;

          case 'table':
            if (block.data && block.data.length > 0) {
              markdown += '| ' + block.data[0].map(() => '---').join(' | ') + ' |\n';
              markdown += block.data.map(row =>
                '| ' + row.map(cell => cell || '').join(' | ') + ' |'
              ).join('\n') + '\n\n';
            }
            break;

          case 'file':
            if (block.fileData) {
              const { name, base64 } = block.fileData;
              markdown += `[FILE-BLOCK]\n${JSON.stringify({ name, base64 })}\n[/FILE-BLOCK]\n\n`;
            }
            break;
        }
      }

      // Ensure the directory exists
      const pathParts = path.split('/').filter(Boolean);
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
      console.error('Error writing markdown file:', error);
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
      const pathParts = path.split('/').filter(Boolean);
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
      console.error('Error reading markdown file:', error);
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
      const assetsHandle = await dirHandle.getDirectoryHandle('assets', { create: true });

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
      console.error('Error saving asset file:', error);
      throw error;
    }
  }

  /**
   * @param {string} markdown
   * @returns {Array<any>}
   * @throws {Error}
   */
  static async parseMarkdownToBlocks(markdown) {
    if (!markdown) return [];

    const blocks = [];
    const lines = markdown.split('\n');
    let currentBlock = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip empty lines unless in a paragraph block
      if (line.trim() === '') {
        if (currentBlock && currentBlock.type === 'paragraph') {
          blocks.push(currentBlock);
          currentBlock = null;
        }
        continue;
      }

      if (line.match(/^#{1,6}\s/)) {
        const level = line.match(/^#{1,6}/)[0].length;
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = {
          id: Date.now() + Math.random(),
          type: 'heading',
          level,
          content: line.replace(/^#{1,6}\s/, '').trim()
        };
        blocks.push(currentBlock);
        currentBlock = null;
      } else if (line.startsWith('- [')) {
        if (!currentBlock || currentBlock.type !== 'todo') {
          if (currentBlock) blocks.push(currentBlock);
          currentBlock = {
            id: Date.now() + Math.random(),
            type: 'todo',
            items: []
          };
        }
        const text = line.substring(5).trim();
        const completed = line[3] === 'x';
        currentBlock.items.push({ id: Date.now() + Math.random(), text, completed });
      } else if (line.startsWith('![')) {
        if (currentBlock) blocks.push(currentBlock);
        const captionEnd = line.indexOf(']');
        const srcStart = line.indexOf('(');
        const srcEnd = line.indexOf(')');
        currentBlock = {
          id: Date.now() + Math.random(),
          type: 'image',
          caption: line.substring(2, captionEnd),
          src: line.substring(srcStart + 1, srcEnd)
        };
        blocks.push(currentBlock);
        currentBlock = null;
      } else if (line.startsWith('|')) {
        if (!currentBlock || currentBlock.type !== 'table') {
          if (currentBlock) blocks.push(currentBlock);
          currentBlock = {
            id: Date.now() + Math.random(),
            type: 'table',
            data: []
          };
        }
        if (!line.includes('---')) {  // Skip table separator line
          const cells = line.split('|')
            .slice(1, -1)  // Remove empty first/last cells
            .map(cell => cell.trim());
          currentBlock.data.push(cells);
        }
      } else if (line.startsWith('[FILE-BLOCK]')) {
        if (currentBlock) blocks.push(currentBlock);
        const end = lines.indexOf('[/FILE-BLOCK]', i);
        const fileData = JSON.parse(lines.slice(i + 1, end).join('\n')); // Parse base64 JSON
        currentBlock = {
          id: Date.now() + Math.random(),
          type: 'file',
          fileData // Attach fileData to display in FileBlock
        };
        i = end;
      } else {
        // Regular text content
        if (!currentBlock || currentBlock.type !== 'paragraph') {
          if (currentBlock) blocks.push(currentBlock);
          currentBlock = {
            id: Date.now() + Math.random(),
            type: 'paragraph',
            content: line
          };
        } else {
          // Append to existing paragraph
          currentBlock.content += '\n' + line;
        }
      }
    }

    // Don't forget the last block
    if (currentBlock) {
      blocks.push(currentBlock);
    }

    return blocks;
  }

  static async listPages(dirHandle, path = '') {
    try {
      const pages = [];
      let currentHandle = dirHandle;

      // Navigate to the correct directory if path is provided
      if (path) {
        const pathParts = path.split('/').filter(Boolean);
        for (const part of pathParts) {
          currentHandle = await currentHandle.getDirectoryHandle(part);
        }
      }

      // List all entries in the current directory
      for await (const entry of currentHandle.values()) {
        if (entry.kind === 'directory') {
          const subPages = await this.listPages(currentHandle, entry.name);
          pages.push({
            name: entry.name,
            type: 'directory',
            children: subPages
          });
        } else if (entry.name.endsWith('.md')) {
          pages.push({
            name: entry.name.replace('.md', ''),
            type: 'file',
            children: []
          });
        }
      }

      return pages;
    } catch (error) {
      console.error('Error listing pages:', error);
      throw error;
    }
  }

  static async saveFile(dirHandle, file) {
    try {
      // Get assets directory
      const assetsHandle = await dirHandle.getDirectoryHandle('assets', { create: true });

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
        path: `/assets/${fileName}`
      };
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  }

  static async createPage(dirHandle, path) {
    try {
      // Prevent creation of "assets" folder as a page
      const pathParts = path.split('/').filter(Boolean);
      if (pathParts.includes('assets')) {
        throw new Error('Cannot create a page named "assets"');
      }

      let currentHandle = dirHandle;
      // Create directory path
      for (const part of pathParts) {
        currentHandle = await currentHandle.getDirectoryHandle(part, { create: true });
      }

      // Create index.md with default content
      const fileHandle = await currentHandle.getFileHandle('index.md', { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(`# ${pathParts[pathParts.length - 1]}\n`);
      await writable.close();

      return true;
    } catch (error) {
      console.error('Error creating page:', error);
      throw error;
    }
  }

  static async readPage(dirHandle, path) {
    try {
      if (!path) return {
        blocks: [],
        metadata: {
          createdAt: new Date().toISOString(),
          lastEdited: new Date().toISOString()
        }
      };

      const pathParts = path.split('/').filter(Boolean);
      let currentHandle = dirHandle;

      // Navigate to the page directory
      for (const part of pathParts) {
        currentHandle = await currentHandle.getDirectoryHandle(part);
      }

      // Read index.md from the directory
      const fileHandle = await currentHandle.getFileHandle('index.md');
      const file = await fileHandle.getFile();
      const content = await file.text();

      // Extract metadata if present
      let metadata = {
        createdAt: new Date().toISOString(),
        lastEdited: new Date().toISOString()
      };
      let markdownContent = content;

      const metadataMatch = content.match(/^<!--\n([\s\S]*?)\n-->\n\n/);
      if (metadataMatch) {
        try {
          metadata = JSON.parse(metadataMatch[1]);
          markdownContent = content.replace(metadataMatch[0], '');
        } catch (e) {
          console.error('Error parsing metadata:', e);
        }
      }

      // Wait for blocks to be parsed
      const blocks = await this.parseMarkdownToBlocks(markdownContent);
      console.log('Parsed blocks:', blocks); // Debug log

      return { blocks, metadata };
    } catch (error) {
      console.error('Error reading page:', error);
      throw error;
    }
  }


  static async writePage(dirHandle, path, blocks, metadata = null) {
    try {
      if (!path) return false;

      const pathParts = path.split('/').filter(Boolean);
      let currentHandle = dirHandle;

      // Create/navigate to the page directory
      for (const part of pathParts) {
        currentHandle = await currentHandle.getDirectoryHandle(part, { create: true });
      }

      // Create the markdown content
      const defaultMetadata = {
        createdAt: new Date().toISOString(),
        lastEdited: new Date().toISOString()
      };

      const metadataToWrite = metadata || defaultMetadata;
      const metadataString = JSON.stringify(metadataToWrite, null, 2);
      const markdownContent = this.blocksToMarkdown(blocks);
      const fullContent = `<!--\n${metadataString}\n-->\n\n${markdownContent}`;

      // Write to index.md
      const fileHandle = await currentHandle.getFileHandle('index.md', { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(fullContent);
      await writable.close();

      return true;
    } catch (error) {
      console.error('Error writing page:', error);
      throw error;
    }
  }

  static async listPages(dirHandle, path = '') {
    try {
      const pages = [];
      let currentHandle = dirHandle;

      // Navigate to the correct directory if path is provided
      if (path) {
        const pathParts = path.split('/').filter(Boolean);
        for (const part of pathParts) {
          currentHandle = await currentHandle.getDirectoryHandle(part);
        }
      }

      // List all entries
      for await (const entry of currentHandle.values()) {
        // Skip assets directory and system files
        if (entry.name === 'assets' || entry.name.startsWith('.')) continue;

        if (entry.kind === 'directory') {
          // Check if directory has index.md
          try {
            await entry.getFileHandle('index.md');
            // Recursively get children
            const children = await this.listPages(currentHandle, entry.name);
            pages.push({
              name: entry.name,
              type: 'directory',
              children
            });
          } catch {
            // Skip directories without index.md
            continue;
          }
        }
      }

      return pages.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error listing pages:', error);
      throw error;
    }
  }

  static blocksToMarkdown(blocks) {
    if (!Array.isArray(blocks)) return '';

    let markdown = '';

    for (const block of blocks) {
      switch (block.type) {
        case 'paragraph':
          markdown += `${block.content}\n\n`;
          break;
        case 'heading':
          markdown += `## ${block.content}\n\n`;
          break;
        case 'todo':
          if (block.items && Array.isArray(block.items)) {
            markdown += block.items.map(item =>
              `- [${item.completed ? 'x' : ' '}] ${item.text}`
            ).join('\n') + '\n\n';
          }
          break;
        case 'table':
          if (block.data && block.data.length > 0) {
            // Headers
            markdown += '| ' + block.data[0].map(() => '---').join(' | ') + ' |\n';
            // Data
            markdown += block.data.map(row =>
              '| ' + row.map(cell => cell || '').join(' | ') + ' |'
            ).join('\n') + '\n\n';
          }
          break;
        case 'image':
          if (block.src) {
            markdown += `![${block.caption || ''}](${block.src})\n\n`;
          }
          break;
      }
    }

    return markdown;
  }

  static async deletePage(dirHandle, path) {
    try {
      const pathParts = path.split('/').filter(Boolean);
      let parentHandle = dirHandle;

      // Navigate to parent directory
      for (let i = 0; i < pathParts.length - 1; i++) {
        parentHandle = await parentHandle.getDirectoryHandle(pathParts[i]);
      }

      // Remove the directory recursively
      await parentHandle.removeEntry(pathParts[pathParts.length - 1], { recursive: true });
      return true;
    } catch (error) {
      console.error('Error deleting page:', error);
      throw error;
    }
  }

  static async renamePage(dirHandle, oldPath, newName) {
    try {
      const pathParts = oldPath.split('/').filter(Boolean);
      const newPath = [...pathParts.slice(0, -1), newName].join('/');

      // First, create the new directory structure
      await this.createPage(dirHandle, newPath);

      // Copy all content from old to new
      await this.copyDirectory(
        await this.getDirectoryHandle(dirHandle, oldPath),
        await this.getDirectoryHandle(dirHandle, newPath)
      );

      // Delete the old directory
      await this.deletePage(dirHandle, oldPath);

      return newPath;
    } catch (error) {
      console.error('Error renaming page:', error);
      throw error;
    }
  }

  static async copyDirectory(sourceDir, targetDir) {
    for await (const entry of sourceDir.values()) {
      if (entry.kind === 'file') {
        const file = await entry.getFile();
        const writer = await targetDir.getFileHandle(entry.name, { create: true });
        const writable = await writer.createWritable();
        await writable.write(await file.arrayBuffer());
        await writable.close();
      } else if (entry.kind === 'directory') {
        const newDir = await targetDir.getDirectoryHandle(entry.name, { create: true });
        await this.copyDirectory(
          await sourceDir.getDirectoryHandle(entry.name),
          newDir
        );
      }
    }
  }

  static async getDirectoryHandle(rootHandle, path) {
    let current = rootHandle;
    const parts = path.split('/').filter(Boolean);
    for (const part of parts) {
      current = await current.getDirectoryHandle(part);
    }
    return current;
  }

  static async movePage(dirHandle, sourcePath, targetPath) {
    try {
      // Create new location
      await this.createPage(dirHandle, targetPath);

      // Copy content
      await this.copyDirectory(
        await this.getDirectoryHandle(dirHandle, sourcePath),
        await this.getDirectoryHandle(dirHandle, targetPath)
      );

      // Delete old location
      await this.deletePage(dirHandle, sourcePath);

      return true;
    } catch (error) {
      console.error('Error moving page:', error);
      throw error;
    }
  }
}