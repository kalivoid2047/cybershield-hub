import { Doughnut } from "react-chartjs-2";
import { chartColors } from "./ChartShell.jsx";

export default function DoughnutChart({ labels, values }) {
  return (
    <div className="h-72">
      <Doughnut
        options={{
          responsive: true,
          maintainAspectRatio: false,
          cutout: "68%",
          plugins: {
            legend: {
              position: "bottom",
              labels: { color: "#b8c7d9", usePointStyle: true, boxWidth: 10 },
            },
          },
        }}
        data={{
          labels,
          datasets: [{ data: values, backgroundColor: chartColors(0.78), borderWidth: 0 }],
        }}
      />
    </div>
  );
}
