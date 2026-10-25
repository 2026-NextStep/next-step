package com.nextstep.backend.coverletter.agent;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/** JSON 을 읽은 결과(Map/List/값)에서 안전하게 값을 꺼내는 도구. 모델이 형식을 틀려도 예외 대신 기본값을 돌려준다. */
final class JsonTree {

    private JsonTree() {}

    @SuppressWarnings("unchecked")
    static Map<String, Object> obj(Object o) {
        return o instanceof Map<?, ?> ? (Map<String, Object>) o : Collections.emptyMap();
    }

    @SuppressWarnings("unchecked")
    static List<Object> list(Object o) {
        return o instanceof List<?> ? (List<Object>) o : Collections.emptyList();
    }

    static String str(Object node, String key) {
        Object v = obj(node).get(key);
        return v == null ? "" : String.valueOf(v).trim();
    }

    static int intVal(Object node, String key, int def) {
        Object v = obj(node).get(key);
        if (v instanceof Number n) return (int) Math.round(n.doubleValue());
        if (v instanceof String s) {
            try {
                return (int) Math.round(Double.parseDouble(s.trim()));
            } catch (NumberFormatException e) {
                return def;
            }
        }
        return def;
    }

    static boolean bool(Object node, String key, boolean def) {
        Object v = obj(node).get(key);
        if (v instanceof Boolean b) return b;
        if (v instanceof String s) return "true".equalsIgnoreCase(s.trim());
        return def;
    }

    /** 문자열 배열. 문자열이 아닌 항목과 빈 문자열은 버린다 */
    static List<String> strings(Object node, String key) {
        List<String> out = new ArrayList<>();
        for (Object item : list(obj(node).get(key))) {
            if (item != null) {
                String s = String.valueOf(item).trim();
                if (!s.isEmpty()) out.add(s);
            }
        }
        return out;
    }
}