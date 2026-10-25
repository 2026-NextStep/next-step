from typing import List, Optional

from pydantic import BaseModel


class KeyClause(BaseModel):
    title: str
    content: str
    importance: str  # "HIGH" | "MEDIUM" | "LOW"


class Risk(BaseModel):
    type: str
    description: str          # 무엇이 문제인지 (2~3문장)
    reason: str               # 왜 위험한지 + 예상 불이익 (2~3문장)
    recommendation: str       # 어떻게 대응할지 (1~2문장)
    severity: str             # "HIGH" | "MEDIUM" | "LOW"
    clause_reference: Optional[str] = None


class BasicInfoSchema(BaseModel):
    company_name: Optional[str] = None
    employer_name: Optional[str] = None
    employer_address: Optional[str] = None
    employer_contact: Optional[str] = None
    employee_name: Optional[str] = None
    work_location: Optional[str] = None
    work_period: Optional[str] = None
    job_description: Optional[str] = None
    work_hours: Optional[str] = None
    probation_period: Optional[str] = None
    employment_type: Optional[str] = None


class SalaryBreakdownSchema(BaseModel):
    gross_salary: Optional[int] = None
    note: Optional[str] = None


class PrecautionSchema(BaseModel):
    title: str
    description: str


class AnalyzeResponse(BaseModel):
    success: bool
    ocr_text: str
    summary: str
    risk_level: str                                     # "LOW" | "MEDIUM" | "HIGH"
    risk_score: int                                     # 0~100
    key_clauses: List[KeyClause] = []
    risks: List[Risk] = []
    recommendations: List[str] = []
    basic_info: Optional[BasicInfoSchema] = None
    salary_breakdown: Optional[SalaryBreakdownSchema] = None
    precautions: List[PrecautionSchema] = []
    questions_for_recruiter: List[str] = []