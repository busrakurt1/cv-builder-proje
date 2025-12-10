package com.cvbuilder.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserEducationDTO {

    private String university;      // educationSchool
    //private String degree;          // educationDegree
    //private String field;           // educationDepartment
    private String startYear;       // educationStartYear
    private String graduationYear;  // educationEndYear veya "Present"
}
