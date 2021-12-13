/// <reference path="../client.d.ts" />
document.getElementsByName("chartjs-canvas").forEach(canvas => {
    const categoryColors = {
        default: "#551285",
        "Genussmittel": "#001e78",
        "Geschenk": "#cc071e",
        "Bekleidung": "#ffd400",
        "Technik": "#ff9900",
        "Lebensmittel": "#b6cd35",
        "Sport": "#000000",
        "WC Bedarf": "#ff0000",
        "Sonstiges": "#015f6b",
        "Mobilfunk": "#c3002d",
        "Sparschwein": "#007bc1",
        "Miete": "#eb680b",
    };
    let json = JSON.parse(canvas.nextElementSibling.textContent.trim());
    let labels = [];
    Object.keys(json).forEach(category => {
        json[category].labels.forEach((label) => {
            if (labels.indexOf(label) == -1) {
                labels.push(label);
            }
        });
    });
    labels.sort();
    let datasets = Object.keys(json).map(category => {
        let values = new Array(labels.length);
        values.fill(0, 0, labels.length);
        json[category].values.forEach((value, index) => {
            values[labels.indexOf(json[category].labels[index])] = value;
        });
        return {
            label: category,
            backgroundColor: (category in categoryColors ? categoryColors[category] : categoryColors.default) + "ff",
            // borderColor: (category in categoryColors ? categoryColors[category] : categoryColors.default) + "ff",
            data: values
        };
    });
    new Chart(canvas.getContext('2d'), {
        type: "bar",
        data: {
            datasets
        },
        options: {
            tooltips: {
                mode: "index",
                intersect: false,
                callbacks: {
                    title(tooltipItems) {
                        return moment(labels[tooltipItems[0].index]).format("DD. MMMM YYYY");
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
                            // stepSize: 0.5,
                            // maxTicksLimit: 10,
                            callback(value) {
                                return value.toString().replace(".", ",") + " €";
                            }
                        },
                        stacked: true
                    }],
                xAxes: [{
                        // type: "linear",
                        type: "time",
                        labels,
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
                        },
                        stacked: true
                    }]
            }
        }
    });
});
//# sourceMappingURL=bills.js.map