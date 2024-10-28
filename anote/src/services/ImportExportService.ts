import JSZip from 'jszip';

export class ImportExportService {
  static async importFromDirectory(dirHandle) {
    const entries = [];
    for await (const [name, handle] of dirHandle.entries()) {
      if (handle.kind === 'file') {
        entries.push({ name, handle });
      }
    }
    return entries;
  }

  static async exportToFile(dirHandle, fileName, data) {
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();
  }

  static async exportToJson(dirHandle, fileName, data) {
    const json = JSON.stringify(data, null, 2);
    await this.exportToFile(dirHandle, fileName, json);
  }

  static async importFromJson(dirHandle, fileName) {
    const fileHandle = await dirHandle.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    const json = await file.text();
    return JSON.parse(json);
  }

  static async exportToZip(dirHandle, fileName, entries) {
    const zip = new JSZip();
    entries.forEach(({ name, handle }) => {
      zip.file(name, handle.getFile());
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    await this.exportToFile(dirHandle, fileName, blob);
  }

  static async importFromZip(dirHandle, fileName) {
    const fileHandle = await dirHandle.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    const blob = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(blob);
    const entries = [];
    zip.forEach((name, zipEntry) => {
      entries.push({ name, handle: zipEntry });
    });
    return entries;
  }
}