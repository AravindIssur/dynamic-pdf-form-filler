package com.example.dynamicpdfformfiller.model;

import java.util.List;

public class Field {
    private String id;
    private String label;
    private String type;
    private int page;
    private List<Double> rect;

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public int getPage() { return page; }
    public void setPage(int page) { this.page = page; }

    public List<Double> getRect() { return rect; }
    public void setRect(List<Double> rect) { this.rect = rect; }
}
