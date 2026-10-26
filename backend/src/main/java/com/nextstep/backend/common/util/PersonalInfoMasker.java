package com.nextstep.backend.common.util;

import java.util.regex.Pattern;

/**
 * 글에 올리기 전에 개인정보 형태의 문자열을 가린다.
 *  - 주민등록번호  900101-1234567  →  ******-*******
 *  - 전화번호      010-1234-5678   →  010-****-****   (지역번호/휴대폰 앞자리만 남김)
 *  - 국제 전화     +82 10-1234-5678 →  +82 **-****-****
 *  - 이메일        abc@gmail.com   →  ***@gmail.com
 *
 * 이름, 주소, 학교명처럼 정해진 모양이 없는 정보는 자동으로 찾을 수 없어서 가리지 않는다.
 */
public class PersonalInfoMasker {

    private PersonalInfoMasker() {}

    // 숫자 사이의 구분은 하이픈/점/공백(스페이스)만 허용한다. (줄바꿈은 구분으로 보지 않는다)
    private static final Pattern RRN =
            Pattern.compile("(?<!\\d)\\d{6}[- ]?[1-4]\\d{6}(?!\\d)");

    private static final Pattern PHONE_INTL =
            Pattern.compile("\\+82[-. ]?0?\\d{1,2}[-. ]?\\d{3,4}[-. ]?\\d{4}(?!\\d)");

    private static final Pattern PHONE =
            Pattern.compile("(?<!\\d)(0\\d{1,2})[-. ]?\\d{3,4}[-. ]?\\d{4}(?!\\d)");

    private static final Pattern EMAIL =
            Pattern.compile("[A-Za-z0-9._%+\\-]+@([A-Za-z0-9.\\-]+\\.[A-Za-z]{2,})");

    public static String mask(String text) {
        if (text == null || text.isEmpty()) return text;

        // 주민번호를 전화번호보다 먼저 처리한다. (0으로 시작하는 주민번호가 전화번호로 오인되지 않도록)
        String result = RRN.matcher(text).replaceAll("******-*******");
        result = PHONE_INTL.matcher(result).replaceAll("+82 **-****-****");
        result = PHONE.matcher(result).replaceAll("$1-****-****");
        result = EMAIL.matcher(result).replaceAll("***@$1");
        return result;
    }
}