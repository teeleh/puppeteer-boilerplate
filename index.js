const express = require("express");
const multer = require("multer");
const puppeteer = require("puppeteer");

const app = express();
const upload = multer(); // Middleware for parsing form data

// Serve HTML form
app.get("/", (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>Website Screenshot</title></head>
    <body>
        <h1>Generate a Screenshot</h1>
        <form action="/screenshot" method="post" enctype="multipart/form-data">
            <input type="text" name="url" placeholder="https://example.com" required>
            <button type="submit">Generate Screenshot</button>
        </form>
    </body>
    </html>
  `);
});

// Handle screenshot generation
app.post("/screenshot", upload.none(), async (req, res) => {
    const url = req.body.url;
    if (!/^https?:\/\/.+$/.test(url)) return res.status(400).send("Invalid URL.");

    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(url, { timeout: 60000 });
        const screenshotBuffer = await page.screenshot({ type: "png" });
        await browser.close();

        // Embed screenshot as base64 in HTML
        res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Screenshot Result</title></head>
      <body>
          <h1>Screenshot of ${url}</h1>
          <img src="data:image/png;base64,${screenshotBuffer.toString("base64")}" style="max-width:100%;height:auto;">
          <br><a href="/">Back to form</a>
      </body>
      </html>
    `);
    } catch (error) {
        console.error("Screenshot error:", error);
        res.status(500).send("Failed to generate screenshot.");
    }
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));