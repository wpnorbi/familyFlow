"use client";

export interface MealSuccessData {
  recipeName: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  shoppingAdded: number;
  atHomeCount: number;
}

interface Props {
  data: MealSuccessData;
  onViewPlan: () => void;
}

function formatDate(dk: string) {
  return new Date(`${dk}T12:00:00`).toLocaleDateString("hu-HU", {
    month: "long",
    day: "numeric",
  });
}

// Coloured confetti squares scattered around the checkmark
const CONFETTI = [
  { color: "#B87040", x: "18%",  y: "8%",  r: "12deg"  },
  { color: "#4A7A40", x: "72%",  y: "4%",  r: "-8deg"  },
  { color: "#E8C49A", x: "84%",  y: "32%", r: "20deg"  },
  { color: "#C4A87A", x: "8%",   y: "38%", r: "-15deg" },
  { color: "#7AAD6A", x: "48%",  y: "0%",  r: "5deg"   },
  { color: "#D4A870", x: "32%",  y: "62%", r: "-22deg" },
  { color: "#98C890", x: "64%",  y: "68%", r: "18deg"  },
  { color: "#C87848", x: "90%",  y: "55%", r: "-10deg" },
  { color: "#A8D898", x: "5%",   y: "72%", r: "8deg"   },
];

export default function MealSuccessSheet({ data, onViewPlan }: Props) {
  const dateLabel =
    data.startDate === data.endDate
      ? formatDate(data.startDate)
      : `${formatDate(data.startDate)} – ${formatDate(data.endDate)}`;

  return (
    <div className="fixed inset-0 z-[90] flex items-end bg-black/44 backdrop-blur-sm md:hidden">
      <div
        className="relative w-full rounded-t-[28px] bg-[#F7F3EE] px-6 pt-8"
        style={{ paddingBottom: "calc(36px + env(safe-area-inset-bottom, 0px))" }}
      >
        {/* Celebration decoration */}
        <div className="relative mb-6 flex h-24 items-center justify-center">
          {CONFETTI.map((c, i) => (
            <div
              key={i}
              className="absolute h-2.5 w-2.5"
              style={{
                backgroundColor: c.color,
                left: c.x,
                top: c.y,
                transform: `rotate(${c.r})`,
                borderRadius: "3px",
              }}
            />
          ))}
          {/* Main checkmark circle */}
          <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-[#3B5C33] shadow-[0_8px_24px_rgba(59,92,51,0.36)]">
            <span
              className="material-symbols-outlined text-[32px] text-white"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check
            </span>
          </div>
        </div>

        {/* Title block */}
        <div className="mb-6 text-center">
          <h2 className="text-[26px] font-bold tracking-[-0.03em] text-[#1C1916]">Hozzáadva!</h2>
          <p className="mt-1 text-[15px] font-semibold text-[#3A3230]">{data.recipeName}</p>
          <p className="mt-0.5 text-[13px] text-[#7A6E64]">{dateLabel}</p>
        </div>

        {/* Info items */}
        <div className="mb-8 space-y-3.5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EDE8DF]">
              <span className="material-symbols-outlined text-[17px] text-[#5A4E44]">calendar_month</span>
            </div>
            <p className="text-[14px] text-[#3A3230]">
              {data.daysCount} napra került a heti tervbe
            </p>
          </div>

          {data.shoppingAdded > 0 && (
            <div className="flex items-center gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EDE8DF]">
                <span className="material-symbols-outlined text-[17px] text-[#5A4E44]">shopping_basket</span>
              </div>
              <p className="text-[14px] text-[#3A3230]">
                {data.shoppingAdded} hozzávaló a bevásárlólistára került
              </p>
            </div>
          )}

          {data.atHomeCount > 0 && (
            <div className="flex items-center gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EDE8DF]">
                <span className="material-symbols-outlined text-[17px] text-[#5A4E44]">check</span>
              </div>
              <p className="text-[14px] text-[#3A3230]">
                {data.atHomeCount} hozzávaló már van otthon
              </p>
            </div>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={onViewPlan}
          className="w-full rounded-[16px] bg-[#B87040] py-4 text-[16px] font-semibold text-white"
        >
          Szuper! Vissza a tervhez
        </button>
      </div>
    </div>
  );
}
