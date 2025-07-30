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

function downloadFile(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
}
