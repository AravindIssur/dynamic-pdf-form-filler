package com.example.dynamicpdfformfiller.model;

import java.util.List;

public class FormLayout {
    private String fileId;
    private List<Field> fields;

    // Getters and Setters
    public String getFileId() { return fileId; }
    public void setFileId(String fileId) { this.fileId = fileId; }

    public List<Field> getFields() { return fields; }
    public void setFields(List<Field> fields) { this.fields = fields; }
}
