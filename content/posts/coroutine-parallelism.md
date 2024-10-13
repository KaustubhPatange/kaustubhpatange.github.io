+++
authors = ["Kaustubh Patange"]
title = "Parallelism in suspend functions"
date = "2021-09-29"
tags = [
    "kotlin", "coroutines"
]
+++

We know how to execute parallel suspend functions in a `CoroutineScope`, but how to do it within a suspend function that has a return type.

<!--more-->

## The Problem

For what we know it is not hard to run multiple suspend functions parallelly in a `CoroutineScope` using `async {}` block. `async`'s return type is `Deferred<T>` which then can be awaited so it is possible to chain multiple `Deferred<T>` jobs using `awaitAll` which solves the problem of parallelism.

```kotlin
suspend fun taskList1() = "Some text data"
suspend fun taskList2() = "Another random data"

suspend fun parallelNoReturnType() {
    CoroutineScope(Dispatchers.IO).launch {
        val task1 = async { taskList1() }
        val task2 = async { taskList2() }

        val total: List<String> = awaitAll(task1, task2)

        // process data & return unit
    }
}
```

Certainly, this is not a problem but what if the return type of the function is other than `Unit` meaning there is need for a non `Unit` return type. Certainly returning the `total` variable from above will not work as it is in the `@launch` scope, also returning the `CoroutineScope` will not work since it's return type is `Job` not `List<String>` which we are expecting.

```kotlin
// Eg: 1 - Returning total variable (will not compile)
suspend fun parallelReturnType() : List<String>  {
    CoroutineScope(...).launch {
        ...
        val total: List<String> = ...

        return total // Error
    }
}

// Eg: 2 - Returning CoroutineScope (will not compile)
suspend fun parallelReturnType() : List<String> {
    // Valid return type but it's not List<String>; Error
    return CoroutineScope(...).launch {
        ...
        val total: List<String> = ...
        total // hoping this would be the result just like `run` function
    }
}
```

## Solution

The easy fix is to use `coroutineScope { }` suspend function which has a signature `public suspend fun <R> coroutineScope(block: suspend CoroutineScope.() -> R): R`.

For us the `R` is `List<String>`, using it in the above code requires minimal edit.

```kotlin
suspend fun parallelReturnType() : List<String> = coroutineScope scope@{
    val task1 = async { taskList1() }
    val task2 = async { taskList2() }

    val total: List<String> = awaitAll(task1, task2)

    return@scope total
}
```

The `coroutineScope` uses the default `coroutineContext` associated with the suspend function i.e the parent's coroutine context which was used to invoke this suspend function.

If you want to dispatch the jobs on some other `CoroutineDispatcher` you can use `.async {}` on `CoroutineScope`.

```kotlin
suspend fun parallelReturnType() : List<String> = CoroutineScope(Dispatchers.Default).async {
    val task1 = async { taskList1() }
    val task2 = async { taskList2() }

    val total: List<String> = awaitAll(task1, task2)

    return@async total
}.await() // important otherwise the return type will be Deferred<List<String>>
```

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
