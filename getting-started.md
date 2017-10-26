---
permalink: /getting-started.html
layout: default
title: Getting started
description: Want to rock your mobile app automation? This is how you get started!
---

## Appium

Appium is an open source, cross-platform test automation tool for native, hybrid and mobile web apps, tested on simulators (iOS, FirefoxOS), emulators (Android), and real devices (iOS, Android, Windows, FirefoxOS).


### Supported Platforms

* iOS
* Android
* Windows
* FirefoxOS

See the  [platform support doc](/slate/en/master/#platform-support.md) for more detailed information.

### Why Appium?

1. You don't have to recompile your app or modify it in any way, due
   to use of standard automation APIs on all platforms.
2. You can write tests with your favorite dev tools using any [WebDriver](https://w3c.github.io/webdriver/webdriver-spec.html)-compatible
   language such as Java, [Objective-C](https://github.com/appium/selenium-objective-c),
   JavaScript with Node.js (in [promise, callback](https://github.com/admc/wd) or [generator](https://github.com/jlipps/yiewd) flavors),
   PHP, Python, [Ruby](https://github.com/appium/ruby_lib), C#, Clojure, or Perl
   with the Selenium WebDriver API and language-specific client libraries.
3. You can use any testing framework.

Investing in the [WebDriver](https://w3c.github.io/webdriver/webdriver-spec.html) protocol means you are betting on a single, free and open protocol for testing that has become a defacto standard. Don't lock yourself into a proprietary stack.

If you use Apple's UIAutomation library without Appium you can only write tests
using JavaScript and you can only run tests through the Instruments application.
Similarly, with Google's UiAutomator you can only write tests in Java. Appium
opens up the possibility of true cross-platform native mobile automation. Finally!

### I don't get it yet...

If you're new to Appium, or want a fuller description of what this is all about, please read our  [Introduction to Appium Concepts](/slate/en/master/#intro.md).

### Requirements

Your environment needs to be setup for the particular mobile platforms that you
want to run tests on. See below for particular platform requirements.

If you want to run Appium via an `npm install`, hack with or contribute to Appium, you will need
[node.js and npm](http://nodejs.org) v6 or greater (use [n](https://github.com/visionmedia/n) or
`brew install node` to install Node.js. Make sure you have not installed Node or Appium with `sudo`,
otherwise you'll run into problems). We recommend the latest stable version.

To verify that all of Appium's dependencies are met you can use
`appium-doctor`.  Install it with `npm install -g appium-doctor` (or run it
from [source](https://github.com/appium/appium-doctor)), then run
`appium-doctor` and supply the `--ios` or `--android` flags to verify that all
of the dependencies are set up correctly.

You also need to download the Appium client for your language so you can write tests. The Appium clients are simple extensions to the WebDriver clients. You can see the list of clients and links to download instructions at the  [Appium clients list](/slate/en/master/#appium-clients.md).

#### iOS Requirements

* Mac OS X 10.12 recommended
* XCode 8 recommended
* Apple Developer Tools (iPhone simulator SDK, command line tools)
*  [Ensure you read our documentation on setting yourself up for iOS testing!](/slate/en/master/#running-on-osx.md)

#### Android Requirements

* [Android SDK](http://developer.android.com) API &gt;= 17 (Additional features require 18/19)
* Appium supports Android on OS X, Linux and Windows. Make sure you follow the
  directions for setting up your environment properly for testing on different OSes:
  *  [linux](/slate/en/master/#running-on-linux.md)
  *  [osx](/slate/en/master/#running-on-osx.md)
  *  [windows](/slate/en/master/#running-on-windows.md)
  
#### Windows Requirements

* Windows 10
*  [Documentation](/slate/en/master/#running-on-windows.md)

#### FirefoxOS Requirements

* [Firefox OS Simulator](https://developer.mozilla.org/en/docs/Tools/Firefox_OS_Simulator)

### Quick Start

Kick up an Appium server, and then run a test written in your favorite [WebDriver](https://w3c.github.io/webdriver/webdriver-spec.html)-compatible language!
You can run an Appium server using node.js or using the application, see below.

#### Using Node.js

```
$ npm install -g appium
$ appium
```

#### Using the App

* [Download the Appium app](https://bitbucket.org/appium/appium.app/downloads/)
* Run it!

### Writing Tests for Appium

The main guide for getting started writing and running tests is  [the running tests](/slate/en/master/#running-tests.md) doc, which includes explanations for iOS, Android, and Android older devices. If you're interested in testing on physical hardware, you might be interested in our  [real devices guide](/slate/en/master/#real-devices.md).

Essentially, we support a subset of the [Selenium WebDriver JSON Wire Protocol](https://w3c.github.io/webdriver/webdriver-spec.html), and extend it so that you can specify mobile-targeted  [desired capabilities](/slate/en/master/#caps.md) to run your test through Appium.

You find elements by using a subset of WebDriver's element-finding strategies.
See  [finding elements](/slate/en/master/#finding-elements.md) for detailed information. We also have several extensions to the JSON Wire Protocol for  [automating mobile gestures](/slate/en/master/#touch-actions.md) like tap, flick, and swipe.

You can also automate web views in hybrid apps! See the  [hybrid app guide](/slate/en/master/#hybrid.md)

This repository contains [many examples of tests in a variety of different languages](https://github.com/appium/sample-code)!

For the full list of Appium doc pages, visit [this directory](/documentation.html?lang=en).

### How It Works

Appium drives various native automation frameworks and provides an API based on
Selenium's [WebDriver JSON wire protocol](https://w3c.github.io/webdriver/webdriver-spec.html).

Appium drives Apple's UIAutomation library for iOS support, which is based on
[Dan Cuellar's](http://github.com/penguinho) work on iOS Auto.

Android support uses the UiAutomator framework for newer platforms and
[Selendroid](http://github.com/DominikDary/selendroid) for older Android platforms.

Windows support uses Microsoft's [WinAppDriver](https://github.com/Microsoft/WinAppDriver)

FirefoxOS support leverages [Marionette](https://developer.mozilla.org/en-US/docs/Marionette),
an automation driver that is compatible with WebDriver and is used to automate
Gecko-based platforms.

### Contributing

Please take a look at our [contribution documentation](/slate/en/master/#CONTRIBUTING.md)
for instructions on how to build, test and run Appium from source.

### Roadmap

Interested in where Appium is heading in the future? Check out the [Roadmap](https://github.com/appium/appium/blob/master/ROADMAP.md)

### Project Credits & Inspiration

 [Credits](/slate/en/master/#credits.md)

### Mailing List

Announcements and debates often take place on the [Discussion Group](https://discuss.appium.io), be sure to sign up!

### Troubleshooting

We put together a  [troubleshooting guide](/slate/en/master/#troubleshooting.md).
Please have a look here first if you run into any problems. It contains instructions for checking a lot
of common errors and how to get in touch with the community if you're stumped.

### Using Robots

Using Appium with [Tapster](https://github.com/hugs/tapsterbot) and other robots is possible,
check out the [Appium Robots](https://github.com/appium/robots) project!
