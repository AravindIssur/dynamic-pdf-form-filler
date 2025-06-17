package com.example.dynamicpdfformfiller.controller;

import com.example.dynamicpdfformfiller.model.Field;
import com.example.dynamicpdfformfiller.model.FormLayout;
import com.example.dynamicpdfformfiller.service.PdfService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api")
class FormsController {
    private final PdfService pdfService;

    public FormsController(PdfService pdfService) {
        this.pdfService = pdfService;
    }

    @PostMapping("/upload")
    public String uploadPdf(@RequestParam("file") MultipartFile file) {
        return pdfService.uploadPdf(file);
    }

    @GetMapping("/layout")
    public FormLayout getFormLayout(@RequestParam String fileId) {
        return pdfService.getFormLayout(fileId);
    }

    @PostMapping("/fill")
    public ResponseEntity<byte[]> fillPdf(
            @RequestParam(required = false) String fileId,
            @RequestBody Map<String, String> data) {
        
        if (fileId == null || fileId.isEmpty()) {
            throw new RuntimeException("File ID is required");
        }
        
        try {
            byte[] filledPdf = pdfService.fillPdf(fileId, data);
            
            if (filledPdf == null || filledPdf.length == 0) {
                throw new RuntimeException("PDF generation failed - empty result");
            }
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "filled-form.pdf");
            headers.setContentLength(filledPdf.length);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(filledPdf);
        } catch (Exception e) {
            System.err.println("Error filling PDF: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to fill PDF: " + e.getMessage(), e);
        }
    }
}
