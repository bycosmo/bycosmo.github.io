---
title: Picking a language for the compiler
description: With all these options, what is a girl to do?
pubDate: 12-31-2024
---

I'll be honest, I'm most comfortable with JavaScript. So why not pick that one? Well, JavaScript and performance don't necessarily go hand in hand. That doesn't mean we can't use JavaScript at all. What about a different runtime? Deno? Bun?

I don't like this because it raises a barrier to entry, and how would it work? If someone installs the framework are they required to download Deno to get it working?

It just doesn't feel good to me. So let's not.

## Golang or Zig or Rust

At the time of writing, these are the big three non-JavaScript langauges that are considered "highly performant". Half the JavaScript tooling ecosystem is being rewritten in Rust. Bun has helped to put Zig on the map. At least for web developers that don't worry about things that the GC takes care of for us. Go has been on my radar for a while. CodePen's backend is written in it, and Astro's compiler is too.

But lets go over the benefits and cons of each.

### Rust

The pros are it's memory efficient, type safe, and has a great community. Downside, for the life of me I don't understand the difference between `String` and `str` and still don't understand how lifetimes work. Coming from a web dev background, memory safety is... cool or whatever, but I like having a GC to back me up.

### Zig

Honestly, I wanted to love it. But I ran into similar problems. Things were just more complicated than they needed to be.

### Golang

I don't like it. There are things that just aren't super clear from the get go. For example, you've got a variable called `personName`. That variable is private. How do you make it public and accessible from another module? Capitalize the first letter. What?

No such thing as objects either!

What kind of hellish landscape is this??

So anyways, I'm choosing to use Go for the compiler.

## But you just said...

Yeah, but here's the thing. Astro's compiler is written in Go. While I don't plan on using or copying code directly, I would at least have something to go off of. Go tooling is also really nice! A few times already I've been saved by it when I made some stupid mistake. A lot of the syntax is... weird to me. Like take this for example:

```go
package myThing

type thing struct {
    name string
}
func (t thing) Name() {
    return t.name
}
```

So there are sort of objects? Not like... JavaScript objects, but like... I don't know. But at some point you're going to need object-like things, and structs are the way to do that. A collection of functions is an object. If I compare this to JavaScript, I would do something like this:

```js
let name = 'Your Name Here';
const thing = {
    get name() {
        return name;
    }
}
```

So we're making the `Name` function exportable. By adding the `(t thing)` before the function name, we're saying it is a member of the `thing` struct. Then I can import it like this:

```go
package main

import (
    "myThing"
    "fmt"
)

func main() {
    fmt.Println(thing.Name())
}
```

Is this example convoluted? Yes. But whatever, it demonstrates a point.

So I'm going with go (ha, funny) and it's been a blast so far.