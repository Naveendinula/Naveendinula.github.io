# Portfolio content review and proposed copy

Reviewed 3 October 2026. Audience: a balanced mix of data engineering/analytics and BIM, digital twin, and building-performance reviewers.

Ownership and context confirmed by the author: all nine projects are independent personal projects, completed individually out of interest in their respective domains. Use a visible label such as **Independent personal project · Sole developer/researcher**, followed by the specific work performed. Do not imply client work, team delivery, or an operational deployment without separate evidence.

Approved publication scope: the Amsterdam reframing and individual contribution statements across all nine project pages, plus the portfolio-level personal-project context. Those revisions have been applied to the website source. The remaining project-specific corrections and summaries below are proposed copy, pending approval.

All nine projects linked from portfolio.html were reviewed on the public site. The review also checked local page content, project documentation, CSV/JSON datasets, screenshots, and the available linked public repositories. This is a content and evidence review; the models, simulations, and applications were not rerun.

## Overall assessment

The portfolio contains substantial work, but the information is not consistently sufficient for a reviewer yet. The strongest pages explain their methods in depth; the weaker pages provide either a generic description or a demo without enough context. The most urgent work is correcting contradictory or unsupported claims, rather than adding more technical detail.

Every project should make these five points easy to find near the beginning: the problem, your contribution, the method and data, the demonstrated outcome, and the limits of the evidence. Keep the detailed screenshots, architecture, and methodology farther down the page. Distinguish a working feature or simulated result from measured operational impact.

| Project | Assessment | Highest-priority revision |
| --- | --- | --- |
| Digital Twin | Substantial detail; credibility corrections needed | Correct graph counts, identify simulated occupancy, and repair setup instructions. |
| FM Readiness | Strong workflow; outcome and ownership underexplained | Add your role and the demonstrated sample-model audit result. |
| Wallacei Optimization | Strong study; key findings buried | Separate optimization objectives from subsequent daylight evaluation and qualify performance claims. |
| Chicago Permit Atlas | Useful demo; insufficient project framing | Add purpose, contribution, dataset scope, and accurate classification wording. |
| Chicago Energy Retrofit | Useful demo; important data limitations absent | Explain mixed reporting years and heuristic, precomputed priorities. |
| CKC Environmental Analysis | Extensive analysis; lacks a concise conclusion | Lead with the design implications and distinguish typical-year simulation from field validation. |
| Amsterdam Urban Weather Study | Contradictory conclusions and unclear intervention setup | Lead with baseline-versus-modeled urban weather; retain green roofs as an exploratory extension and verify how the scenario entered UWG. |
| EIA Energy Dashboard | Insufficient standalone explanation | Add data preparation and analytical context, fix the preview, and clarify source availability. |
| Building Electricity Analytics | Strong ETL work; forecasting claim not defensible as presented | Remove the accuracy claim until target leakage and evaluation design are corrected. |

## Proposed editorial design

This is a bounded revision of existing project content. Improve all nine portfolio-card descriptions and add or refine a compact project summary on each page. The summary will cover problem, contribution, method, demonstrated outcome, and limitations. Preserve the current page layouts and the approved Civic Atlas/City Lens interfaces. On the maps, use a compact expandable project-context section alongside the existing controls and methodology.

Correct supported factual errors directly. Where evidence is missing, use qualified wording instead of inventing dates, deployment claims, savings, validation results, or new performance numbers. No algorithm changes, model retraining, or new service are part of this content revision.

The following text is proposed publication copy. Only the approved Amsterdam framing and personal-project contribution context have been applied to the website.

## 1. Digital Twin Platform — BIM + FM

### Findings

- The page already explains the problem, architecture, features, screenshots, videos, and source repository well. Add an explicit contribution statement, supported by the existing portfolio documentation identifying you as the sole developer.
- The graph screenshot shows **8,171 nodes and 11,585 edges**. The headline currently labels 8,171 as “Relationships Mapped”; that is incorrect.
- The 74% occupancy figure is a simulation snapshot. It should not suggest measured occupancy, live sensors, or a achieved utilization improvement.
- The embodied-carbon total is a calculated sample-model estimate, not verified carbon savings or a complete certified life-cycle assessment.
- Claims of millisecond queries and days saved lack a displayed benchmark. Describe the supported workflow without presenting an unmeasured time saving.
- The published setup sentence says to run docker-compose up. The current repository tree has no Docker/Compose configuration, and its README instead documents separate backend/frontend setup. Link to that setup.
- Explain the test models and confirmed schema/version coverage; separate tested compatibility from generic IFC parsing capability. The screenshot identifies the Snowdon Towers sample model.

### Portfolio card

An IFC-to-browser platform connecting 3D BIM navigation, graph queries, HVAC service tracing, and embodied-carbon estimates using FastAPI, React, Three.js, and Neo4j.

### Project summary

**Problem.** Building information is difficult to use for facilities decisions when geometry, asset metadata, and system relationships are confined to separate tools.

**Contribution.** Sole developer of the full-stack architecture, IFC processing pipeline, browser viewer, graph layer, and connected facilities workflows.

**Method.** Convert IFC geometry to GLB, extract model metadata and relationships, and expose them through a React/Three.js interface and Python/FastAPI services with Neo4j graph queries.

**Demonstrated outcome.** The documented sample graph contains 8,171 nodes and 11,585 relationships. The interface supports equipment-to-terminal queries, selection-linked 3D inspection, calculated embodied-carbon estimates, and simulated occupancy scenarios.

**Limits.** These examples demonstrate application capability on sample models. Occupancy is simulated; carbon estimates depend on model quantities and material mappings. Quantified time savings and production deployment are not established by the current evidence.

Evidence: digital-twin.html; portfolio/sections/digital-twin.tex; assets/images/dt-graph.png; [repository and current setup](https://github.com/Naveendinula/DigitalTwin).

## 2. FM Readiness — Revit Plugin

### Findings

- The audit–fix–export workflow and the Revit API/WebView2 architecture are clear. Ownership and a concrete audit result are missing from the page.
- The supplied audit screenshot shows **546 assets audited, 546 incomplete, 0 complete, and 5% overall readiness** on the Snowdon Towers sample. This is a diagnostic result, not a before/after improvement.
- Explain that readiness is relative to the selected checklist/profile. It is not blanket COBie certification.
- The README documents Revit 2022–2026 build targets. Label these as targets unless each version has been tested.
- Replace “no external dependencies” with “no hosted service required”; the plugin does require its Revit/UI runtime dependencies.

### Portfolio card

A C# Revit add-in that audits FM/COBie data, guides missing-field corrections, supports bulk parameter editing, and exports asset metadata for downstream digital twins.

### Project summary

**Problem.** Incomplete asset parameters make BIM-to-facilities handover difficult to review and maintain.

**Contribution.** Sole developer of the C#/.NET add-in architecture and embedded WebView2 interface.

**Method.** JSON presets define audit fields and validation rules. The tool scores completeness, locates failing elements, applies guided or scoped edits through Revit external events, and exports IFC-aligned metadata.

**Demonstrated outcome.** A documented sample-model audit checked 546 assets and identified missing data across all of them, with a 5% overall readiness score under the selected profile. Users can move from an audit finding to its corresponding element and editor.

**Limits.** The score measures completeness against the chosen profile. It does not establish full standards compliance, and no measured before/after improvement is currently documented.

Evidence: fm-readiness.html; portfolio/sections/fm-readiness.tex; assets/images/fm-audit.png; [repository](https://github.com/Naveendinula/FMReadiness_v3).

## 3. Multi-Objective Building Envelope Optimization

### Findings

- This is one of the most complete studies, with geometry, tools, climate file, evaluation count, parameters, figures, and limitations.
- State the role and the main result before the detailed walkthrough.
- The actual objectives are heating, cooling, and overheating. Daylight was evaluated afterward; it was not a fourth optimization objective.
- The table records sDA of 87.8% and 82.5% for the balanced/best-case zones, versus 59.2% and 54.5% for the comparison case. Identify the chosen candidate consistently rather than alternating “balanced” and “best-case.”
- Define the overheating threshold, occupied-hour schedule, load units, and baseline for reproducibility.
- Remove Passive House-level claims unless the relevant annual, normalized performance and other requirements were checked. High sDA alone does not demonstrate glare control.
- Correct the overheating SD paragraph that currently refers to heating, and repair the section jump from 9 to 12.

### Portfolio card

A 5,000-candidate Wallacei study exploring heating, cooling, and overheating trade-offs, with post-optimization daylight assessment of selected envelope designs.

### Project summary

**Problem.** Envelope choices that reduce heating demand can increase summer solar gains and overheating.

**Contribution.** Sole author of the parametric model, simulation setup, evolutionary optimization, and comparative analysis.

**Method.** Evaluate two adjacent shoebox zones in a Seattle–Tacoma typical-year climate. Wallacei explores eight design variables across 50 candidates and 100 generations, using Honeybee/EnergyPlus thermal simulations.

**Demonstrated outcome.** The study compares solar-open, balanced, and solar-protected design families. The selected balanced design records 87.8% and 82.5% sDA in the two zones, demonstrating the daylight implications of its thermal trade-off.

**Limits.** These are idealized simulation results for a particular model and climate. Daylight was a subsequent check, and the study does not establish certified building performance.

Evidence: wallacei-building-performance.html; portfolio/sections/wallacei.tex; the linked result figures and daylight table.

## 4. Civic Atlas — Chicago Permit Retrofit Analysis

### Findings

- The functioning map and analytics are useful demonstrations, but the reviewer needs a project introduction, contribution statement, source link, and data-coverage note.
- Stored ward/community summaries each total **133,674 permits and 16,842 retrofit-likely permits**. Weekly and monthly charts cover February 2024–August 2025; do not silently equate that chart window with the coverage of every source record.
- The current methodology describes a curated keyword taxonomy, no negation handling, no validation sample, and inclusion of new construction. Calling the current output trained NLP/AI classification is stronger than the available evidence supports.
- spaCy may have been used in the preprocessing pipeline, but that implementation is not available here. Describe keyword-based text classification; mention spaCy only with an inspectable pipeline or an explicit explanation of its role.
- The discovered public buildingpermit-v2 repository is empty, so it is not presently a useful source-code link.
- The methodology refers to an Electrification tab that is not present. Remove the obsolete passage or explain the actual available analysis.

### Portfolio card

**Suggested title:** Chicago Permit Retrofit Signals — Civic Atlas

An interactive map of retrofit signals across 133,674 Chicago permits, combining keyword-based text classification with regional comparisons, trends, and processing-time analytics.

### Project summary

**Problem.** Retrofit intent is embedded in inconsistent permit work descriptions, making city-scale patterns difficult to explore.

**Contribution.** Developed the classification and geospatial analysis workflow, regional summaries, and interactive analytics interface.

**Method.** Group keyword-derived retrofit signals by ward and community area, then explore geographic concentrations, weekly activity, and permit-processing trends with MapLibre and ECharts.

**Demonstrated outcome.** The stored summaries contain 133,674 permits, of which 16,842 are flagged as retrofit likely. Users can compare regions and inspect the associated activity and processing-time charts.

**Limits.** A text match indicates a possible retrofit signal, not a verified completed retrofit or measured energy saving. Negated descriptions and new construction can create false positives. The data is a saved snapshot; the time-series window is February 2024–August 2025.

Evidence: assets/data/retrofit-v2/ward_summary.csv; community_summary.csv; retrofit_activity_weekly.csv; processing_time_monthly.csv; permit/permit_index.js; [official permit dataset](https://data.cityofchicago.org/Buildings/Building-Permits/ydr8-5enu).

## 5. City Lens — Chicago Energy Retrofit Prioritization

### Findings

- Add the screening purpose, contribution, dataset provenance, and limitations alongside the current weights and interface.
- The dataset has **3,852 records; 3,851 have valid coordinates**. Its reported priorities include 316 Critical and 740 High records.
- The records mix reporting years **2014–2023**, although 3,438 are from 2023. Describing the entire dataset as current or as a uniform 2023 sample would be inaccurate.
- The browser displays precomputed scores and flags. The available website code does not contain the upstream scoring implementation. Document normalization, thresholds, and treatment of missing inputs before claiming the method is validated.
- Distinguish prioritization for further investigation from a retrofit prescription, economic forecast, or prediction of energy savings.

### Portfolio card

A spatial screening tool for 3,852 Chicago building records, displaying precomputed retrofit priorities alongside energy indicators, filters, and contextual 3D buildings.

### Project summary

**Problem.** Benchmarking indicators are difficult to compare across a large building portfolio without a consistent screening view.

**Contribution.** Developed the weighted-priority workflow and map interface, including property and score filters, clustering, building details, and selection statistics.

**Method.** Display precomputed priorities based on ENERGY STAR, Chicago Energy Rating, site EUI, building age, and emissions intensity. MapLibre/OpenFreeMap supplies geographic context; separate colored markers represent each building record's priority.

**Demonstrated outcome.** The saved dataset contains 3,852 records, with 3,851 mapped. Filtering exposes critical/high candidates and keeps statistics aligned with the current selection.

**Limits.** This is heuristic screening, not an energy audit or a savings estimate. Reporting years span 2014–2023, with most records from 2023. Missing values remain N/A, and the basemap building shapes are contextual rather than verified matched footprints.

Evidence: assets/data/buildings.json; assets/js/map-data.mjs; chicago-energy-retrofit.html; [official benchmarking dataset](https://data.cityofchicago.org/Environment-Sustainable-Development/Chicago-Energy-Benchmarking/xq83-jr8c).

## 6. CKC Environmental Performance Analysis

### Findings

- The detailed methodology, visuals, and interpretation provide substantial evidence. A reviewer still needs the role, main design implications, and limitations near the top.
- Summarize the modeled context, typical-year weather, facade exposure, outdoor comfort, and view-analysis outputs in plain language.
- “Mostly heat-stress year-round” conflicts with the recorded 31.1% hot / 59.8% neutral / 9.2% cold annual split. Describe seasonal heat stress consistently with the actual table.
- Typical meteorological year data is not field validation. Avoid implying confirmed typhoon events or measured wind-channeling effects without the relevant evidence.
- Seasonal sun-hour tables use “Value*” without an explained footnote. Document whether numbers are calculated averages or estimates read from plots.
- Add a conclusion connecting the findings to shading and public-space decisions; qualify the 12°C balance-temperature assumption and other model settings.

### Portfolio card

A climate-based study of CKC and its surrounding Hong Kong blocks, translating annual solar exposure, outdoor comfort, and view analysis into facade and public-space guidance.

### Project summary

**Problem.** Dense surrounding towers create uneven solar exposure, outdoor comfort, and view access across the facade and adjacent parks.

**Contribution.** Sole author of the context model, environmental simulations, and design-guidance synthesis.

**Method.** Combine a 1 km² urban context with 8,760-hour typical-year weather in Rhino, Grasshopper, and Ladybug Tools. Assess sun paths, direct sun, incident radiation, thermal comfort, and view obstruction.

**Demonstrated outcome.** The study identifies stronger exposure on upper facade areas and substantial shading at lower levels. These patterns support differentiated shading/glazing strategies and seasonal programming of nearby public spaces.

**Limits.** Results describe a modeled typical year and simplified urban geometry. They are design guidance, not measurements of the building's actual energy use or evidence of an implemented retrofit.

Evidence: ckc-environmental-analysis.html; portfolio/sections/ckc.tex; the existing climate and facade figures.

## 7. Amsterdam Urban Weather and Thermal-Comfort Study

### Findings

- The author confirms that the green-roof experiment showed no improvement. The abstract and supporting portfolio documentation also report no measurable cooling; this should be described as the reported observation until the original output exports and scenario configuration are checked.
- The discussion and conclusion instead claim a 0.9°C reduction, 35% fewer extreme-heat hours, and an eight-percentage-point comfort increase. Those statements contradict the documented finding and should be removed unless separate, clearly labeled scenario results support them.
- The existing figures support a primary baseline-weather-versus-modeled-urban-weather comparison. The weather graphic identifies the station as Amsterdam-Schipholl/AP, supporting the public Amsterdam–Schiphol Airport reference label. This is a simulation study, not measured urban/rural validation. "Weather Validation" has been renamed "Modeled Weather Comparison."
- Both urban scenarios currently list "UWG EPW." This does not establish whether separate weather files were generated. Confirm that the green-roof scenario changed the UWG roof-vegetation properties, exported different scenario inputs, and ran separately. A shared unchanged EPW cannot demonstrate the district air-temperature response to roof vegetation; separate local radiant/comfort changes would need their own inputs and evidence.
- Insufficient roof coverage and anthropogenic heat are plausible explanations, but sensitivity testing is needed to establish causation.
- An unchanged output can be a useful bounded finding if a genuine intervention was simulated. If the roof change did not enter the weather model, report that as a workflow/model-configuration limitation rather than evidence of physical ineffectiveness.

### Recommended framing

**Title:** Modeling Urban Heat and Outdoor Thermal Comfort in Amsterdam

**Subtitle:** Baseline weather comparison with an exploratory green-roof scenario.

Lead with the independent study's purpose: investigate how the modeled urban context changes reference weather and selected outdoor-comfort metrics. Present green roofs as a secondary exploratory question, transparently acknowledging that mitigation was the original motivation. Success is a documented modeling workflow, a clear comparison, and conclusions bounded by the evidence; it does not require a positive retrofit benefit.

### Portfolio card

An independent Dragonfly/UWG study comparing reference weather with modeled urban conditions in a 0.65 km² Amsterdam district, with Ladybug thermal-comfort analysis and an exploratory green-roof scenario.

### Project summary

**Problem.** How does the modeled urban context change reference weather and outdoor thermal-comfort metrics, and can a green-roof scenario improve the selected outputs?

**Contribution.** Sole researcher on an independent personal project, responsible for the 3D city-data processing, model setup, urban weather generation, and thermal-comfort analysis.

**Method.** Import 3D BAG CityJSON geometry, generate urban weather with Dragonfly/UWG, and compare reference and modeled urban weather with Ladybug comfort outputs for the same analysis period. Identify eligible flat roofs for an exploratory retrofit scenario. Verify the scenario's exported UWG parameters and distinct weather output before describing it as a simulated district cooling test.

**Demonstrated outcome.** The workflow produced reference-versus-urban weather and comfort comparisons. The author reports no improvement from the exploratory green-roof setup. Quantify both comparisons from original hourly exports before publishing numerical claims; distinguish an unchanged simulated response from a roof change that was not represented in the weather model.

**Limits.** This is a model-based case study under specified geometry, weather, and parameter assumptions. It does not validate actual Amsterdam temperatures or establish that green roofs are ineffective. Roof coverage and waste heat are hypotheses requiring sensitivity tests. State the analyzed metric and output precision, and avoid "statistically insignificant" without an appropriate statistical analysis.

### Evidence needed for a stronger conclusion

1. Record the reference EPW source/station, analysis period, software versions, exported UWG inputs, roof coverage, and scenario-specific output paths.
2. Compare the reference EPW with the urban-baseline EPW using hourly temperature differences, seasonal day/night summaries, and consistent comfort thresholds.
3. If the retrofit is separately simulated, compare it directly with the urban baseline using the same metrics and period; report small or unchanged values at sufficient precision.
4. Check that the roof-vegetation input changes from the conventional case and reaches the UWG export. A roof-coverage sensitivity check can test model responsiveness; coverage and waste-heat sweeps are further work, not completed evidence.

Technical references: [Dragonfly Run Urban Weather Generator](https://docs.ladybug.tools/dragonfly-primer/components/6_alternativeweather/run_urban_weather_generator) describes morphing a rural or airport EPW into urban-canyon weather. [Assign Building UWG Properties](https://docs.ladybug.tools/dragonfly-primer/components/6_alternativeweather/assign_building_uwg_properties) documents the explicit roof_veg fraction input, whose default is zero.

Evidence: urban-heat-island.html; portfolio/sections/uhi.tex; portfolio/build_portfolio.py; existing rural/urban comparison figures.

## 8. EIA Energy Performance and Fuel Utilization Dashboard

### Findings

- The page is mostly an embed and an introductory paragraph. A reviewer cannot assess your data work when the report is inaccessible or does not immediately load.
- The repository README documents 175,000+ rows, EIA API data from 2011–2024, Python preparation, Power Query transformations, KPI/YOY views, and state/market-type comparisons. Bring this context onto the page.
- The fallback image points to a missing assets/eia-dashboard.png. Use the existing assets/images/energy dashboard.png with a useful caption.
- The repository contains only README.md and energy_dataPBI.pbip. The PBIP file references energy_dataPBI.Report, but that report directory is absent. The link does not currently provide a reproducible Power BI project or the data-preparation code.
- Define the thermal-efficiency measure, energy-unit conversions, source grain, aggregation, and market classification. Verify those definitions against the actual model rather than inferring them from the README.
- Market-structure comparisons are descriptive. They do not establish that competition caused efficiency differences. Distinguish dashboard capabilities from actual analytical findings.

### Portfolio card

**Suggested title:** EIA Energy Performance and Fuel Utilization

A Python-to-Power BI workflow for exploring EIA generation and fuel-use data from 2011–2024 through state, market-structure, fuel-category, and efficiency views.

### Project summary

**Problem.** Comparing electricity generation and fuel consumption requires consistent units, categories, and geographic context.

**Contribution.** Data preparation, analytical modeling, and dashboard development using Python and Power BI.

**Method.** The documented workflow collects 175,000+ EIA records, prepares energy and fuel categories, and presents generation, fuel-use, efficiency, and year-over-year comparisons with interactive state and market filters.

**Demonstrated outcome.** The report provides a common interface for exploring energy trends across 2011–2024. A static preview and a written walkthrough should make its purpose understandable without depending on the embed.

**Limits.** Comparisons are observational and depend on the chosen classifications and metric definitions. The current public repository documents the workflow but does not include the complete report/model or preparation code.

Evidence: eia-dashboard.html; assets/images/energy dashboard.png; [repository](https://github.com/Naveendinula/fuel-utilization-by-electricity-market) and its PBIP manifest.

## 9. Building-Level Electricity Analytics and Modeling

### Findings

- The notebook output records **25,559,768 processed rows, 1,572 buildings, and a 2016–2017 window**. That is a much stronger indication of the ETL project's scope than “multi-year data.”
- The public load_forecasting.ipynb computes energy_intensity from the current row's meter_reading divided by sqm, then includes both energy_intensity and sqm in X while setting y to meter_reading. For unclipped rows, the target can be reconstructed as energy_intensity × sqm. This is target leakage.
- GroupKFold separates buildings across folds; it does not remove a target-derived predictor. The displayed 30.4 kWh MAE is not defensible as evidence of real forecasting accuracy.
- Grouped regression across buildings also does not establish future-time forecasting performance. Define a prediction horizon, inputs available at prediction time, and a chronological holdout before making that claim.
- Remove the headline accuracy assertion and “prevents leakage” guarantee from the site. Retain the supported ETL, quality-reporting, Parquet, weather integration, and exploratory visualization work.
- A new validated result requires a modeling task: remove target-derived predictors, audit fold-specific preprocessing, compare against a baseline, and evaluate the intended future-time/unseen-building use case. This audit does not rerun the model or change its notebook.

### Portfolio card

**Suggested title until forecasting is re-evaluated:** Building-Level Electricity Data Pipeline and Modeling

An electricity-data pipeline covering 25.6 million hourly records from 1,572 buildings, with timezone alignment, data-quality checks, Parquet storage, weather enrichment, and geospatial exploration.

### Project summary

**Problem.** Large building-meter datasets contain inconsistent timestamps, missing readings, zero-value outages, and metadata/weather joins that complicate reliable analysis.

**Contribution.** Developed the ETL, data-quality, feature-engineering, modeling, and Folium exploration workflow.

**Method.** Reshape wide meter data into a long table, align local and UTC timestamps, merge building/weather information, inspect outage and gap patterns, and persist curated data in Parquet.

**Demonstrated outcome.** Saved notebook outputs document 25,559,768 rows across 1,572 buildings for 2016–2017. The workflow supports building-level quality reporting and seasonal/geographic electricity exploration.

**Limits.** The experimental LightGBM evaluation includes a target-derived feature, so its published MAE is not treated as validated forecasting performance. A leakage-free evaluation with a defined prediction horizon remains necessary.

Evidence: building-analytics.html; [project repository](https://github.com/Naveendinula/building-smart-meter-forecasting); [notebook, especially cells 7, 9, and 15](https://github.com/Naveendinula/building-smart-meter-forecasting/blob/main/smart-meter-analytics-project/notebooks/load_forecasting.ipynb). Methodological guidance: [scikit-learn on data leakage](https://scikit-learn.org/stable/common_pitfalls.html#data-leakage) and [GroupKFold](https://scikit-learn.org/stable/modules/generated/sklearn.model_selection.GroupKFold.html).

## Information that needs your evidence

The supported revisions above can be made without inventing results. These additional items would strengthen the portfolio but cannot be established by editing prose alone:

1. Project dates remain to be confirmed. Personal-project context and sole ownership are now confirmed for all nine projects.
2. Digital Twin: benchmark logs, tested-model/schema matrix, and any genuine deployment evidence.
3. FM Readiness: before/after audit results and tested Revit versions, distinct from build targets.
4. Wallacei/CKC/UHI: original model files, parameter settings, result exports, and clear links between plotted numbers and reported findings.
5. Permit/energy maps: the upstream preprocessing and scoring implementations, full snapshot coverage, and any validation sample/calibration evidence.
6. Power BI: the missing report/semantic-model directories or a complete PBIX, plus the preparation code and a few documented findings.
7. Electricity modeling: a corrected model evaluation before republishing an accuracy claim.

## Suggested implementation order

First correct the Amsterdam contradiction, electricity-model claims, Digital Twin graph/setup labels, energy-data vintage, and missing Power BI preview. Then improve all nine cards and project summaries, add source/evidence links, and polish repeated or unclear technical wording. Verify every local/external project link and preview on desktop/mobile before publishing.

The downloadable portfolio sources also contain older Mapbox descriptions and ngnaveen.github.io links. If those documents are being distributed, reconcile them with the current website in a separate PDF update so they do not tell a different story.
