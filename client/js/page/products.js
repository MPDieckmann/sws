/// <reference path="../client.d.ts" />
document.getElementsByName("chartjs-canvas").forEach(canvas => {
    const personColors = {
        default: "#551285",
        "Aldi": "#001e78",
        "Rewe": "#cc071e",
        "Feinbäckerei Thiele": "#ffd400",
        "Amazon": "#ff9900",
        "Alnatura Super Natur Markt": "#b6cd35",
        "congstar": "#000000",
        "Sparkasse": "#ff0000",
        "Galeria Karstadt Kaufhof": "#015f6b",
        "Rossmann": "#c3002d",
        "TEDi": "#007bc1",
        "Saturn": "#eb680b",
        "Edeka": "#fce531",
        "Biomarkt": "#009347",
    };
    let json = JSON.parse(canvas.nextElementSibling.textContent.trim());
    new Chart(canvas.getContext('2d'), {
        type: "line",
        data: {
            datasets: Object.keys(json).map(person => ({
                label: person,
                backgroundColor: (person in personColors ? personColors[person] : personColors.default) + "40",
                borderColor: (person in personColors ? personColors[person] : personColors.default) + "ff",
                data: json[person]
            })),
        },
        options: {
            tooltips: {
                mode: "nearest",
                intersect: false,
                callbacks: {
                    title(tooltipItems) {
                        return moment(tooltipItems[0].label).format("DD. MMMM YYYY");
                    },
                    label(tooltipItem, data) {
                        let rtn = data.datasets[tooltipItem.datasetIndex].label + ": " + Number(tooltipItem.value).toFloatingString(2).replace(".", ",") + " €";
                        let item = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
                        if (item.unit) {
                            rtn += " (" + item.quantity + " " + item.unit + ")";
                        }
                        return rtn;
                    }
                },
            },
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                yAxes: [{
                        ticks: {
                            stepSize: 0.5,
                            maxTicksLimit: 10,
                            callback(value) {
                                return value.toString().replace(".", ",") + " €";
                            }
                        }
                    }],
                xAxes: [{
                        type: "time",
                        // labels: json.labels,
                        distribution: "series",
                        time: {
                            unit: "day",
                            displayFormats: {
                                datetime: "DD. MMMM YYYY",
                                millisecond: "HH:mm:ss.SSS",
                                second: "HH:mm:ss",
                                minute: "HH:mm",
                                hour: "HH",
                                day: " DD. MMM",
                                week: "DD.MM.YYYY",
                                month: "MMM YYYY",
                                quarter: "[Q]Q - YYYY",
                                year: "YYYY"
                            }
                        }
                    }]
            }
        }
    });
});
//# sourceMappingURL=products.js.map