/// <reference path="../client.d.ts" />
document.getElementsByName("chartjs-canvas").forEach(canvas => {
    const accountColors = {
        default: "#551285",
        "PayPal": "#0070ba",
        "Amazon Pay": "#ff9900",
        "Google Pay": "#5f6368",
        "Bar": "#000000",
        "GiroPay": "#ff0000",
        "Mobiles Bezahlen": "#ff0000",
        "Konto": "#ff0000",
    };
    let json = JSON.parse(canvas.nextElementSibling.textContent.trim());
    let labels = [];
    Object.keys(json.values).forEach(account => {
        json.values[account].labels.forEach((label) => {
            if (labels.indexOf(label) == -1) {
                labels.push(label);
            }
        });
    });
    labels.sort();
    let datasets = Object.keys(json.values).map(account => {
        let values = labels.map(() => (0));
        json.values[account].values.forEach((value, index) => {
            values[labels.indexOf(json.values[account].labels[index])] = value;
        });
        return {
            fill: true,
            label: account,
            backgroundColor: (account in accountColors ? accountColors[account] : accountColors.default) + "ff",
            borderColor: (account in accountColors ? accountColors[account] : accountColors.default) + "ff",
            data: values,
            stack: "Stack 1"
        };
    });
    let kontostand = {
        Konto: 0,
        Bar: 0,
        Sparschwein: 0
    };
    let kontostand_summe = 0;
    Object.keys(json.defaults).forEach(account => {
        if (account in kontostand) {
            kontostand[account] = Math.round((kontostand[account] + json.defaults[account]) * 100) / 100;
        }
        else {
            kontostand.Konto = Math.round((kontostand.Konto + json.defaults[account]) * 100) / 100;
        }
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
    }, {
        type: "line",
        pointRadius: 0,
        fill: true,
        lineTension: 0,
        borderWidth: 2,
        label: "Bar",
        backgroundColor: "#00000044",
        borderColor: "#00000088",
        yAxisID: "Kontostand",
        data: labels.map((y, index) => {
            datasets.forEach(dataset => {
                if (dataset.label == "Bar") {
                    kontostand.Bar = Math.round((kontostand.Bar + dataset.data[index]) * 100) / 100;
                }
            });
            return kontostand.Bar;
        }),
        stack: "Stack 0"
    }, {
        type: "line",
        pointRadius: 0,
        fill: true,
        lineTension: 0,
        borderWidth: 2,
        label: "Sparschwein",
        backgroundColor: "#44cc7744",
        borderColor: "#44cc7788",
        yAxisID: "Kontostand",
        data: labels.map((y, index) => {
            datasets.forEach(dataset => {
                if (dataset.label == "Sparschwein") {
                    kontostand.Sparschwein = Math.round((kontostand.Sparschwein + dataset.data[index]) * 100) / 100;
                }
            });
            return kontostand.Sparschwein;
        }),
        stack: "Stack 0"
    }, {
        type: "line",
        pointRadius: 0,
        fill: true,
        lineTension: 0,
        borderWidth: 2,
        label: "Konto",
        backgroundColor: "#ff000044",
        borderColor: "#ff000088",
        yAxisID: "Kontostand",
        data: labels.map((y, index) => {
            datasets.forEach(dataset => {
                if (dataset.label == "Sparschwein" ||
                    dataset.label == "Bar") {
                    return;
                }
                kontostand.Konto = Math.round((kontostand.Konto + dataset.data[index]) * 100) / 100;
            });
            return kontostand.Konto;
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
                        id: "Kontostand",
                        position: "right",
                        ticks: {
                            callback(value) {
                                return value.toString().replace(".", ",") + " €";
                            }
                        },
                        stacked: true
                    }, {
                        id: "Total",
                        display: false,
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
//# sourceMappingURL=account-balance.js.map