"use client";
import {Chart as ChartJS, ArcElement, Tooltip, Legend} from 'chart.js'
import {Doughnut} from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend);

const DoughnutChart = ({accounts}: DoughnutChartProps) => {

    const data = {
        datasets: [
            {
                label: "Banks",
                data: [1250, 2500, 3750],
                backgroundColor: [
                    "#0747b6", "#2265d8", "#2f91fa"
                ]
            }
        ],
        labels: ["Bank 1", "Bank 2", "Bank 3"]
    }

  return (
    <div className="w-full h-full min-h-[100px] min-w-[100px] max-w-[120px] max-h-[120px]">
        <Doughnut 
          data={data} 
          options={{
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
              legend: {
                display: false
              }
            }
          }}
        />
    </div>
  )
}

export default DoughnutChart
