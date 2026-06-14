declare module "busboy" {
  import { IncomingHttpHeaders } from "http";
  import { Readable, Writable } from "stream";

  type BusboyConfig = {
    headers: IncomingHttpHeaders;
    limits?: {
      fileSize?: number;
      files?: number;
      fields?: number;
    };
  };

  type FileInfo = {
    filename?: string;
    encoding?: string;
    mimeType?: string;
  };

  interface BusboyParser extends Writable {
    on(event: "field", listener: (name: string, value: string) => void): this;
    on(
      event: "file",
      listener: (name: string, stream: Readable, info: FileInfo) => void,
    ): this;
    on(event: "filesLimit" | "fieldsLimit" | "finish", listener: () => void): this;
    on(event: "error", listener: (error: Error) => void): this;
    destroy(error?: Error): this;
  }

  export default function busboy(config: BusboyConfig): BusboyParser;
}
