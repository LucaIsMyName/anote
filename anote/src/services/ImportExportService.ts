import JSZip from "jszip";
import { WorkspaceService } from "./WorkspaceService";

export class ImportExportService {

  /**
   * 
   * @param handle 
   * @returns 
   * @description
   * This function takes a directory handle and returns a JSZip object containing the contents of the directory.
   * The JSZip object can then be used to export the contents of the directory to a zip file.
   */
  private static getDirectoryEntries(handle: any) {
    return new Promise(async (resolve, reject) => {
      const entries = [];
      for await (const entry of handle.values()) {
        entries.push(entry);
      }
      resolve(entries);
    });
  }

  /**
   * 
   * @param zip 
   * @param entry 
   * @param parentHandle 
   * @returns 
   * @description
   * This function takes a JSZip object, an entry from a directory handle, and the parent directory handle.
   * It adds the entry to the JSZip object.
   */
  private static addEntryToZip(zip: any, entry: any, parentHandle: any) {
    return new Promise(async (resolve, reject) => {
      if (entry.kind === "file") {
        const fileHandle = await parentHandle.getFileHandle(entry.name);
        const file = await fileHandle.getFile();
        const fileData = await file.arrayBuffer();
        zip.file(entry.name, fileData);
        resolve(void 0);
      } else if (entry.kind === "directory") {
        const dirHandle = await parentHandle.getDirectoryHandle(entry.name);
        const dirZip = zip.folder(entry.name);
        const dirEntries = await this.getDirectoryEntries(dirHandle);
        dirEntries.forEach((dirEntry: any) => {
          this.addEntryToZip(dirZip, dirEntry, dirHandle);
        });
        resolve(void 0);
      }
    });
  }

  static exportWorkspaceToZip() {
  }

  static importWorkspaceFromZip(zipBlob: any) {
  }

  static async importWorkspaceFromJson(json:JSON) {
  }

  static async exportWorkspaceToJson(workspace:any) {
  }

  static exportPagetreeToJson(directory:string) {
  }

  static exportPagetreeToZip(directory:string) {
  }

  static importPagetreeFromJson(json:JSON) {
  }

  static importPagetreeFromZip(json:JSON) {
  }

  static exportPageToJson(directory:string) {
  }
  }

  static importPageFromJson(json:JSON) {
  }

  static importPageFromMd(md:string) {
  }

  static exportPageToMd(directory:string) {
  }
}
