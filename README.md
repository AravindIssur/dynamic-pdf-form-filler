# Dynamic PDF Form Filler

A full-stack web application that allows users to upload PDF forms with AcroForm fields, fill them out dynamically, and download the filled PDF.

## Features

- Upload PDF files containing AcroForm fields
- Extract form field metadata (name, type, page, rectangle)
- Render dynamic forms in the frontend based on PDF fields
- Support for various field types (text, checkbox, radio, combo)
- Fill the PDF with user input
- Download the filled PDF

## Tech Stack

### Backend
- Java 21
- Spring Boot 3.x
- Apache PDFBox 2.0.28
- Maven

### Frontend
- React 18
- Vite
- JavaScript

## Prerequisites

- Java 21 or higher
- Maven
- Node.js and npm

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
```

2. Build and run the backend:
```bash
cd dynamic-pdf-form-filler
mvn clean install
mvn spring-boot:run
```

3. In a new terminal, run the frontend:
```bash
cd frontend
npm install
npm run dev
```

## Usage

1. Open http://localhost:5173 in your browser
2. Click "Choose File" to upload a PDF form
3. The form fields will be automatically extracted and rendered
4. Fill out the form
5. Click "Generate PDF" to download the filled form

## API Endpoints

- `POST /api/upload`: Upload PDF file
- `GET /api/layout?fileId=...`: Get form layout JSON
- `POST /api/fill`: Fill PDF with data and return filled PDF

## License

MIT License
