package com.cvbuilder.dto;

import lombok.Data;

@Data
public class GeneratedCvResponse {
    private Long cvId;
    private String templateName;
    private String content; // ATS uyumlu CV içeriği
}
