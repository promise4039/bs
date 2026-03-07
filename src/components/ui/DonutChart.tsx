// 뱅크샐러드 스타일 도넛 차트 컴포넌트
import { PieChart, Pie, Cell } from 'recharts';

interface DonutChartData {
  label: string;
  value: number;
  color: string;
}

export interface DonutChartProps {
  data: DonutChartData[];
  centerLabel?: string;
  centerValue?: string;
  size?: number;
  onSegmentClick?: (label: string) => void;
}

export function DonutChart({
  data,
  centerLabel,
  centerValue,
  size = 200,
  onSegmentClick,
}: DonutChartProps) {
  // 0인 값 제외
  const filteredData = data.filter((d) => d.value > 0);

  const innerRadius = size * 0.35;
  const outerRadius = size * 0.47;

  return (
    <PieChart width={size} height={size}>
      <Pie
        data={filteredData}
        cx={size / 2}
        cy={size / 2}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        paddingAngle={2}
        dataKey="value"
        nameKey="label"
        strokeWidth={0}
        onClick={(_, index) => {
          if (onSegmentClick && filteredData[index]) {
            onSegmentClick(filteredData[index].label);
          }
        }}
        style={{ cursor: onSegmentClick ? 'pointer' : 'default' }}
      >
        {filteredData.map((item, index) => (
          <Cell key={`cell-${index}`} fill={item.color} />
        ))}
      </Pie>

      {/* 중앙 텍스트 */}
      {(centerLabel || centerValue) && (
        <>
          {centerLabel && (
            <text
              x={size / 2}
              y={centerValue ? size / 2 - 10 : size / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#8e8e93"
              fontSize={12}
            >
              {centerLabel}
            </text>
          )}
          {centerValue && (
            <text
              x={size / 2}
              y={centerLabel ? size / 2 + 12 : size / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#ffffff"
              fontSize={16}
              fontWeight="bold"
            >
              {centerValue}
            </text>
          )}
        </>
      )}
    </PieChart>
  );
}
