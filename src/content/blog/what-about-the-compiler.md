---
title: What about the compiler?
description: Let's go over what exactly the compiler should do. What it should take in, what it should spit out, and what else needs to happen along the way.
pubDate: 01-03-2025
---

It's no secret that Cosmo takes a lot of inspiration from Astro. From the way the `.cosmo` file looks, to the fact that I chose Golang for the compiler, it's been a guiding north star. But there are differences that I need to talk out and solidify. 

## What is different?

Astro's compiler takes `.astro` files and compiles them down to a TypeScript component that returns JSX. Then the magic of Astro turns that into valid HTML, server side rendered, 0 JavaScript on the client side.

That... *should* be possible with what I'm trying to do.

A `.cosmo` component has a few different end states. There's the end goal of 0 client-side JavaScript, Interactivity mode, and Dynamic mode. Calling these a "mode" is really just dramatic, it's more trying to classify each type of component.

## 0 Client-side JavaScript

Is a 0 JavaScript end state possible? Yes, take this component for example:

```astro
<li>
    <slot></slot>
</li>

<style>
li {
    color: limegreen;
    display: inline-block;
    margin-inline: 0.5ch;
}
</style>
```

No JavaScript necessary! But let's look at what that final version looks like. This is some sort of menu item, so let's put it in context.

```astro
---
import MenuItem from './menu-item.cosmo';
---

<ul>
    <li>My Menu</li>
    <MenuItem>
        <a href="./path/to/somewhere">Menu Item 1</a>
    </MenuItem>
    ...
</ul>
```

Run this through the compiler and what *should* we get?

```html
<ul>
    <li>My Menu</li>
    <menu-item>
        <template shadowrootmode="open">
            <style>
                :host {
                    display: contents;
                }
                li {
                    color: limegreen;
                    display: inline-block;
                    margin-inline: 0.5ch;
                }
            </style>
            <li>
                <a href="./path/to/somewhere">Menu Item 1</a>
            </li>
        </template>
    </menu-item>
</ul>
```

By taking advantage of the Declarative Shadow DOM (DSD), the browser sees this and interprets this as:

```html
<ul>
    <li>My Menu</li>
    <menu-item>
        <!-- #shadow -->
        <style>
            :host {
                display: contents;
            }
            li {
                color: limegreen;
                display: inline-block;
                margin-inline: 0.5ch;
            }
        </style>
        <li>
            <a href="./path/to/somewhere">Menu Item 1</a>
        </li>
        <!-- /#shadow -->
    </menu-item>
</ul>
```

We are able to automatically "adopt" (there's probably a better word for that, but for now I'm using adopt) the HTML inside the template with 0 JavaScript.

This is fine for 75% of component driven design. This covers your fancy titles, your colocating styles, the front of the front-end development spectrum.

## Some Client-side JavaScript (AKA Interactivity Mode)

What about things like interactivity though? Let's look at this button example:

```astro
---
const fetchApi = 'https://example.com/api/endpoint.json';
---

<button data-fetch={fetchApi}>Click me to fetch something</button>
<output></output>

<style>
output {
    font-family: 'MySuperSpecialMonoFont';
}
</style>

<script>
const btn = this.querySelector("button");
const output = this.querySelector("output");

this.addEventListener('click', async () => {
    const result = await fetch(btn.dataset.fetch);
    const json = await result.json();
    output.innerHTML = `<pre><code>${json}</code></pre>`;
})
</script>
```

This looks a lot more like an Astro component than it does a snippet of HTML. There's some data that is serverside, everything between the fences `---`, there's some interactivity, and some styles that need colocating. A straight DSD template can't cover all of this though.

But why are we using `this`? Remember, every `.cosmo` component ends up a Web Component. The result of that is any interactivity lives in the scope of that final Web Component's `connectedCallback`. Cosmo also provides a base web component to build off of. Our final Web Component now looks like this:

```ts
import { Base } from '@bycosmo/base'

// The component name is derived from the .cosmo file name
export class FetchButton extends Base {
    connectedCallback() {
        const btn = this.querySelector("button");
        const output = this.querySelector("output");

        this.addEventListener('click', async () => {
            const result = await fetch(btn.dataset.fetch);
            const json = await result.json();
            output.innerHTML = `<pre><code>${json}</code></pre>`;
        })
    }
}
```

> ### **What about `disconnectedCallback`?**
>
> The plan for how to deal with `disconnectedCallback` is a little unclear for now. Balancing what makes sense with the Web Component model and what is easy to do for the compiler is tough.
> For example, one thought is to make a method on the `<C-Base />` component that Cosmo provides, let's call it `connected` and then allow you to return a cleanup function
> ```js
> class CBase extends HTMLElement {
>   connected() {}
>   connectedCallback() {
>       this.disconnectedCallback = this.connected() || noop;
>   }
> }
>
> class MyElement extends CBase {
>    connected() {
>       this.addEventListener('click', doClick);
>       return () => this.removeEventListener('click', doClick);
>   }
> }
> ```
> This would make adding a `disconnectedCallback` easy and uses an already understood pattern (returning a cleanup function). Then our `.cosmo` components still look clean.
> ```astro
> <button>Click me</button>
> <script>
>     this.addEventListener('click', doClick);
>     return () => this.removeEventListener('click', doClick);
> </script>
> ```

Then in our page, this gets transformed into:

```html
<fetch-button>
    <template shadowrootmode="open">
        <style>
        output {
            font-family: 'MySuperSpecialMonoFont';
        }
        </style>
        <button data-fetch="https://example.com/api/endpoint.json">Click me to fetch something</button>
        <output></output>
    </template>
</fetch-button>
```

Then the compiler adds at the bottom of the page a script that looks like this:

```html
<script type="module">
    (await Promise.allSettled([import('./path/to/component.ts'), ...])).map(cmp => cmp.define());
</script>
```

This then runs the `static define` method to define each component on the page. So with a `.cosmo` page like this:

```astro
---
import FetchButton from './components/fetch-button.cosmo';
import MenuItem from './components/menu-item.cosmo';
---

<!DOCTYPE html>
<html>
    <head>...</head>
    <body>
        <nav>
            <ul>
                <MenuItem>Testing</MenuItem>
            </ul>
        </nav>
        <FetchButton />
    </body>
</html>
```

We should get at the end of the compiling process HTML that looks like this:

```html
<!DOCTYPE html>
<html>
    <head>...</head>
    <body>
        <nav>
            <ul>
                <menu-item>
                    <template shadowrootmode="open">Testing</template>
                </menu-item>
            </ul>
        </nav>
        <fetch-button>
            <template shadowrootmode="open">
                <style>
                output {
                    font-family: 'MySuperSpecialMonoFont';
                }
                </style>
                <button data-fetch="https://example.com/api/endpoint.json">Click me to fetch something</button>
                <output></output>
            </template>
        </fetch-button>
        <script type="module">
            // while I plan on using vite to make this sort of resolving easier, for now assume it is a js file
            (await Promise.all([import('./path/to/fetch-button.js')])).map(cmp => cmp.define())
        </script>
    </body>
</html>
```

## What to do about props? (AKA Dynamic Mode)

I would say with the two versions above, we've completed the front of the front end spectrum. If we move towards the middle of the front end, we have to deal with complexity like passing props, dynamic loading, awaiting requests from the server.

This is when the frontmatter of your `.cosmo` component is more complex than a static variable.

It's also the least thought out part of the compiler. For example, how are props defined? Everything is a module at the end of the day, so we can take advantage of top level `await`.

For example, I like how Svelte deals with props:

```svelte
<script>
    let { name, age } = $props();
</script>
<h1>{name}: {age} y/o</h1>
```

What if the `.cosmo` treated exported values as props?

```astro
---
// ./components/MyName.cosmo
export const name = 'Jane';
---

<div>
    Their name is {name}
</div>
```

Then we could use them like this:

```astro
<MyName></MyName>
<MyName name="John"></MyName>
```

But then come the hard questions: This is clean when writing the component, but does it make it easy to use the props when using the component elsewhere? How hard would it be to compile from the exported const to an `interface Props` or something similar so that a language server could properly interpret it.

I know nothing about language servers, and honestly it's not important for a 0.0.1 release. That's more for the 1.0.0 release.

So "Dynamic Mode" is on hold while I think that out and finish the compiler work that needs to be done. 

Right now, Interactive Mode is working (minus how to deal with `disconnectedCallback`), and work is starting on how to compile down to a page instead of a component.

> If you're interested to see what work is being done on the compiler [check out the GitHub repo here](https://github.com/bycosmo/compiler) or if you want to see what is in the framework right now, [check out the cosmo repo here](https://github.com/bycosmo/cosmo)