package com.nextstep.backend.contract.dto.fastapi;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class FastApiBasicInfo {

    @JsonProperty("company_name")
    private String companyName;

    @JsonProperty("employer_name")
    private String employerName;

    @JsonProperty("probation_period")
    private String probationPeriod;

    @JsonProperty("employer_address")
    private String employerAddress;

    @JsonProperty("employer_contact")
    private String employerContact;

    @JsonProperty("employee_name")
    private String employeeName;

    @JsonProperty("work_location")
    private String workLocation;

    @JsonProperty("work_period")
    private String workPeriod;

    @JsonProperty("job_description")
    private String jobDescription;

    @JsonProperty("work_hours")
    private String workHours;
}