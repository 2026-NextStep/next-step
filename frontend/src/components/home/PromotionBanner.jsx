export default function PromotionBanner({ banner }) {
  return (
    <div
      className="relative w-full h-72 rounded-2xl overflow-hidden"
      style={{ backgroundImage: 'url(/images/banner.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* 텍스트 가독성을 위한 좌측 어두운 그라디언트 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent" />

      {/* 좌측 텍스트 콘텐츠 */}
      <div className="absolute inset-0 flex flex-col justify-center pl-12 z-10">
        <span className="inline-flex w-fit items-center bg-blue-500 text-white text-xs font-semibold px-2.5 py-1 rounded-md mb-5">
          {banner.badge}
        </span>
        <h1 className="text-3xl font-bold text-white leading-snug mb-3 whitespace-pre-line">
          {banner.title}
        </h1>
        <p className="text-sm text-slate-300">{banner.subtitle}</p>
      </div>
    </div>
  )
}
