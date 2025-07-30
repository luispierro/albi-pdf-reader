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
const PORT = 3000;

const TEMPLATE_PATH = path.join(__dirname, 'PDFMODEL-ALBI.pdf');
const templateBytes = fs.readFileSync(TEMPLATE_PATH);

app.use(express.static('public'));
const upload = multer({ dest: 'uploads/' });

/* ---- 1. LER CSV ---- */
function lerCSV(caminhoCSV) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(caminhoCSV)
            .pipe(csv({ separator: ';' }))
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', reject);
    });
}

/* ---- 2. GERAR PDF INDIVIDUAL ---- */
async function gerarPDFIndividual(templateBytes, dados) {
    const pdfDoc = await PDFDocument.load(templateBytes);
    const form = pdfDoc.getForm();

    for (const [key, value] of Object.entries(dados)) {
        const fieldName = key.trim();
        try {
            const field = form.getTextField(fieldName);
            field.setText((value || '').toString());
        } catch {
            console.warn(`Campo "${fieldName}" não encontrado no PDF.`);
        }
    }

    form.flatten();
    return await pdfDoc.save();
}

/* ---- 3. GERAR TABELA PDF ---- */
// Gera um PDF a partir de HTML
async function gerarTabelaPDF_HTML(dados) {
    const templatePath = path.join(__dirname, 'public/templates/report.html');
    let html = fs.readFileSync(templatePath, 'utf8');

    const headers = Object.keys(dados[0]);
    const thead = headers.map(h => `<th>${h}</th>`).join('');
    const tbody = dados.map(row =>
        `<tr>${headers.map(h => `<td>${row[h] || ""}</td>`).join('')}</tr>`).join('');
    const data = new Date().toLocaleString();

    // Substituir placeholders
    html = html.replace('{{thead}}', thead).replace('{{tbody}}', tbody).replace('{{data}}', data);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        preferCSSPageSize: true
    });

    await browser.close();
    return pdfBuffer;
}

/* ---- 4. CRIAR ZIP ---- */
function criarZip(pdfs, tabelaPDF) {
    return new Promise((resolve, reject) => {
        const zipName = `pdfs_${Date.now()}.zip`;
        const zipPath = path.join(__dirname, zipName);
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => resolve(zipPath));
        archive.on('error', reject);

        archive.pipe(output);

        pdfs.forEach((pdf, i) => {
            archive.append(Buffer.from(pdf), { name: `documento_${i + 1}.pdf` });
        });

        archive.append(Buffer.from(tabelaPDF), { name: 'tabela_completa.pdf' });
        archive.finalize();
    });
}

/* ---- 5. FLUXO COMPLETO ---- */
async function handleUpload(caminhoCSV) {
    const templateBytes = fs.readFileSync(TEMPLATE_PATH);
    const dados = await lerCSV(caminhoCSV);

    const pdfs = [];
    for (const row of dados) {
        const pdf = await gerarPDFIndividual(templateBytes, row);
        pdfs.push(pdf);
    }

    const tabelaPDF = await gerarTabelaPDF_HTML(dados);
    return await criarZip(pdfs, tabelaPDF);
}

/* ---- ROTA PRINCIPAL ---- */
app.post('/upload', upload.single('csvfile'), async (req, res) => {
    try {
        const zipPath = await handleUpload(req.file.path);
        res.download(zipPath, path.basename(zipPath), () => {
            fs.unlinkSync(zipPath);
            fs.unlinkSync(req.file.path);
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao processar arquivo.');
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    exec(`start http://localhost:${PORT}`);
});