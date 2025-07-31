//Imports necessary to code
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const csv = require('csv-parser');
const archiver = require('archiver');
const { exec } = require('child_process');
const puppeteer = require('puppeteer');
const app = express();

//default port to be used
const PORT = process.env.PORT || 3000;

const TEMPLATE_PATH = path.join(__dirname, 'public/templates/PDFMODEL-ALBI v2.pdf');

//directory to where the html will be placed
app.use(express.static('public'));

const upload = multer({ dest: 'uploads/' });

/* ---- reads CSV ----- */
function readCSV(pathCSV) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(pathCSV)
            .pipe(csv({ separator: ';' }))
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', reject);
    });
}

/* ---- Fill each PDF ---- */
async function fillEachPDF(templateBytes, values) {
    const pdfDoc = await PDFDocument.load(templateBytes);
    const form = pdfDoc.getForm();

    for (const [key, value] of Object.entries(values)) {
        const fieldName = key.trim();
        try {
            const field = form.getTextField(fieldName);
            field.setText((value || '').toString());
        } catch {
            console.warn(`Field "${fieldName}" could not be founded on PDF.`);
        }
    }

    form.flatten();
    return await pdfDoc.save();
}

/* ---- Creates the table to exported as PDF ---- */
// It will be created thru HTML
async function createTablePDF_HTML(values) {
    //path where the default table can be find
    const templatePath = path.join(__dirname, 'public/templates/report.html');
    let html = fs.readFileSync(templatePath, 'utf8');

    const headers = Object.keys(values[0]);
    //fill with the header of the csv
    const thead = headers.map(h => `<th>${h}</th>`).join('');
    //fill each row accordly with the csv
    const tbody = values.map(row =>
        `<tr>${headers.map(h => `<td>${row[h] || ""}</td>`).join('')}</tr>`).join('');
    const data = new Date().toLocaleString();

    //changes the places holders on the template
    html = html.replace('{{thead}}', thead).replace('{{tbody}}', tbody).replace('{{data}}', data);
    
    //launches the table now filled
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    //print it as pdf
    const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        preferCSSPageSize: true
    });

    await browser.close();
    return pdfBuffer;
}

/* ---- Creates the ZIP file to be downloaded ---- */
function createZip(pdfs, tablePDF, fileNames) {
    return new Promise((resolve, reject) => {
        const zipName = `pdfs_${Date.now()}.zip`;
        const zipPath = path.join(__dirname, zipName);
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => resolve(zipPath));
        archive.on('error', reject);

        archive.pipe(output);

        //puts each pdf inside the archive and renames it to the column of zeit
        pdfs.forEach((pdf, i) => {
            archive.append(Buffer.from(pdf), { name: `equipment_${fileNames[i]}.pdf` });
        });
        //add the full report to it also
        archive.append(Buffer.from(tablePDF), { name: 'full_report.pdf' });
        archive.finalize();
    });
}

app.post('/upload', upload.single('csvfile'), async (req, res) => {
    try {
        //with the received csv calls the reader and adds also the templates path
        const templateBytes = fs.readFileSync(TEMPLATE_PATH);
        const data = await readCSV(req.file.path);

        //for each row on the csv, calls to create and fill each pdf with the data extracted and also creates the name to the final pdf.
        const pdfs = [];
        const fileNames = [];
        for (const row of data) {
            const pdf = await fillEachPDF(templateBytes, row);
            pdfs.push(pdf);

            const lastColumn = Object.keys(row).pop();
            const name = (row[lastColumn] || `document_${i + 1}`).toString().replace(/[\\/:*?"<>|]/g, '_');
            fileNames.push(name);
        }

        //creates the final full report
        const tablePDF = await createTablePDF_HTML(data);
        //zip everything
        const zipPath = await createZip(pdfs, tablePDF, fileNames);

        //send the zipfile to download
        res.download(zipPath, path.basename(zipPath), () => {
            fs.unlinkSync(zipPath);
            fs.unlinkSync(req.file.path);
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error processing the CSV file submitted. Please try again.');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    exec(`start http://localhost:${PORT}`);
});