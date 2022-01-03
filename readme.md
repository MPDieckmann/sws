# SWS (ServiceWorkerServer)

## To do

- apiFetch-Plugin soll eine Extension sein, die optional mit eingebunden werden kann, aber nicht muss.
- login-Plugin soll eine Extension sein, die optional mit eingebunden werden kann, aber nicht muss.
- login-Plugin soll auf apiFetch-Plugin aufbauen, benötigt diese also zwingend.
- Erstelle einen Ordner "plugins", in dem die Extensions abgelegt sind.
- Modifiziere tsconfig.json so, dass nur die /server/index.ts als Source-Datei genommen wird. Alles andere soll als Dependenzien dann automatisch eingebunden werden.
- Erstelle eine Offline-Login-Plugin, die einfach nur eine lokale Benutzerverwaltung ist. Diese Offline-Login-Plugin darf nicht mit der login-API gleichzeitig verwendet werden.
- Erstelle ein Backend-Plugin, mit dem der ServiceWorkerServer verwaltet werden kann:
  - Versuche eine ServiceWorker.js-Datei entweder so einzubinden, dass sie durch den lokalen Cache geupdated werden kann.
  - Oder versuche die ServiceWorker.js-Datei so zu formulieren, dass sie aus der Datenbank Einträge und Routes lesen kann.

- Beim Starten des SWS wird aus der Datenbank oder dem Cache (am besten Cache) eine Manifest-Datei gelesen, die angibt, welche Scripte aus dem Cache geladen werden sollen, die den entsprechenden Code (sprich Routes nachlädt). Dies muss nach jeder activate-Step gemacht werden.
