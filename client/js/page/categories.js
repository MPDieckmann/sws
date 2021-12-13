/// <reference path="../client.d.ts" />
function generateCategoryColor(name) {
    if (/auslagen/i.test(name)) {
        return "#004400";
    }
    else if (/lebensmittel/i.test(name)) {
        return "#00cc00";
    }
    else if (/genussmittel/i.test(name)) {
        return "#888800";
    }
    else if (/miete|studium|wc bedarf|bekleidung/i.test(name)) {
        return "#0070ba";
    }
    else if (/!!!! fehler !!!!/i.test(name)) {
        return "#ff0000";
    }
    else if (/taschengeld|zuschuss/i.test(name)) {
        return "#008800";
    }
    else {
        return "#" + Math.round(Math.random() * 170 + 16).toString(16) + Math.round(Math.random() * 170 + 16).toString(16) + Math.round(Math.random() * 170 + 16).toString(16);
    }
}
document.getElementsByName("chartjs-canvas").forEach(canvas => {
    let json = JSON.parse(canvas.nextElementSibling.textContent.trim());
    let labels = [];
    let values = json.values;
    Object.keys(values).forEach(categories => {
        values[categories].labels.forEach((label) => {
            if (labels.indexOf(label) == -1) {
                labels.push(label);
            }
        });
    });
    labels.sort();
    let datasets = Object.keys(values).map(category => {
        let data = labels.map(() => (0));
        values[category].values.forEach((value, index) => {
            data[labels.indexOf(values[category].labels[index])] = value;
        });
        return {
            fill: true,
            label: category,
            backgroundColor: generateCategoryColor(category) + "ff",
            borderColor: generateCategoryColor(category) + "ff",
            data: data,
            stack: "Stack 1"
        };
    });
    let kontostand_summe = 0;
    Object.keys(json.defaults).forEach(account => {
        kontostand_summe = Math.round((kontostand_summe + json.defaults[account]) * 100) / 100;
    });
    datasets.unshift({
        type: "line",
        pointRadius: 0,
        fill: true,
        lineTension: 0,
        borderWidth: 2,
        label: "Total",
        // backgroundColor: "#00000044",
        borderColor: "#ff000088",
        yAxisID: "Total",
        data: labels.map((y, index) => {
            datasets.forEach(dataset => {
                kontostand_summe = Math.round((kontostand_summe + dataset.data[index]) * 100) / 100;
            });
            return kontostand_summe;
        }),
        stack: "Stack 0"
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
                            callback(value) {
                                return value.toString().replace(".", ",") + " €";
                            }
                        },
                        stacked: true
                    }, {
                        id: "Total",
                        position: "right",
                        ticks: {
                            callback(value) {
                                return value.toString().replace(".", ",") + " €";
                            }
                        },
                        stacked: true
                    }],
                xAxes: [{
                        type: "time",
                        labels,
                        distribution: "series",
                        offset: true,
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
//# sourceMappingURL=categories.js.map