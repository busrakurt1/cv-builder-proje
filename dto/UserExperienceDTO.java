package com.cvbuilder.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserExperienceDTO {

    private Long id;

    private String position;        // Pozisyon: Backend Developer
    private String company;         // Şirket adı
    private String city;            // Şehir / Remote
    private String startDate;       // "2023-02"
    private String endDate;         // "2024-06" veya "DEVAM"
    private String description;     // Sorumluluklar / başarılar
}
