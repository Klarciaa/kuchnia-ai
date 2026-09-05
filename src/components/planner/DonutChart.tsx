interface DonutChartProps {
  consumedKcal: number;
  targetKcal: number;
}

export function DonutChart({ consumedKcal, targetKcal }: DonutChartProps) {
  const remaining = Math.max(0, targetKcal - consumedKcal);
  const ratio = targetKcal > 0 ? Math.min(1, consumedKcal / targetKcal) : 0;

  // SVG parameters
  const size = 140;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - ratio * circumference;

  const isOver = consumedKcal > targetKcal;

  return (
    <div className="relative flex items-center justify-center" id="planner-donut-chart">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#F3ECEB"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress stroke */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isOver ? '#E11D48' : '#F43F5E'}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[10px] uppercase font-semibold text-stone-400 tracking-wider">
          {isOver ? 'Przekroczono' : 'Pozostało'}
        </span>
        <span className={`text-2xl font-bold tracking-tight ${isOver ? 'text-rose-600' : 'text-stone-900'}`}>
          {isOver ? consumedKcal - targetKcal : remaining}
        </span>
        <span className="text-[10px] text-stone-500 font-medium">
          z {targetKcal} kcal
        </span>
      </div>
    </div>
  );
}
