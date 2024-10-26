export class FileService {
  static async writeMarkdownFile(dirHandle, path, blocks) {
    try {
      // Convert blocks to markdown
      let markdown = '';

      for (const block of blocks) {
        switch (block.type) {
          case 'heading':
            markdown += `# ${block.content}\n\n`;
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
            // Copy image to assets and create relative link
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
              // Create table header
              markdown += '| ' + block.data[0].map(() => '---').join(' | ') + ' |\n';
              // Create table rows
              markdown += block.data.map(row =>
                '| ' + row.map(cell => cell || '').join(' | ') + ' |'
              ).join('\n') + '\n\n';
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

  static async parseMarkdownToBlocks(markdown) {
    const blocks = [];
    const lines = markdown.split('\n');
    let currentBlock = null;

    for (let line of lines) {
      if (line.startsWith('# ')) {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = {
          id: Date.now() + Math.random(),
          type: 'heading',
          content: line.substring(2).trim()
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
      } else if (line.trim() !== '') {
        if (!currentBlock || currentBlock.type !== 'paragraph') {
          if (currentBlock) blocks.push(currentBlock);
          currentBlock = {
            id: Date.now() + Math.random(),
            type: 'paragraph',
            content: line
          };
        } else {
          currentBlock.content += '\n' + line;
        }
      } else if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
    }

    if (currentBlock) blocks.push(currentBlock);
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

  static async createPage(dirHandle, path) {
    try {
      const pathParts = path.split('/').filter(Boolean);
      let currentHandle = dirHandle;

      // Navigate/create parent directories
      for (let i = 0; i < pathParts.length - 1; i++) {
        currentHandle = await currentHandle.getDirectoryHandle(pathParts[i], { create: true });
      }

      // Create the page directory
      const pageName = pathParts[pathParts.length - 1];
      const pageHandle = await currentHandle.getDirectoryHandle(pageName, { create: true });

      // Create an index.md file in the page directory
      const fileHandle = await pageHandle.getFileHandle('index.md', { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(`# ${pageName}\n`);
      await writable.close();

      return true;
    } catch (error) {
      console.error('Error creating page:', error);
      throw error;
    }
  }

  static async readPage(dirHandle, path) {
    try {
      const pathParts = path.split('/').filter(Boolean);
      let currentHandle = dirHandle;

      // Navigate to the page directory
      for (const part of pathParts) {
        currentHandle = await currentHandle.getDirectoryHandle(part);
      }

      // Read the index.md file
      const fileHandle = await currentHandle.getFileHandle('index.md');
      const file = await fileHandle.getFile();
      const content = await file.text();

      return this.parseMarkdownToBlocks(content);
    } catch (error) {
      console.error('Error reading page:', error);
      throw error;
    }
  }

  static async writePage(dirHandle, path, blocks) {
    try {
      const pathParts = path.split('/').filter(Boolean);
      let currentHandle = dirHandle;

      // Navigate to the page directory
      for (const part of pathParts) {
        currentHandle = await currentHandle.getDirectoryHandle(part, { create: true });
      }

      // Write to index.md
      const fileHandle = await currentHandle.getFileHandle('index.md', { create: true });
      const writable = await fileHandle.createWritable();

      const markdown = this.blocksToMarkdown(blocks);
      await writable.write(markdown);
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
        // Skip system files and the assets directory
        if (entry.name.startsWith('.') || entry.name === 'assets') continue;

        if (entry.kind === 'directory') {
          // Recursively get children
          const children = await this.listPages(currentHandle, entry.name);
          pages.push({
            name: entry.name,
            type: 'directory',
            children
          });
        } else if (entry.name === 'index.md') {
          // Skip index.md files as they're part of their parent directory
          continue;
        } else if (entry.name.endsWith('.md')) {
          pages.push({
            name: entry.name.replace('.md', ''),
            type: 'file',
            children: []
          });
        }
      }

      return pages.sort((a, b) => {
        // Sort directories first, then by name
        if (a.type === 'directory' && b.type !== 'directory') return -1;
        if (a.type !== 'directory' && b.type === 'directory') return 1;
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      console.error('Error listing pages:', error);
      throw error;
    }
  }

  static blocksToMarkdown(blocks) {
    let markdown = '';

    for (const block of blocks) {
      switch (block.type) {
        case 'heading':
          markdown += `# ${block.content}\n\n`;
          break;
        case 'paragraph':
          markdown += `${block.content}\n\n`;
          break;
        case 'todo':
          markdown += block.items.map(item =>
            `- [${item.completed ? 'x' : ' '}] ${item.text}`
          ).join('\n') + '\n\n';
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