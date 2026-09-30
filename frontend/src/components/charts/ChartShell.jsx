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

// Wraps a canvas chart so it has a text equivalent: the canvas is hidden from
// assistive tech and replaced by a data table. Empty data shows a message
// instead of an empty axis.
export function ChartFrame({ labels = [], values = [], label = "Value", title, children, className = "h-72" }) {
  const hasData = values.some((value) => Number(value) > 0);
  return (
    <figure className="m-0">
      {hasData ? (
        <div className={className} aria-hidden="true">
          {children}
        </div>
      ) : (
        <div className={`${className} flex items-center justify-center rounded-md border border-dashed border-white/10 text-sm text-slate-400`}>No data to show yet.</div>
      )}
      <table className="sr-only">
        <caption>{title || `${label} by category`}</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">{label}</th>
          </tr>
        </thead>
        <tbody>
          {labels.map((name, index) => (
            <tr key={`${name}-${index}`}>
              <th scope="row">{name}</th>
              <td>{values[index]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
