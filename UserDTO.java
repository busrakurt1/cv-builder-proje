package com.cvbuilder.dto;

import lombok.Data;
import java.util.Set;

@Data
public class UserDTO {
    private Long id;
    private String email;
    private String fullName;
    private String title;
    private Integer experienceYears;
    private String summary;
    private String location;
    private String phone;
    private Set<UserSkillDTO> skills;
    // ❌ enabled alanını kaldır
}