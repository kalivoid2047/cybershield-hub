import { Bar } from "react-chartjs-2";
import { chartColors, chartOptions } from "./ChartShell.jsx";

export default function BarMetricChart({ labels, values, label = "Count" }) {
  return (
    <div className="h-72">
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
    </div>
  );
}
