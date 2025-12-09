// src/main/java/com/cvbuilder/dto/UserProjectDTO.java
package com.cvbuilder.dto;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProjectDTO {
    private Long id;
    private String projectName;
    private String startDate;   // <-- String yaptık
    private String endDate;     // <-- String yaptık
    private Boolean isOngoing;
}