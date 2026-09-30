import { Bar } from "react-chartjs-2";
import { chartColors, chartOptions, ChartFrame } from "./ChartShell.jsx";

export default function BarMetricChart({ labels, values, label = "Count" }) {
  return (
    <ChartFrame labels={labels} values={values} label={label}>
      <Bar
        options={{
          ...chartOptions,
          plugins: { ...chartOptions.plugins, legend: { display: false } },
        }}
        data={{
          labels,
          datasets: [
            {
              label,
              data: values,
              backgroundColor: chartColors(0.72),
              borderRadius: 6,
            },
          ],
        }}
      />
    </ChartFrame>
  );
}
