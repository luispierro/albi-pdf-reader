const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const csv = require('csv-parser');
const archiver = require('archiver');
const { exec } = require('child_process');

const app = express();
const PORT = 3000;

const TEMPLATE = path.join(__dirname, 'PDFMODEL-ALBI.pdf');
const templateBytes = fs.readFileSync(TEMPLATE);

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

// Função para preencher PDF (retorna o Buffer)
async function preencherPdf(dados) {
    const templateBytes = fs.readFileSync(TEMPLATE);
    const pdfDoc = await PDFDocument.load(templateBytes);
    const form = pdfDoc.getForm();

    for (const [key, value] of Object.entries(dados)) {
        try {
            const field = form.getTextField(key);
            field.setText(value);
        } catch (e) {
            console.warn(`Campo não encontrado: ${key}`);
        }
    }

    form.flatten();
    const pdfBytes = await pdfDoc.save().catch(e => { 
        console.error("Erro ao salvar PDF:", e); 
        return null;
    });
    if (!pdfBytes) throw new Error("Falha ao salvar PDF");
    return Buffer.from(pdfBytes);
}

// Endpoint para upload e geração do ZIP
app.post('/upload', upload.single('csvfile'), async (req, res) => {
    const filePath = req.file.path;
    const linhas = [];

    fs.createReadStream(filePath)
        .pipe(csv({ separator: ';' }))
        .on('data', (row) => {
            const cleaned = {};
            for (const [key, value] of Object.entries(row)) {
                cleaned[key.trim()] = value ? value.trim() : '';
            }
            linhas.push(cleaned);
        })
        .on('end', async () => {
            fs.unlinkSync(filePath); // remove o CSV temporário

            // Nome do arquivo final
            const zipName = `pdfs_${Date.now()}.zip`;
            const zipPath = path.join(__dirname, zipName);

            const output = fs.createWriteStream(zipPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', () => {
                res.download(zipPath, zipName, () => {
                    fs.unlinkSync(zipPath); // limpa o zip após download
                });
            });

            archive.pipe(output);

            // Para cada linha do CSV, gerar um PDF e adicionar ao ZIP
            for (let i = 0; i < linhas.length; i++) {
                const pdfBytes = await preencherPdf(linhas[i]);
                if (!pdfBytes || !Buffer.isBuffer(pdfBytes)) {
                    throw new Error(`Erro: PDF inválido para a linha ${i + 1}`);
                }
                const nomeArquivo = (linhas[i].Nome || `saida_${i + 1}`).replace(/[^\w\-]/g, '_');
                archive.append(pdfBytes, { name: `${nomeArquivo}.pdf` });
            }

            archive.finalize();
        });
});


app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    exec(`start http://localhost:${PORT}`);
});