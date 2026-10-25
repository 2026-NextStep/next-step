/**
 * @typedef {'HIGH'|'MEDIUM'|'LOW'} RiskLevel
 */

/**
 * @typedef {Object} RiskItem
 * @property {number} id
 * @property {string} title
 * @property {RiskLevel} level
 * @property {string} description
 * @property {string} reason
 * @property {string} recommendation
 */

/**
 * @typedef {Object} SalaryBreakdown
 * @property {number} grossSalary
 * @property {number} nationalPension
 * @property {number} healthInsurance
 * @property {number} longTermCareInsurance
 * @property {number} employmentInsurance
 * @property {number} netSalary
 */

/**
 * @typedef {Object} ContractBasicInfo
 * @property {string} companyName
 * @property {string} position
 * @property {string} contractPeriod
 * @property {string} workingHours
 * @property {string} probationPeriod
 * @property {string} salary
 */

/**
 * @typedef {Object} Precaution
 * @property {string} title
 * @property {string} description
 */

/**
 * @typedef {Object} ContractAnalysis
 * @property {number} id
 * @property {string} fileName
 * @property {string} uploadedAt
 * @property {number} totalPages
 * @property {RiskLevel} overallRiskLevel
 * @property {number} riskItemCount
 * @property {number} highRiskCount
 * @property {number} mediumRiskCount
 * @property {number} checkItemCount
 * @property {string} checkItemNote
 * @property {string} contractSummary
 * @property {string} contractSummaryNote
 * @property {RiskItem[]} riskItems
 * @property {SalaryBreakdown} salaryBreakdown
 * @property {ContractBasicInfo} basicInfo
 * @property {Precaution[]} precautions
 * @property {string[]} questionsForRecruiter
 */