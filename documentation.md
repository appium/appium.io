---
layout: default
title: Documentation
description: Appium Documentation
---

<div class="btn-group-vertical">
{% for doc in site.data.slate %}
  <a href="slate/{{ doc.language }}/{{ doc.tag }}" type="button" class="btn btn-default">{{ doc.language }} {{ doc.tag }}</a>
  <li class="button_divider"></li>
{% endfor %}
</div>