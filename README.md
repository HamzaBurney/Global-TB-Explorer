# 🌍 Global TB Explorer

**Global TB Explorer** is an interactive data visualization dashboard built using **D3.js** that explores the global impact of **Tuberculosis (TB)** from **2000 to 2020**. The project offers an intuitive interface to analyze TB-related mortality across different regions, subregions, and countries using multiple chart types.

---

## 📊 Visualizations

The dashboard includes the following interactive charts:

- **Sunburst Chart** – Hierarchical breakdown by Region → Subregion → Country.
- **Treemap** – Zoomable layout showing TB death distribution across geographic levels.
- **Force-Directed Graph** – Network of countries by TB deaths and geographic relationships.
- **Map Chart** – Geospatial bubble map of countries colored by region.
- **Timeline Bubble Chart** – TB deaths over time relative to population and life expectancy.

Each visualization supports filtering by **year**, **region**, and includes **tooltips**, **zoom/pan**, and **export** functionality (PNG, JPEG, SVG).

---

## 🗂️ Dataset

The data is derived from a cleaned and preprocessed version of a CSV file containing:

```
iso3, year, causename, Deaths, Country, region, subregion
```

The visualizations focus specifically on **Tuberculosis**-related death counts.

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/global-tb-explorer.git
cd global-tb-explorer
```

### 2. Open the dashboard

Simply open `dashboard.html` in your browser. No server required.

> ⚠️ Make sure the supporting JS files (`sunburst.js`, `treemap.js`, `mapchart.js`, `forcedirected.js`, `timeline.js`) and dataset folders (`Sunburst_Treemap_Dataset`, `MapChart_Dataset`, etc.) are in the same directory.

## 🧰 Built With

- [D3.js v7](https://d3js.org/)
- [HTML5/CSS3](https://developer.mozilla.org/en-US/docs/Web)

---

## 🧑‍💻 Author

[Hamza Burney](https://github.com/HamzaBurney)

---
