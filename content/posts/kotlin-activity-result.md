+++
authors = ["Kaustubh Patange"]
title = "Handle onActivityResult(), the Kotlin way"
date = "2022-02-22"
tags = [
    "android", "kotlin"
]
+++

ActivityResult API is an improvement over the traditional `onActivityResult()` method. But it can get much better with Kotlin, let's see how?

<!--more-->

Traditionally we are used to the catch Activity results in `onActivityResult()` method overrides that Activity/Fragment has, with Jetpack Activity `v1.2.0-alpha02`, [ActivityResultRegistry](https://developer.android.com/jetpack/androidx/releases/activity#1.2.0-alpha02) was introduced which allowed us to register for activity result & made handling the result much efficiently.

The working is pretty simple, `ActivityResultRegistry` maintains a map of `key: String` to a `ActivityResultCallback` and invokes it whenever `ComponentActivity`'s `onActivityResult()` is called by first verifying the contract which was used to execute the required input & then invokes the appropriate `ActivityResultCallback` from the `map`.

## Limitations

You can only register before `onStart`, in other words with each call to `registerForActivityResult()` a `LifecycleOwner` is passed which is used to check whether you are calling this method before `onStart`, if not it throws an `IllegalStateException`.

This limitation can cause various problems where if you register the callback after a button is clicked it would simply not work. Although this limitation is technically needed to ensure that the API works properly, we'll see it later.

## Approach to solution (novice way)

_Note: Do not try this in production._

Jetpack compose does it differently, if you look at the code of [`rememberLauncherForActivityResult()`](https://cs.android.com/androidx/platform/frameworks/support/+/androidx-main:activity/activity-compose/src/main/java/androidx/activity/compose/ActivityResultRegistry.kt;l=82?q=rememberLauncherForActivityResult) you'll see it makes use of `ComponentActivity`'s `ActivityResultRegistery` to register the callback when the composition is started & unregister when the composition is disposed/abandoned (`DisposableEffect`).

We can apply this logic to construct something similar,

```kotlin
fun <I, O> ComponentActivity.launchWithResult(
    input: I,
    contract: ActivityResultContract<I, O>,
    onResult: (O) -> Unit
) {
    val contractKey = "contract_${UUID.randomUUID()}"
    var launcher: ActivityResultLauncher<I?>? = null
    launcher = activityResultRegistry.register(contractKey, contract) { result ->
        launcher?.unregister()
        onResult(result)
    }
    launcher.launch(input)
}
```

What are we doing here is simply registering a contract with a unique key & unregistering the contract when the result is obtained, thus making this a one shot listener for Activity Result.

We can built another extension function on top of it to listen for `onActivityResult()`,

```kotlin
fun ComponentActivity.startActivityWithResult(
    input: Intent,
    onActivityResult: (ActivityResult) -> Unit
) : Unit = launchWithResult(input, ActivityResultContracts.StartActivityForResult(), onActivityResult)
```

Now using this is pretty simple as you just've to call it wherever you want to listen for activity result for an intent maybe on a button click or something else,

```kotlin
class MainActivity : ComponentActivity() {
    override fun onCreate(...) {
        ...
        binding.btnLogin.setOnClickListener {
            val intent: Intent = ...
            startActivityWithResult(intent) { result ->  // <--
                // do something with the result.
            }
        }
    }
}
```

## Configuration change & Process death

The above code will not survive configuration & process death, in other words if you call `startActivityWithResult()` after a button click (or similar case where manual trigger is required) where an Activity is displayed & suppose you rotate the device (which will recreate all the activities in backstack including the current one), then you'll not get the required result on the callback function you've passed as a parameter to the method.

**Why?** Since during configuration or process death all your current as well as previous activity gets recreated, the callback lambda which you pass get's cleared from the memory hence you don't recieve a call to it.

The idea is to register it in `OnCreate()` i.e in any of Activity/Fragment methods & then execute the input,

```kotlin
class MainActivity : Fragment() {
    private lateinit var launcher: ActivityResultLauncher<Intent> // <--
    override fun onViewCreated(...) {
        ...
        launcher = requireActivity().activityResultRegistry.register("a-key", contract) { result -> // <--
            // do something with result,
        }
        binding.btnLogin.setOnClickListener {
            val intent: Intent = ...
            launcher.launch(intent)
        }
    }
    // In an Activity you don't need to unregister as it will happen automatically,
    override fun onDestroyView(...) {
        launcher.unregister() // <--
    }
}
```

Registeration must be done through a unique key which should survive configuration or process death, hence `UUID.randomUUID()` will not work. Now whenever configuration change happens or process death happens, after restarting Activity/Fragment it will re-register the callback with the same key we've used where we'll safely get the result in our callback.

Did you see what we've done? In a way we've implemented `registerForActivityResult()`, but the only difference here is we are registering using a custom key. But why not use `registerForActivityResult()` if we're doing the same thing? The thing is we can't register multiple callbacks for the same contract when using `registerForActivityResult()`, hence we directly use `ComponentActivity`'s `ActivityResultRegistry` to do so. If your requirement is to have a single callback for a contract then sure go with `registerForActivityResult()` as it'll automatically unregister itself when the `LifecycleOwner`'s lifecycle is destroyed.

## Conclusion

- There is no such limitation for this API, what we saw was to ensure that it should just work across configuration & process death. That's why you need to register it before `onStart` of Activity or `onCreate` of Fragment.
- The reason why Jetpack Compose's `rememberLauncherForActivityResult()` works out of box is because for each Composable function there is an entry & an exit point. Entry being when composition is started & exit being when the composition is disposed/abandoned. Since you get this lifecycle out of the box you can easily make use of it to register & unregister the callback at the appropriate time.

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
    a {
        text-decoration: underline;
    }
</style>

{{< /css.inline >}}
