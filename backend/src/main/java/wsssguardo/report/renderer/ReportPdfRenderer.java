package wsssguardo.report.renderer;

import org.springframework.stereotype.Component;
import java.io.*;

@Component
public class ReportPdfRenderer {
    public byte[] renderPdf(String html) throws IOException, InterruptedException {
        // Run the compiled TypeScript renderer and pass HTML via stdin.
        ProcessBuilder pb = new ProcessBuilder("node", "report-renderer/dist/render-report-pdf.js");
        File cwd = new File(System.getProperty("user.dir"));
        pb.directory(cwd);
        // If Puppeteer's headless shell is installed in the renderer cache, set the executable path
        File cacheDir = new File(cwd, "report-renderer/.cache/puppeteer");
        if (cacheDir.exists() && cacheDir.isDirectory()) {
            File exe = findPossibleExecutable(cacheDir);
            if (exe != null && exe.exists()) {
                pb.environment().put("PUPPETEER_EXECUTABLE_PATH", exe.getAbsolutePath());
            }
        }
        Process p = pb.start();
        try (OutputStream os = p.getOutputStream()) {
            os.write(html.getBytes());
            os.flush();
        }
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (InputStream is = p.getInputStream()) {
            is.transferTo(baos);
        }
        int exit = p.waitFor();
        if (exit != 0) {
            try (InputStream es = p.getErrorStream()) {
                String err = new String(es.readAllBytes());
                throw new IOException("PDF renderer failed, exit=" + exit + ", err=" + err);
            }
        }
        return baos.toByteArray();
    }

    private File findPossibleExecutable(File dir) {
        File[] children = dir.listFiles();
        if (children == null) return null;
        for (File f : children) {
            if (f.isDirectory()) {
                File found = findPossibleExecutable(f);
                if (found != null) return found;
            } else {
                String name = f.getName().toLowerCase();
                if ((name.equals("chrome-headless-shell") || name.equals("chrome") || name.equals("headless_shell")) && f.canExecute()) {
                    return f;
                }
            }
        }
        return null;
    }
}
