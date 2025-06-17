package com.example.dynamicpdfformfiller.service;

import com.example.dynamicpdfformfiller.model.Field;
import com.example.dynamicpdfformfiller.model.FormLayout;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.interactive.form.PDAcroForm;
import org.apache.pdfbox.pdmodel.interactive.form.PDTextField;
import org.apache.pdfbox.pdmodel.interactive.form.PDButton;
import org.apache.pdfbox.pdmodel.interactive.form.PDChoice;
import org.apache.pdfbox.pdmodel.interactive.form.PDNonTerminalField;
import org.apache.pdfbox.io.MemoryUsageSetting;
import org.apache.pdfbox.cos.COSDictionary;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.FileOutputStream;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PdfService {
    private final Map<String, byte[]> uploadedFiles = new ConcurrentHashMap<>();
    private int fileIdCounter = 0;

    public String uploadPdf(MultipartFile file) {
        String fileId = "file_" + fileIdCounter++;
        try {
            uploadedFiles.put(fileId, file.getBytes());
            return fileId;
        } catch (Exception e) {
            throw new RuntimeException("Failed to upload PDF", e);
        }
    }

    public FormLayout getFormLayout(String fileId) {
        byte[] pdfBytes = uploadedFiles.get(fileId);
        if (pdfBytes == null) {
            throw new RuntimeException("File not found: " + fileId);
        }

        try (PDDocument document = PDDocument.load(new ByteArrayInputStream(pdfBytes), MemoryUsageSetting.setupTempFileOnly())) {
            FormLayout layout = new FormLayout();
            layout.setFileId(fileId);
            layout.setFields(extractFields(document));
            return layout;
        } catch (Exception e) {
            throw new RuntimeException("Failed to extract form fields", e);
        }
    }

    private List<Field> extractFields(PDDocument document) {
        List<Field> fields = new ArrayList<>();
        PDAcroForm form = document.getDocumentCatalog().getAcroForm();
        if (form == null) {
            return fields;
        }

        form.getFields().forEach(field -> {
            Field fieldModel = new Field();
            fieldModel.setId(field.getPartialName());
            fieldModel.setLabel(field.getPartialName());
            fieldModel.setType(getFieldType(field));
            // TODO: Implement page and rect extraction
            fieldModel.setPage(1);
            fieldModel.setRect(Arrays.asList(0.0, 0.0, 0.0, 0.0));
            fields.add(fieldModel);
        });

        return fields;
    }

    private String getFieldType(org.apache.pdfbox.pdmodel.interactive.form.PDField field) {
        if (field instanceof PDTextField) {
            return "text";
        } else if (field instanceof PDButton) {
            PDButton button = (PDButton) field;
            COSDictionary dict = button.getCOSObject();
            String fieldType = dict.getNameAsString("FT");
            if (fieldType != null && fieldType.equals("Btn")) {
                String type = dict.getNameAsString("Type");
                if (type != null) {
                    if (type.equals("Check")) {
                        return "checkbox";
                    } else if (type.equals("Radio")) {
                        return "radio";
                    }
                }
            }
        } else if (field instanceof PDChoice) {
            return "combo";
        }
        return "text";
    }

    public byte[] fillPdf(String fileId, Map<String, String> formData) {
        byte[] pdfBytes = uploadedFiles.get(fileId);
        if (pdfBytes == null) {
            throw new RuntimeException("File not found: " + fileId);
        }

        try (PDDocument document = PDDocument.load(new ByteArrayInputStream(pdfBytes), MemoryUsageSetting.setupTempFileOnly());
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            PDAcroForm form = document.getDocumentCatalog().getAcroForm();
            if (form == null) {
                throw new RuntimeException("No form found in PDF");
            }

            // Set need appearances before modifying fields
            form.setNeedAppearances(true);

            // Get all fields and their children
            List<org.apache.pdfbox.pdmodel.interactive.form.PDField> allFields = new ArrayList<>();
            form.getFields().forEach(field -> {
                if (field instanceof PDNonTerminalField) {
                    ((PDNonTerminalField) field).getChildren().forEach(allFields::add);
                } else {
                    allFields.add(field);
                }
            });

            // Process each field
            allFields.forEach(field -> {
                String fieldName = field.getPartialName();
                String value = formData.get(fieldName);
                
                if (value != null) {
                    try {
                        if (field instanceof PDTextField) {
                            PDTextField textField = (PDTextField) field;
                            textField.setValue(value);
                        } else if (field instanceof PDButton) {
                            PDButton button = (PDButton) field;
                            String fieldType = button.getCOSObject().getNameAsString("FT");
                            if (fieldType != null && fieldType.equals("Btn")) {
                                String type = button.getCOSObject().getNameAsString("Type");
                                if (type != null && type.equals("Check")) {
                                    button.setValue(value.equals("true") ? "Yes" : "Off");
                                } else if (type.equals("Radio")) {
                                    button.setValue(value);
                                }
                            }
                        } else if (field instanceof PDChoice) {
                            PDChoice choice = (PDChoice) field;
                            choice.setValue(value);
                        }
                    } catch (Exception e) {
                        System.err.println("Error setting field: " + fieldName + " - " + e.getMessage());
                        e.printStackTrace();
                    }
                }
            });

            // Refresh appearances after setting all values
            form.refreshAppearances();
            
            // Save the document
            document.saveIncremental(baos);
            
            // Return the final byte array
            byte[] result = baos.toByteArray();
            if (result == null || result.length == 0) {
                throw new RuntimeException("Failed to generate PDF - empty result");
            }
            return result;
        } catch (Exception e) {
            System.err.println("Error filling PDF: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to fill PDF: " + e.getMessage(), e);
        }
        }
    }
}
