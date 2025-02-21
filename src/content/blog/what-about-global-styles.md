---
title: What about global styles?
description: The Shadow DOM is your friend. Most of the time.
pubDate: 01-22-2025
---

I can hear you now. "But if every component is encapsulated in the Shadow DOM &trade; then how am I supposed to style anything?"

And yeah, that's a good point.

But there's plenty of work being done to make styling in the Shadow DOM easier. You have the `::part()` selector, you have `adoptedStyleSheets`, you have good compiling?

But that said, Cosmo is a framework, it should offer solutions to solve those issues. A few ways I see it breaking down is to either A) Inline all the styles, B) Adopted Stylesheets, C) `:global()`, D) Abandon DSD entirely, E) A secret 5th option

## A) Inline all the styles

You've got your element that looks like this right:

```html
<button>
    <slot>Fancy fallback text</slot>
</button>

<style>
button {
    background-color: rebeccapurple;
}
</style>
```

Look at that, fancy! But we want these styles to be scoped, per Component Driven Design demands.

We could add a class? We could add a data attribute to act as a selector solely for scoping?

Or we could just use the Shadow DOM?

```html
<fancy-button>
    <template shadowrootmode="open">
        <style>
            button {
                background-color: rebeccapurple;
            }
        </style>
        <button>
            <slot>Fancy fallback text</slot>
        </button>
    </template>
</fancy-button>
```

Now we can feel free to use this button and know with confidence that the background color will always be rebeccapurple. The trouble with this encapsulation is that styles from outside can't get in.

What about the styles we have in our `index.css`

```css
button {
    background-color: red;
    font-size: 1.5rem;
    border-color: yellowgreen;
}
```

Some of those properties can pierce the Shadow DOM, but only through inheritance. Which means our button is now SOL and not styled like every other button.

Now we inline all the styles!

```html
<fancy-button>
    <template shadowrootmode="open">
        <style>
            button {
                background-color: red;
                font-size: 1.5rem;
                border-color: yellowgreen;
            }
            button {
                background-color: rebeccapurple;
            }
        </style>
        <button>
            <slot>Fancy fallback text</slot>
        </button>
    </template>
</fancy-button>
```

Hmmm, that's not good though, now there's duplicate selectors and now styling is going to be that much harder.

We could do some fancy bundling to de-dupe the CSS, but then we still have to put the global CSS into each custom element. We're losing out on the benefits that come from caching when we do this.

## B) Adopted StyleSheets

One solution is to pass on this responsibility to the component itself.

```js
// I forget how the type assertion is supposed to work, so this is pseudo code
import GlobalStyleSheet from './path/to/global/index.css' with { assert: 'text/css' }
customElements.define('fancy-button', class extends HTMLElement {
    constructor() {
        super();
        this.shadowRoot.adoptedStyleSheets.push(GlobalStyleSheet)
    }
})
```

But this has it's own problems. We're now relying on JavaScript (Notoriously the slowest language of the web platform) to deal with importing and applying styles. Yanking control away from the browser is not something I'm interested in.

## C) `:global()`

Astro (and other frameworks I believe) offer a `:global()` selector.

```css
.my-fancy-button {
    /** These styles are scoped to the SFC they are in */
}
:global(.my-fancy-button) {
    /** These styles are kicked up to the global scope during bundling */
}
```

In the context of DSD, this would mean they are either inlined in every element or there is some other way of including them in the Shadow DOM.

Either way it is a band-aid solution that doesn't even solve the root problem.

## D) Abandon the Shadow DOM entirely

Why use DSD at all? Isn't the light DOM enough?

For most cases, it is, and if you're here looking for tips on how to use Web Components, my first tip is "just use the light dom".

Using the light dom means a couple things though. We still need a scoping solution. We could adopt what Astro and Vue do with their auto class/data-astro-{hash} solution. We could use the new and upcoming CSS scoping features.

-# Whelp, forgot where I was going with this