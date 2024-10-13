+++
authors = ["Kaustubh Patange"]
title = "Dagger's implementation of JSR 330"
date = "2021-10-19"
tags = [
    "android", "di"
]
+++

We will see some of the Dagger 2 generated code more specifically on how it uses `SingleCheck<T>` & `DoubleCheck<T>` implementations of `javax.inject.Provider<T>` internally.

<!--more-->

Whenever you create a `@Component` or `@Subcomponent`, dagger creates an implementation extending your type with some fields (from your modules & submodules), constructor & an `initialize` method.

```kotlin
@Singleton // this is just a scope, we can use a custom one if we want.
@Component(modules = [AppModule::class])
interface AppComponent {
    ...
    @Component.Factory
    interface Factory {
        // BindInstance ties parameter within the component heirarchy so it
        // can be accessed/used in modules, subcomponents, etc.
        fun create(@BindInstance application Application) : AppComponent
    }

    fun inject(app: CustomApplication) // `CustomApplication` is my application class.
}
```

```java
// Dagger generated code
public final class DaggerAppComponent implements AppComponent {
    private final AppModule appModule;
    private final Application application;
    ...
    // `AppModule` contents are omitted for brevity.

    public DaggerAppComponent(AppModule appModuleParam, Application applicationParam) {
        this.appModule = appModuleParam;
        this.application = applicationParam;
        initialize(appModuleParam, applicationParam);
    }

    private void initialize(final AppModule appModuleParam, final Application applicationParam) {
        ...
    }

    @Override
    public void inject(CustomApplication app) { // used to inject in my Application class.
        ...
    }
}
```

As you can see the `Component.Factory` or `Component.Builder` method parameters will become the arguments for the constructor & are stored in the private fields of the class. If `@BindInstance` is not be applied to the `create` method, we won't be seeing `private final Application application;` as dagger assumes it is only needed to construct the component and not to been used in any modules or submodules. If you try to use it within `Module` or component heirarchy then dagger will throw a compile time error as the field does not exist.

## AppModule

Let's take a real example from an app which has `AppModule` as follows.

```kotlin
class NetworkUtils @Inject constructor (...) {
    fun getOkHttpBuilder() : OkHttpClient.Builder { ... }
    fun getRetrofitBuilder() : Retrofit.Builder { ... }
}

@Module
class AppModule {
    @Provides
    fun provideMyApi(networkUtils: NetworkUtils) : IpApi {
        return networkUtils.getRetrofitBuilder()
            ...
            .create(...)
    }
}
```

Whenever you add `@javax.inject.Inject` annotation, dagger will create a factory class eg: For `NetworkUtils`, `NetworkUtils_Factory.java` will be created implementing `dagger.internal.Factory<T>` which itself is a `Provider<T>`. It will also create factories for all the `@Provide` methods in your module eg: `AppModule_ProvideMyApiFactory`.

A `Provider<T>` contains single method `get() : T` which generate or provide an instance of the `T`. The optimization happens for this `get() : T` method, whether to provide a new instance or reuse existing instance (which was cached after initialization for the first time).

For this we can use scope annotations which dagger provides to create a custom scope or use an existing one (`@Reusable`, `@Singleton` in our case, we will see this later).

For now, the dependencies injected in my application class would generate the follow dagger code.

```kotlin
fun CustomApplication : Application() {
    val appComponent: AppComponent = DaggerAppComponent.create(this)

    @Inject lateinit var myApi : MyApi
    @Inject lateinit var networkUtils : NetworkUtils

    fun onCreate() {
        appComponent.inject(this) // using the inject method defined in `DaggerAppComponent`
        ...
    }
}
```

```java
public final class DaggerAppComponent implements AppComponent {
    ... // from above

    private Provider<MyApi> provideMyApiProvider; // Factory for `provideMyApi` method

    private void initialize(...) {
        // `create` or return as existing factory class.
        // Remember `create` method will return a factory & `get` will return an instance depending on how
        // many times it has been wrapped with a Provider<T>.
        this.provideMyApiProvider = AppModule_ProvideMyApiFactory.create(..., NetworkUtils_Factory.create());
    }

    @Override
    public void inject(CustomApplication app) {
        injectApp(app);
    }

    private App injectApp(CustomApplication instance) {
        // internally `provideMyApi` call will delegate the call to `AppModule.provideIpApi(...)`
        instance.myApi = AppModule_ProvideMyApiFactory.provideMyApi(appModule, new NetworkUtils(...));
        instance.networkUtils = new NetworkUtils(...);
    }
}
```

The `inject` method actually sets the value for the fields in the `CustomApplication`. But we observe that we are always providing a new instance of `NetworkUtils` whenever requested. Let's see how can we customize this behavior.

> Note: Similar results will be produced if we try to `@Provide` `NetworkUtils` via a module.

## Scoped annotations

- ### `@Reusable`

From the docs,

> `@Reusable` is useful when you want to limit the number of provisions of a type, but there is no specific lifetime over which there must be only one instance.

Hmm, so it says there is no guarantee that the cached instance could be a singleton & there is a chance that it could be reinitialized (in an edge case, maybe?).

Let's see how the generated code looks.

```kotlin
@Reusable
class NetworkUtils @Inject constructor (...) {
    ...
}
```

```java
// Dagger generated code
public final class DaggerAppComponent implements AppComponent {
    ...
    private Provider<NetworkUtils> provideNetworkUtilsProvider;
    ...

    private void initialize(...) {
        this.networkUtilsProvider = SingleCheck.provider(NetworkUtils_Factory.create(provideApplicationContextProvider));
    }
}
```

We see it wraps our factory provider using `SingleCheck<T>`. But what does it do?

From the `SingleCheck<T>` docs,

> A Provider implementation that memoizes the result of another Provider using simple lazy initialization, not the double-checked lock pattern.

So it caches the result using "simple" lazy initialization & is able to provide the cached instance when requested. But it could break under certain circumstances, I'll answer the "when" question later.

- ### `@Singleton`

There are no restrictions on only using `@Singleton` annotation, you can create a custom one but don't forget to annotate your `@Component` or `@Subcomponent` with it. In my case, I annotated `AppComponent` with `@Singleton` which means any dependency annotated with `@Singleton` will bind to `AppComponent` & will live as long as `AppComponent` lives (i.e tied to the `Application`).

Lets see how the generated code looks like when we annotate `NetworkUtils` with it.

```kotlin
@Singleton
class NetworkUtils @Inject constructor (...) {
    ...
}
```

```java
// Dagger generated code
public final class DaggerAppComponent implements AppComponent {
    ...
    private Provider<NetworkUtils> provideNetworkUtilsProvider;
    ...

    private void initialize(...) {
        this.networkUtilsProvider = DoubleCheck.provider(NetworkUtils_Factory.create(provideApplicationContextProvider));
    }
}
```

Instead of `SingleCheck<T>` we see the use of `DoubleCheck<T>` provider.

From the `DoubleCheck<T>` docs,

> A Lazy and Provider implementation that memoizes the value returned from a delegate using the double-check idiom described in Item 71 of Effective Java 2.

From this statement I know that I need to read the Item 71 of Effective Java 2 to understand lazy initialization in more depth.

> Note: If you inject your dependency using `dagger.Lazy<T>` provider then you will see `DoubleCheck.lazy(...)` in the generated code where you have to manually call `.get()` to retrieve the dependency in the calling code. The working is same but the dependency is only initialized when `.get()` is called for the first time.

## `SingleCheck<T>` vs `DoubleCheck<T>`

From the docs, we know both of these idioms are used for lazy initializations & after reading Item 71 of Effective Java 2 I'm sure `DoubleCheck<T>` is thread safe. Lets explore them,

- ### Simple lazy initialization (Single check idiom)

Here I've created a simple copy-paste-run sample that initializes the field lazily (no locking).

```kotlin
class Box

// Single check idiom used by `SingleCheck<T>`
class Container {
    companion object {
        @Volatile // writes to this field are immediately made visible to other threads
        private var box: Box? = null

        fun getBox() : Box {
            var field = box
            if (field == null) {
                box = Box()
                field = box
            }
            return field!!
        }
    }
}
```

```kotlin
fun thread1() {
    Thread {
        val field = Container.getField()
        println("Value from thread1: $field")
    }.start()
}

fun thread2() {
    Thread {
        val field = Container.getField()
        println("Value from thread2: $field")
    }.start()
}

fun main() {
    thread1()
    thread2()

   /* Output
    * ------
    * Value from thread 2: Box@6ae36b9b
    * Value from thread 1: Box@667c6a02
    */
}
```

The order of `println` is not guaranteed but we see both the accessor of `Box` in these two threads are different. This is because the `SingleCheck<T>` idiom is not thread safe & could cause repeated initialization when we try to access the field from different threads at the same time.

- ### Double check idiom (locking pattern)

The way this idiom is implemented is first we check the field if it is uninitialized without locking, then we lock the object & again check the field if uninitialized. If it appears to be uninitialized the second time we initialize the field & return it in both the cases.

We modify the `Container` class to follow this idiom & run the `main` function again.

```kotlin
// Double check idiom (thread safe) used by `DoubleCheck<T>`
class Container {
    companion object {
        @Volatile
        private var box: Box? = null

        fun getField() : Box {
            var field = box
            if (field == null) {
                synchronized(this) {
                    field = box
                    if (field == null) {
                        box = Box()
                        field = box
                    }
                }
            }
            return field!!
        }
    }
}
```

```kotlin
fun main() {
    thread1()
    thread2()

   /* Output
    * ------
    * Value from thread 2: Box@6b925f95
    * Value from thread 1: Box@6b925f95
    */
}
```

We've achieved thread safety as both the threads have the same instance of `Box`.

## Conclusion

- The optimization happens only on `Provider<T>.get(T)` which could be recursive, hence some checks like `DoubleCheck<T>.reentrantCheck` are made to avoid transitivity.
- If we use `@Reusable` then dagger caches the factory provider using `SingleCheck<T>` idiom which is not thread safe & can cause repeated initialization if the field is accessed from different threads at the same time. Hence, the docs says "limit the number of provisions of a type" not a single instance.
- Using `@Singleton` or injecting via `dagger.Lazy<T>` caches the factory provider using `DoubleCheck<T>` idiom which is thread safe.

<!-- The generated code will not change since our implementation doesn't contain any dependency nor it is used as a dependency. Hence, there won't be any field which `DaggerAppComponent` will cache to reuse these instances. Instead the factory generated methods will directly delegate the call to the `AppModule` methods`` for providing instances. -->

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
