interface Props {
  dinnerName: string | null;
}

const missingItems = ["Tej", "Tojás"];

export default function ShoppingAlert({ dinnerName }: Props) {
  return (
    <div className="w-full bg-error-container/20 border border-error/20 p-5 md:p-6 rounded-3xl ambient-shadow flex flex-col md:flex-row items-center justify-between gap-6 group hover:border-error/40 transition-colors">
      <div className="flex items-center gap-4 w-full md:w-auto">
        <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center shrink-0 border border-error/20 group-hover:scale-105 transition-transform">
          <span className="material-symbols-outlined">shopping_cart</span>
        </div>
        <div>
          <h4 className="text-lg font-semibold text-on-surface flex flex-wrap items-center gap-2">
            Kritikus hiány
            {dinnerName && (
              <span className="px-2 py-0.5 bg-surface-variant/80 text-on-surface-variant text-[10px] font-bold rounded-full uppercase tracking-wider">
                {dinnerName}
              </span>
            )}
          </h4>
          <p className="text-sm font-medium text-outline">
            {missingItems.length} tétel hiányzik a bevásárlólistáról{" "}
            <span className="text-error font-bold ml-1">(85% kész)</span>
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
        <div className="flex gap-2">
          {missingItems.map((item) => (
            <span
              key={item}
              className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-sm font-bold text-on-surface border border-surface-variant/50 flex items-center gap-1.5 shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-error" />
              {item}
            </span>
          ))}
        </div>
        <button className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-[#2a3a2d] text-white text-[13px] font-semibold hover:bg-[#202d23] transition-all shadow-[0_8px_20px_rgba(42,58,45,0.35)] hover:shadow-[0_12px_24px_rgba(42,58,45,0.45)] hover:-translate-y-0.5 flex items-center justify-center gap-2 whitespace-nowrap active:scale-95 cursor-pointer">
          <span className="material-symbols-outlined text-[18px]">local_shipping</span>
          Rendelés leadása
        </button>
      </div>
    </div>
  );
}
