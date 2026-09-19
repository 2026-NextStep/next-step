REQUIRED_ITEMS: dict[str, list[str]] = {
    "임금": ["임금", "급여", "월급", "연봉"],
    "지급일": ["지급일", "매월"],
    "근로시간": ["근로시간", "근무시간", "휴게시간"],
    "근무장소": ["근무지", "근무 장소"],
    "계약기간": ["계약기간", "근로계약기간"],
}


def check_required_items(ocr_text: str) -> list[str]:
    missing: list[str] = []
    for item, keywords in REQUIRED_ITEMS.items():
        if not any(keyword in ocr_text for keyword in keywords):
            missing.append(item)
    return missing
