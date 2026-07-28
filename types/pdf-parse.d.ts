declare module "pdf-parse" {
  function pdf(
    dataBuffer: Buffer | ArrayBuffer,
    options?: Record<string, any>
  ): Promise<{
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    text: string;
    version: string;
  }>;
  export default pdf;
}
