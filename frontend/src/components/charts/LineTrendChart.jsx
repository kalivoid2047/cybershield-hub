import { Line } from "react-chartjs-2";
import { chartOptions, ChartFrame } from "./ChartShell.jsx";

export default function LineTrendChart({ labels, values, label = "Incidents" }) {
  return (
    <ChartFrame labels={labels} values={values} label={label}>
      <Line
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
              borderColor: "rgba(45, 212, 255, .9)",
              backgroundColor: "rgba(45, 212, 255, .16)",
              tension: 0.38,
              fill: true,
              pointBackgroundColor: "#2dd4ff",
            },
          ],
        }}
      />
    </ChartFrame>
  );
}
