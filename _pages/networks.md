---
layout: page
permalink: /networks/
title: networks
description: interactive visualizations of my research network
nav: true
nav_order: 1
---

<!-- _pages/networks.md -->

<h2 style="margin-bottom: 0.25rem;">co-author network</h2>
<p style="color: var(--global-text-color-light); font-size: 0.85rem; margin-bottom: 0.5rem;">hover over nodes to explore collaborations</p>
<div style="display: flex; gap: 1.2rem; margin-bottom: 0.75rem; font-size: 0.8rem; color: var(--global-text-color-light);">
  <span><span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: var(--global-theme-color); opacity: 0.85; vertical-align: middle; margin-right: 4px;"></span>me</span>
  <span><span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #68d391; opacity: 0.7; vertical-align: middle; margin-right: 4px;"></span>advisor</span>
  <span><span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: var(--global-divider-color); opacity: 0.6; vertical-align: middle; margin-right: 4px;"></span>co-author</span>
</div>
<div id="coauthor-graph" style="width: 100%; height: 380px; margin-bottom: 3rem;"></div>

<h2 style="margin-bottom: 0.25rem;">paper network</h2>
<p style="color: var(--global-text-color-light); font-size: 0.85rem; margin-bottom: 0.5rem;">papers linked by shared authors — hover to see details</p>
<div id="paper-graph" style="width: 100%; height: 380px; margin-bottom: 2rem;"></div>

<script src="/assets/js/network-graphs.js" defer></script>
