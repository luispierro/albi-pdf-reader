# **PDF & ZIP Report Generator**  
_A simple web tool to generate multiple PDFs from a CSV and bundle them into a ZIP._

---

## **Features**
- Upload a `.csv` file (semicolon `;` separated).  
- Fill a predefined PDF template for each CSV row.  
- Generate a consolidated **HTML-based PDF report**.  
- Bundle all generated PDFs and the report into a single `.zip` file for download.  
- Choose save location (Chrome/Edge via File System Access API).  

---

## **Requirements**
- Node.js **v18+**  
- npm (comes with Node.js)  
- Chrome/Edge for advanced save dialog support  

---

## **Installation**
1. **Clone the repository**
   ```bash
   git clone https://github.com/luispierro/albi-pdf-reader.git
   cd albi-pdf-reader
   ```

2. **Install dependencies**
   ```bash
   npm install express multer csv-parser archiver pdf-lib puppeteer
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
       "public/**/*"
     ]
   },
   "scripts": {
     "start": "node pdf-reader.js"
   }
   ```

3. **Build the executable:**
   ```bash
   pkg . --targets node18-win-x64 --output CSV2PDF.exe
   ```

- The resulting `.exe` runs on **Windows 10 and newer (64‑bit)**.  
- Node.js is **not required** on the target machine — the runtime is bundled.    

---

## **Usage**
1. Start the app (or run the `.exe`).  
2. Select a `.csv` file and click **Upload**.  
3. Wait while PDFs and the consolidated report are generated.  
4. Save the `.zip` file containing:  
   - Individual PDFs (`equipment_<last_column_value>.pdf`)  
   - The full report (`full_report.pdf`).   

---

## **Troubleshooting**  
- **Windows SmartScreen warning:**  
  On first run, Windows may block unknown executables. Select **More info → Run anyway**.  
