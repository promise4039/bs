// 뱅크샐러드 스타일 지출 속도 라인 차트 컴포넌트
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

interface DatasetConfig {
  label: string;
  data: number[];
  color: string;
  dashed?: boolean;
}

export interface SpendingLineChartProps {
  datasets: DatasetConfig[];
  xLabels: string[];
  height?: number;
  className?: string;
}

// 커스텀 툴팁
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; color: string; name: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-bg-elevated border border-border-primary rounded-xl px-3 py-2">
      <p className="text-text-secondary text-xs mb-1">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {entry.value.toLocaleString()}원
        </p>
      ))}
    </div>
  );
}

export function SpendingLineChart({
  datasets,
  xLabels,
  height = 200,
  className,
}: SpendingLineChartProps) {
  // xLabels 기준으로 데이터 구조 변환 (Recharts는 배열-of-objects 형태 필요)
  const chartData = xLabels.map((label, i) => {
    const point: Record<string, string | number> = { name: label };
    datasets.forEach((ds) => {
      point[ds.label] = ds.data[i] ?? 0;
    });
    return point;
  });

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2c2c2e" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#636366', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#636366', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={50}
            tickFormatter={(v: number) => `${v / 10000}`}
          />
          <Tooltip content={<CustomTooltip />} />
          {datasets.map((ds) => (
            <Line
              key={ds.label}
              type="monotone"
              dataKey={ds.label}
              name={ds.label}
              stroke={ds.color}
              strokeWidth={2}
              dot={false}
              strokeDasharray={ds.dashed ? '5 5' : undefined}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
