import { Radar } from "react-chartjs-2";

export default function RadarScoreChart({ labels, values }) {
  return (
    <div className="h-72">
      <Radar
        options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              min: 0,
              max: 100,
              grid: { color: "rgba(148, 163, 184, .16)" },
              angleLines: { color: "rgba(148, 163, 184, .12)" },
              pointLabels: { color: "#cbd5e1", font: { size: 11 } },
              ticks: { color: "#94a3b8", backdropColor: "transparent" },
            },
          },
          plugins: { legend: { display: false } },
        }}
        data={{
          labels,
          datasets: [
            {
              label: "Competency",
              data: values,
              borderColor: "#2ee59d",
              backgroundColor: "rgba(46, 229, 157, .2)",
              pointBackgroundColor: "#2ee59d",
            },
          ],
        }}
      />
    </div>
  );
}
