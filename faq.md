---
permalink: /faq.html
layout: default
title: FAQ
description: Frequently Asked Questions 
---

## What is the Appium Philosophy?

- R1. Test the same app you submit to the marketplace
- R2. Write your tests in any language, using any framework
- R3. Use a standard automation specification and API
- R4. Build a large and thriving open-source community effort

## Why do the Appium clients exist?

We have the Appium clients for 3 reasons:

- 1) There wasn't time to go through a full commit and release cycle for 
   Selenium once we'd set a release date for 1.0
- 2) Some of the things that Appium does, and which its users really find 
   useful, are never going to be an official part of the new mobile spec. We 
   want a way to make these extensions available
- 3) There are some behaviors whose state is as yet unknown. They might make it
   into the spec and get deleted from the clients, or they might be in 
   category #2

Ultimately, the only reason for the clients will be #2. And even that is 
actually evidence that we are conforming to the WebDriver spec (by 
implementing the extension strategy it recommends) rather than departing from
it. The Appium clients are the easiest and cleanest way to 
use Appium.

Once we've got the mobile spec stuff merged into the official WebDriver 
clients, for most users, you probably won't need an Appium client.

For more on this question, see 
[this discussion thread](https://groups.google.com/forum/#!topic/appium-discuss/eVsPcm4ycIc).
