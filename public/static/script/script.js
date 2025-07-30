// Lstener of the form to call function to call server
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    //prevents to be always a csv submitted
    const fileInput = e.target.querySelector('input[type="file"]');
    const file = fileInput.files[0];
    
    if (!file || !file.name.toLowerCase().endsWith('.csv')) {
        alert('Please, choose one valid CSV file.');
        return;
    }
    await sendCSV(e.target);
});

async function sendCSV(form) {

    const spinner = document.getElementById("spinner");
    const formData = new FormData(form);

    try {
        // Show the spinner
        spinner.style.display = "block";
        //calls the server with the post method and passing the csv received
        const resp = await fetch('/upload', { method: 'POST', body: formData });
        if (!resp.ok) throw new Error('Erro ao gerar PDFs');
        
        const blob = await resp.blob();
        //sends the return to be downloaded
        downloadFile(blob, 'all_reports.zip');
        spinner.style.display = "none";
    } catch (err) {
        alert(err.message);
    } finally {
        form.reset(); // cleans the file on the form
    }
}

async function downloadFile(blob, fileName) {
    
    //File System Access API that works only on Chrome and Edge
    const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [{
            description: 'Arquivo ZIP',
            accept: { 'application/zip': ['.zip'] },
        }],
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
}
