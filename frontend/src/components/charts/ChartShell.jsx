import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, RadialLinearScale, Filler, Tooltip, Legend);

export const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: "#b8c7d9",
        boxWidth: 10,
        usePointStyle: true,
      },
    },
    tooltip: {
      backgroundColor: "rgba(5, 9, 20, .94)",
      borderColor: "rgba(45, 212, 255, .24)",
      borderWidth: 1,
      titleColor: "#fff",
      bodyColor: "#cbd5e1",
    },
  },
  scales: {
    x: {
      grid: { color: "rgba(148, 163, 184, .08)" },
      ticks: { color: "#94a3b8" },
    },
    y: {
      grid: { color: "rgba(148, 163, 184, .08)" },
      ticks: { color: "#94a3b8" },
    },
  },
};

export function chartColors(alpha = 0.82) {
  return [`rgba(45, 212, 255, ${alpha})`, `rgba(46, 229, 157, ${alpha})`, `rgba(246, 196, 83, ${alpha})`, `rgba(255, 91, 122, ${alpha})`];
}
