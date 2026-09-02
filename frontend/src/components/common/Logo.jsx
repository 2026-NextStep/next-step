import { Link } from 'react-router-dom'

/**
 * 3D isometric 계단 3단 로고
 *
 * 각 단: 윗면(밝은 파랑) + 앞면(진한 파랑)
 * 공통 isometric 오프셋: 오른쪽+4, 위+4
 * 공통 바닥선: y=32
 *
 * 단별 높이: 7 / 14 / 21 (1:2:3)
 * 단 너비: 9px, 간격: 3px
 */
export default function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 shrink-0">
      <svg
        width="34"
        height="34"
        viewBox="0 0 40 40"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* ── 1단 (좌측, 가장 낮음, h=7) ── */}
        <polygon points="1,25 10,25 14,21 5,21" fill="#93c5fd" />
        <polygon points="1,25 10,25 10,32 1,32" fill="#3b82f6" />

        {/* ── 2단 (중앙, h=14) ── */}
        <polygon points="13,18 22,18 26,14 17,14" fill="#93c5fd" />
        <polygon points="13,18 22,18 22,32 13,32" fill="#3b82f6" />

        {/* ── 3단 (우측, 가장 높음, h=21) ── */}
        <polygon points="25,11 34,11 38,7 29,7" fill="#93c5fd" />
        <polygon points="25,11 34,11 34,32 25,32" fill="#3b82f6" />
      </svg>

      <span className="text-gray-900 font-bold text-lg">NextStep</span>
    </Link>
  )
}