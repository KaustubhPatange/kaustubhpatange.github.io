+++
authors = ["Kaustubh Patange"]
title = "The undocumented AGP's gradle property"
date = "2021-10-03"
tags = [
    "android", "agp", "gradle"
]
+++

One of the scariest experience where I was about to break my production app due to my unfamiliarity with AGP's `android.bundle.enableUncompressedNativeLibs` gradle property.

<!--more-->

This was the time when I was about to release a new app on Google Play called [Gear VPN](https://play.google.com/store/apps/details?id=com.kpstv.vpn), completely ignorant about this issue that only occurs when you create an app bundle to publish on Google Play.

## The problem

So my app has many native libraries (.so) which are loaded at runtime to execute some commands at runtime. This was working completely fine on debug & release builds because the optimization only happens for app bundle. Keep in mind that if you test the app on pre `M` devices the app will work fine & will not break due to this optimization.

### What is this optimization?

Below are the screenshot of the app's `/data/app` folder when installed in different modes.

| Package (.apk) - Release                      | Bundle (.aab) - Release                         |
| --------------------------------------------- | ----------------------------------------------- |
| ![Apk - Release](/images/agp-vpn-release.png) | ![Bundle - Release](/images/agp-vpn-bundle.png) |

As you can notice, for the "Bundle" no libs (specific to device architecture) are extracted in `lib` folder which means any call to `System.loadLibrary()` or directly executing binary (that contains path like `getApplicationInfo().nativeLibDir`) will fail internally without producing any crash.

But what actually happens? On & after `M`, the platform supports reading native libraries directly from the APK without having to extract them. This is why we don't see a `lib` folder when the app is installed from the app bundle. So any argument passed to execute a command through this library will not work since the directory `getApplicationInfo().nativeLibDir` doesn't exists.

This issue actually broke my app's core feature. Thanks to some of the internal testers who verified this issue before me publishing to the production.

## Solution

There are mainly two solutions,

1. If you are the maintainer of the library then remove `getApplicationInfo().nativeLibDir` call from `System.loadLibrary()` for post `L` devices & instead directly specify the library name as the platform then supports reading them directly from the APK.
2. You can also opt out of this optimization by setting `android.bundle.enableUncompressedNativeLibs` flag to `false` in gradle.properties file.

For my app, since it was a third party library my only available option was to go with the gradle property solution.

### Why was this optimization added?

Disabling the optimization leads to bigger APKs on users devices since the native libraries are extracted out of the APK (and thus also longer installation times).

{{< css.inline >}}

<style>
    pre code, pre, code {
        white-space: pre !important;
        overflow-x: auto !important;
        word-break: keep-all !important;
        word-wrap: initial !important;
    }
    .article {
        text-align: start;
    } 
</style>

{{< /css.inline >}}
