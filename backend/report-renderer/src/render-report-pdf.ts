import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    if (typeof chunk === 'string') chunks.push(Buffer.from(chunk));
    else chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function findChromiumExecutable(): Promise<string | null> {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  const cacheRoot = path.resolve('./.cache/puppeteer');
  async function walk(dir: string): Promise<string | null> {
    let entries: any;
    try {
      entries = await (fs as any).readdir(dir, { withFileTypes: true });
    } catch (e) {
      return null;
    }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isFile && e.isFile() && (e.name === 'chrome' || e.name === 'chrome-headless-shell' || e.name.toLowerCase().includes('chrome'))) {
        return p;
      }
      if (e.isDirectory && e.isDirectory()) {
        const found = await walk(p);
        if (found) return found;
      }
    }
    return null;
  }
  return await walk(cacheRoot);
}

(async () => {
  const html = await readStdin();
  const executablePath = await findChromiumExecutable();
  const launchOpts: any = { args: ['--no-sandbox', '--disable-setuid-sandbox'], headless: 'new' };
  if (executablePath) launchOpts.executablePath = executablePath;
  let pdfBuffer: Uint8Array | null = null;
  try {
    const browser = await puppeteer.launch(launchOpts);
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' as any });
    pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();
  } catch (puppErr) {
    if (launchOpts.executablePath) {
      const tmpHtml = '/tmp/report_input.html';
      const tmpPdf = '/tmp/report_output.pdf';
      await fs.writeFile(tmpHtml, html, 'utf8');
      await new Promise<void>((resolve, reject) => {
        const args = ['--headless=new', '--no-sandbox', '--disable-setuid-sandbox', `--print-to-pdf=${tmpPdf}`, `file://${tmpHtml}`];
        execFile(launchOpts.executablePath, args, (err, stdout, stderr) => {
          if (err) return reject(new Error(`headless-shell failed: ${err.message} ${stderr}`));
          resolve();
        });
      });
      pdfBuffer = await fs.readFile('/tmp/report_output.pdf');
    } else {
      throw puppErr;
    }
  }
  if (!pdfBuffer) throw new Error('PDF generation failed');
  process.stdout.write(Buffer.from(pdfBuffer));
})();
