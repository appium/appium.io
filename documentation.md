---
layout: default
title: Documentation
description: Appium Documentation
---

<div>
  {% for pair in site.data.slate %}
    {% assign language = pair[0] %}
    {% assign versions = pair[1] %}
    <ul><b>{{ language }}</b><ul class="btn-group-vertical">
    {% for version in versions %}
      <a href="slate/{{ language }}/{{ version }}" type="button" class="btn btn-default">{{ version }}</a>
      <li class="button_divider"></li>
    {% endfor %}
    </ul></ul>
{% endfor %}
</div>