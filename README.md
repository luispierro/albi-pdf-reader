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
   
2. **Install dependencies**
   ```bash
   npm install
   
3. **Run the App**
  ```bash
  node pdf-reader.js

4. **Open in your browser: http://localhost:3000**
##

## **Build a Standalone Executable**
To generate a single .exe file using pkg:

1. **Install pkg globally:**
  ```bash
  npm install -g pkg

2. **Add pkg config to package.json:**
  ```json
  "pkg": {
    "assets": [
      "public/templates/**/*",
      "node_modules/puppeteer/.local-chromium/**/*"
    ]
  }

Build the executable:

bash
Copiar
Editar
pkg pdf-reader.js --targets node18-win-x64
This creates a standalone .exe in the project folder.

Usage
Start the app (or run the .exe).

Select a .csv file and click Upload.

Wait while PDFs and the consolidated report are generated.

Save the .zip file containing:

Individual PDFs (equipment_<last_column_value>.pdf)

The full report (full_report.pdf)
