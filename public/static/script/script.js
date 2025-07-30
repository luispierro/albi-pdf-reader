document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await enviarCSV(e.target);
});

async function enviarCSV(form) {

    const spinner = document.getElementById("spinner");
    const formData = new FormData(form);

    try {
        // Show the spinner
        spinner.style.display = "block";
        const resp = await fetch('/upload', { method: 'POST', body: formData });
        if (!resp.ok) throw new Error('Erro ao gerar PDFs');
        
        const blob = await resp.blob();
        baixarArquivo(blob, 'pdfs_gerados.zip');
        spinner.style.display = "none";
    } catch (err) {
        alert(err.message);
    }
}

function baixarArquivo(blob, nomeArquivo) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    a.click();
    URL.revokeObjectURL(url);
}
