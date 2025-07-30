document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const resp = await fetch('/upload', { method: 'POST', body: formData });
    if (!resp.ok) { alert("Erro ao gerar PDFs"); return; }
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pdfs_gerados.zip';
    a.click();
    URL.revokeObjectURL(url);
});