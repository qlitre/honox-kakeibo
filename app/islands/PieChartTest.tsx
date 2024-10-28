import { ArcElement, Legend, Tooltip, Chart as chartJs } from 'chart.js'
import { Pie } from 'react-chartjs-2'

const Chart = () => {
    chartJs.register(ArcElement, Tooltip, Legend)
    chartJs.overrides.pie.plugins.legend.display = false
    const data = {
        labels: [
            '現金',
            '日本株式',
            '株式投信'
        ],
        datasets: [{
            label: 'My First Dataset',
            data: [300, 50, 100],
            backgroundColor: [
                'rgb(255, 99, 132)',
                'rgb(54, 162, 235)',
                'rgb(255, 205, 86)'
            ],
            hoverOffset: 4
        }]
    };
    if (!data) {
        return
    }

    return (
        <>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginTop: '40px',
                }}
            >
                <div
                    style={{
                        width: 700,
                        height: 300,
                        display: 'flex',
                        justifyContent: 'space-between',
                        flexBasis: '50%',
                    }}
                >
                    <div style={{ flexBasis: '50%' }}>
                        <Pie data={data} />
                    </div>
                    <div
                        id={'appleColors-legend'}
                        style={{
                            maxHeight: '100%',
                            overflowY: 'auto',
                            width: '200px',
                            padding: '10px',
                            boxSizing: 'border-box',
                            backgroundColor: '#f9f9f9',
                        }}
                    />
                </div>
            </div>
        </>
    )
}

export const PieChartTest = () => {
    return (
        <>
            <Chart />
        </>
    )
}