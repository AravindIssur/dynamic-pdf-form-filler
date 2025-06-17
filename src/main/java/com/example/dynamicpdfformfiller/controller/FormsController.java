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
            @RequestParam String fileId,
            @RequestBody Map<String, String> formData) {
        byte[] filledPdf = pdfService.fillPdf(fileId, formData);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "filled-form.pdf");
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(filledPdf);
    }
}
