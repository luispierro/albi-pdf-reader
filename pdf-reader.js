const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const csv = require('csv-parser');
const archiver = require('archiver');
const { exec } = require('child_process');

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
async function gerarTabelaPDF(dados) {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 10;
    const margin = 40;
    const pageHeight = 1000;
    const pageWidth = 800;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - 50;

    const headers = Object.keys(dados[0]);

    // Cabeçalho
    page.drawText(headers.join(' | '), {
        x: margin,
        y,
        size: fontSize + 2,
        font,
        color: rgb(0, 0, 0),
    });
    y -= 20;

    for (const row of dados) {
        const line = headers.map(h => (row[h] || '').toString()).join(' | ');
        page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
        y -= 15;

        // Nova página se faltar espaço
        if (y < 50) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            y = pageHeight - 50;
        }
    }

    return await pdfDoc.save();
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

    const tabelaPDF = await gerarTabelaPDF(dados);
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