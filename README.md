# **PDF & ZIP Report Generator**  
_A simple web tool to generate multiple PDFs from a CSV and bundle them into a ZIP._  

![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![Express](https://img.shields.io/badge/Express-5.x-blue) ![pdf-lib](https://img.shields.io/badge/PDF--Lib-1.17+-orange) ![puppeteer](https://img.shields.io/badge/Puppeteer-latest-lightgrey)  

---

## **Features**
- Upload a `.csv` file (semicolon `;` separated).  
- Fill a predefined PDF template for each CSV row.  
- Generate a consolidated **HTML-based PDF report**.  
- Bundle all generated PDFs and the report into a single `.zip` file for download.  
- Choose save location (Chrome/Edge via File System Access API).  

---

## **Requirements**
- [Node.js](https://nodejs.org/) **v18+**  
- npm (comes with Node.js)  
- Chrome/Edge for advanced save dialog support  

---

## **Installation**
1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/pdf-zip-generator.git
   cd pdf-zip-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

---

## **Run the App**
```bash
node pdf-reader.js
```
Then open in your browser:  
[http://localhost:3000](http://localhost:3000)

---

## **Build a Standalone Executable (Windows 10+)**
You can package the application into a single `.exe` file using [pkg](https://github.com/vercel/pkg):  

1. **Install pkg globally:**
   ```bash
   npm install -g pkg
   ```

2. **Add `pkg` configuration to `package.json`:**
   ```json
   "pkg": {
     "assets": [
       "public/templates/**/*",
       "node_modules/puppeteer/.local-chromium/**/*"
     ]
   },
   "scripts": {
     "start": "node pdf-reader.js",
     "build": "pkg pdf-reader.js --targets node18-win-x64"
   }
   ```

3. **Build the executable:**
   ```bash
   npm run build
   ```

- The resulting `.exe` runs on **Windows 10 and newer (64‑bit)**.  
- Node.js is **not required** on the target machine — the runtime is bundled.  
- Ensure Puppeteer’s Chromium is included (via the `pkg.assets` configuration above).  

---

## **Usage**
1. Start the app (or run the `.exe`).  
2. Select a `.csv` file and click **Upload**.  
3. Wait while PDFs and the consolidated report are generated.  
4. Save the `.zip` file containing:  
   - Individual PDFs (`equipment_<last_column_value>.pdf`)  
   - The full report (`full_report.pdf`).  

---

## **Built With**
- **[Express](https://expressjs.com/)** – Web server framework.  
- **[Multer](https://github.com/expressjs/multer)** – File upload handling.  
- **[pdf-lib](https://pdf-lib.js.org/)** – PDF manipulation.  
- **[puppeteer](https://pptr.dev/)** – HTML-to-PDF rendering.  
- **[csv-parser](https://github.com/mafintosh/csv-parser)** – CSV parsing.  
- **[archiver](https://github.com/archiverjs/node-archiver)** – ZIP creation.  

---

## **Troubleshooting**
- **Puppeteer not launching inside `.exe`:**  
  Make sure you included the `.local-chromium` folder in `pkg.assets`.  
- **Windows SmartScreen warning:**  
  On first run, Windows may block unknown executables. Select **More info → Run anyway**.  
