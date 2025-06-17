import { useState } from 'react';

const PdfFormFiller = () => {
  const [fileId, setFileId] = useState('');
  const [layout, setLayout] = useState(null);
  const [formData, setFormData] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8080/api/upload', {
        method: 'POST',
        body: formData
      });
      
      const fileId = await response.text();
      setFileId(fileId);
      
      // Fetch layout
      const layoutResponse = await fetch(`http://localhost:8080/api/layout?fileId=${fileId}`);
      const layoutData = await layoutResponse.json();
      setLayout(layoutData);
      
      // Initialize form data
      setFormData(layoutData.fields.reduce((acc, field) => {
        acc[field.id] = '';
        return acc;
      }, {}));
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleInputChange = (event, fieldId) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/fill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileId,
          data: formData
        })
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'filled-form.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  if (!layout) {
    return (
      <div className="upload-container">
        <h2>Upload PDF Form</h2>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
        />
      </div>
    );
  }

  return (
    <div className="form-container">
      <h2>Fill PDF Form</h2>
      <form>
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
        <button onClick={handleSubmit}>Generate PDF</button>
      </form>
    </div>
  );
};

export default PdfFormFiller;
