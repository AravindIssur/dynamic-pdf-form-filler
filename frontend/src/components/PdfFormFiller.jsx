import { useState, useEffect } from 'react';
import download from 'downloadjs';
import './PdfFormFiller.css';

const PdfFormFiller = () => {
  const [fileId, setFileId] = useState('');
  const [layout, setLayout] = useState(null);
  const [formData, setFormData] = useState({});
  const [initialFormData, setInitialFormData] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastGeneratedPdf, setLastGeneratedPdf] = useState(null);
  const [lastGeneratedPdfUrl, setLastGeneratedPdfUrl] = useState(null);

  // Cleanup function to remove any DOM elements
  useEffect(() => {
    return () => {
      // Clean up any loading divs
      const loadingDivs = document.querySelectorAll('.loading-overlay');
      loadingDivs.forEach(div => div.remove());
      
      // Clean up any download links
      const downloadLinks = document.querySelectorAll('[download="filled-form.pdf"]');
      downloadLinks.forEach(link => link.remove());
    };
  }, []);

  const handleDownload = () => {
    const link = document.getElementById('pdf-download-link');
    if (link) {
      link.click();
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8081/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const fileId = await response.text();
      setFileId(fileId);
      setSelectedFile(file);

      // Get form layout
      const layoutResponse = await fetch(`http://localhost:8081/api/layout?fileId=${fileId}`);
      if (!layoutResponse.ok) {
        throw new Error('Failed to get form layout');
      }

      const layoutData = await layoutResponse.json();
      setLayout(layoutData);
      setFormData(layoutData.fields.reduce((acc, field) => ({
        ...acc,
        [field.id]: ''
      }), {}));
      setInitialFormData(layoutData.fields.reduce((acc, field) => ({
        ...acc,
        [field.id]: ''
      }), {}));
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload PDF file. Please try again.');
    }
  };

  const handleInputChange = (e, fieldId) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    
    if (isLoading) {
      alert('Please wait for the current PDF generation to complete.');
      return;
    }

    try {
      setIsLoading(true);
      
      if (!fileId) {
        throw new Error('No file ID found. Please upload a PDF first.');
      }
      
      console.log('Current fileId:', fileId);
      console.log('Form data:', formData);
      
      // Add a loading state
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'loading-overlay';
      loadingDiv.style.position = 'fixed';
      loadingDiv.style.top = '0';
      loadingDiv.style.left = '0';
      loadingDiv.style.width = '100%';
      loadingDiv.style.height = '100%';
      loadingDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      loadingDiv.style.display = 'flex';
      loadingDiv.style.justifyContent = 'center';
      loadingDiv.style.alignItems = 'center';
      loadingDiv.style.zIndex = '1000';

      const loadingMessage = document.createElement('div');
      loadingMessage.style.backgroundColor = 'white';
      loadingMessage.style.padding = '20px';
      loadingMessage.style.borderRadius = '5px';
      loadingMessage.textContent = 'Generating PDF... Please wait.';
      loadingDiv.appendChild(loadingMessage);

      document.body.appendChild(loadingDiv);
      
      // Make the API call with proper error handling
      try {
        console.log('Sending request to:', `http://localhost:8081/api/fill?fileId=${fileId}`);
        console.log('Request headers:', {
          'Content-Type': 'application/json',
          'Accept': 'application/pdf',
          'Origin': 'http://localhost:5173'
        });
        console.log('Request body:', JSON.stringify(formData, null, 2));

        const response = await fetch(`http://localhost:8081/api/fill?fileId=${fileId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/pdf',
            'Origin': 'http://localhost:5173'
          },
          body: JSON.stringify(formData)
        });

        const responseDetails = {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        };
        console.log('Response details:', responseDetails);

        document.body.removeChild(loadingDiv);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server error:', errorText);
          throw new Error(`Server error: ${response.status} - ${response.statusText}\nDetails: ${errorText}`);
        }

        // Get the blob from the response
        const blob = await response.blob();
        console.log('PDF generated successfully:', { 
          size: blob.size, 
          type: blob.type 
        });

        // Create a new tab to display the PDF
        const pdfUrl = URL.createObjectURL(blob);
        
        // Create a hidden iframe to display the PDF
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = pdfUrl;
        document.body.appendChild(iframe);

        // Open in new tab
        window.open(pdfUrl, '_blank');

        // Create a styled download section
        const downloadSection = document.createElement('div');
        downloadSection.style.marginTop = '20px';
        downloadSection.style.padding = '15px';
        downloadSection.style.backgroundColor = '#f9f9f9';
        downloadSection.style.borderRadius = '8px';
        downloadSection.style.position = 'fixed';
        downloadSection.style.top = '50%';
        downloadSection.style.left = '50%';
        downloadSection.style.transform = 'translate(-50%, -50%)';
        downloadSection.style.zIndex = '1000';
        downloadSection.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';

        // Add download text
        const downloadText = document.createElement('p');
        downloadText.textContent = 'PDF generated successfully! You can download it using the button below. ' +
            'The PDF will be saved to your browser\'s default downloads folder.';
        downloadText.style.marginBottom = '10px';
        downloadText.style.textAlign = 'center';
        downloadSection.appendChild(downloadText);

        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.href = pdfUrl;
        downloadLink.download = 'filled-form.pdf';
        downloadLink.target = '_blank';
        downloadLink.textContent = 'Download PDF';
        downloadLink.className = 'pdf-download-link';
        downloadLink.style.display = 'block';
        downloadLink.style.margin = '0 auto';
        downloadLink.style.padding = '8px 16px';
        downloadLink.style.backgroundColor = '#4CAF50';
        downloadLink.style.color = 'white';
        downloadLink.style.textDecoration = 'none';
        downloadLink.style.borderRadius = '4px';
        downloadLink.style.cursor = 'pointer';
        downloadLink.style.textAlign = 'center';
        downloadSection.appendChild(downloadLink);

        // Add the section to the document
        document.body.appendChild(downloadSection);

        // Clean up after 10 seconds
        setTimeout(() => {
          document.body.removeChild(downloadSection);
          URL.revokeObjectURL(pdfUrl);
        }, 10000);

        // Store the last generated PDF
        setLastGeneratedPdf(blob);
        setLastGeneratedPdfUrl(pdfUrl);

        // Reset form state
        setFormData(initialFormData);
        const form = document.querySelector('form');
        if (form) {
          form.reset();
        }

      } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Failed to generate PDF. Please check the console for details.');
        throw error;
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
      // Clean up any remaining loading divs
      const remainingLoadingDivs = document.querySelectorAll('.loading-overlay');
      remainingLoadingDivs.forEach(div => div.remove());
    }
  };

  return (
    <div className="pdf-form-filler">
      <h2>PDF Form Filler</h2>
      <div className="upload-section">
        <input 
          type="file" 
          accept=".pdf"
          onChange={handleFileUpload}
        />
        {selectedFile && (
          <div className="selected-file">
            Selected file: {selectedFile.name}
          </div>
        )}
      </div>

      {layout && (
        <form onSubmit={(e) => e.preventDefault()}>
          {layout.fields.map(field => (
            <div key={field.id} className="form-group">
              <label>{field.label}</label>
              <input
                type={field.type === 'checkbox' ? 'checkbox' : 'text'}
                value={formData[field.id]}
                onChange={(e) => handleInputChange(e, field.id)}
              />
            </div>
          ))}
          <div className="button-group">
            <button type="button" onClick={(e) => handleSubmit(e)} disabled={isLoading}>
              {isLoading ? 'Generating...' : 'Generate PDF'}
            </button>
            {fileId && (
              <button type="button" onClick={handleDownload} disabled={!lastGeneratedPdf || isLoading}>
                Download PDF
              </button>
            )}
          </div>
        </form>
      )}

      {/* Store last generated PDF */}
      {lastGeneratedPdf && (
        <div style={{ display: 'none' }}>
          <a
            id="pdf-download-link"
            href={URL.createObjectURL(lastGeneratedPdf)}
            download="filled-form.pdf"
          />
        </div>
      )}
    </div>
  );
};

export default PdfFormFiller;
