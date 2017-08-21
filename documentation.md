---
layout: default
title: Documentation
description: Appium Documentation
---

<div>
  {% for pair in site.data.slate %}
    {% assign language = pair[0] %}
    {% assign versions = pair[1] %}
    <ul class="btn-group-vertical">
      <a href="docs/about-appium" type="button" class="btn btn-default">{{language}}</a>
      <li class="button_divider"></li>
    </ul>
{% endfor %}
</div>