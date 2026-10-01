# Map restoration progress

Approved plan: Restore both portfolio maps at zero cost (2026-10-01).

- Ruling: Work in the current `redesign-prodbuild` checkout, as the approved plan specifies preserving uncommitted edits and preparing this publishing branch. No reset or worktree transfer is needed.
- Shared interfaces: Both controllers use the same pinned MapLibre loader, basemap fallback, numeric conversion, and geometry bounds. Existing permit analytics remain separate from map readiness.
- Baseline: No existing test runner/package manifest. The public energy page reports an invalid Mapbox token; both public maps remain under loading overlays. The local numeric conversion regression fails on `null` becoming zero.
- Task 1: Numeric/data regression tests written before the extraction. Null handling passed after extraction; eight new data-behavior tests failed before their implementations existed.
- Implemented shared MapLibre 6.11.2/OpenFreeMap loading, deadline/retry handling, geographic bounds, boundary normalization, score/coordinate validation, filtered statistics, and mobile chrome.
- Restored ward/community maps and original CSV analytics; restored priority points, cluster expansion, complete unclustered points, building popups, filters, and contextual 3D buildings. Both demos have 2D/3D and reset controls.
- Final independent review found late-data restoration, stalled metadata readiness, and zero-score averaging defects. Three regression tests failed before fixes and passed after the single repair pass. The full suite passes all 14 tests.
- Browser QA: desktop region popups/fit, ward/community switching, building popup with Energy Score N/A and Retrofit Score 0, filters, cluster expansion/on/off, 3D buildings, fullscreen, and all analytics tabs. Phone viewport 390×844: collapsed controls, filtering/empty selection, reset/3D toggle, scrollable summaries, analytics drawer, and visible attribution.
- Failure QA: blocked basemap retains markers/boundaries; HTTP 503 data fails explicitly and Retry settles; WebGL failure retains filters/statistics/analytics; stalled TileJSON reaches the 15-second fallback with overlays restored.
- Resource inventory audit: both rendered demos contain no Mapbox requests or access-token parameters. Source audit of the two demos and their map/permit modules likewise found none.
- Publishing target verified: `redesign-prodbuild`, repository root, existing GitHub Pages site. Publishing and live verification follow local validation.
- Final visual QA: set a readable responsive width for permit popups and fit already-loaded local datasets immediately after map initialization, without waiting for tile readiness. Phone popup verified at 390×844 with two-column metrics and visible attribution.
- Public verification: both Pages deployments succeeded; live datasets, filtering, cluster expansion, boundaries, and 3D buildings work. A subsequent load exposed stale controller/CSS caches, so the two HTML entry points now version those asset URLs for immediate updates.
