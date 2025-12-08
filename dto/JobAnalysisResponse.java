package com.cvbuilder.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder // <--- BU SATIR ÇOK ÖNEMLİ (Builder hatasını çözer)
@AllArgsConstructor
@NoArgsConstructor
public class JobAnalysisResponse {
    private Long jobId;
    private List<String> matchedSkills;
    private List<String> missingSkills;
    private String formattedAnalysis; // <--- Raporun metni burada taşınacak
}