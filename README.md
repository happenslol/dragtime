# Dragtime

Dragtime is a minimalist library for drag and drop lists. At the moment, the features are:

-   Vertical and horizontal lists
-   Smooth animations for reordering elements and resetting
-   Great performance even for large datasets
-   Arbitrarily deep nested scroll container support
-   Automatic edge scrolling

The library has **no dependencies whatsoever** and is **~5kb gzipped**.

### Roadmap

The following big features are still work in progress:

-   Vertical and horizontal grid lists
-   Dragging and dropping between multiple lists of the same type

### Usage

Use the sortable class and pass it the element that contains all your list items.
The list element itself can not be scrollable, but can be wrapped in an arbitrary amount of scroll containers.

Here's a simple usage example:

#### From VanillaJS

```html
<html>
    <head>
        <title>Dragtime example</title>
        <script src="dist/dragtime.js"></script>
    </head>

    <body>
        <ul id="sortable">
            <li>item 1</li>
            <li>item 2</li>
            <li>item 3</li>
        </ul>

        <script>
            var element = document.getElementById("sortable")
            var sortable = Dragtime.create(element)
        </script>
    </body>
</html>
```

#### From Typescript

```ts
import { Sortable } from "dragtime"

const element = document.getElementById("sortable")
const sortable = new Sortable(element)
```

Here's how to retrieve the order of the elements:

```ts
// This returns the elements of the sortable items
// as a sorted array
const elements = sortable.toArray()

// This returns the ids of the elements. These can be
// set manually by adding data-id="something" to the element,
// otherwise they will be autogenerated.
const ids = sortable.toIdArray()

// This returns a sorted array of the items' original index
// when the sortable was created.
const indices = sortable.toIndexArray()
```

### Options

Additionally, you can pass an options object to customize more behaviour. Here's what each option does:

```ts
const options = {
    // Can be either a value from the enum ListType or a string.
    // possible values: "vertical", "horizontal"
    // defaults to "horizontal"
    listType: ListType,

    // Here you can provide a custom selector for the list children. If not
    // defined, the direct children of the sortable container will be used.
    // e.g. "li > div > p"
    // defaults to undefined
    childSelector: string,

    // Accepts an object containing classes that will be applied to the
    // different elements on drag. See below.
    customClasses: CustomClasses,
}

const customClasses = {
    // Applied to an item while it is being dragged.
    draggingItem: string,

    // Applied to all other items while an item is being dragged.
    draggingItems: string,

    // Applied to the sortable container while an item is being dragged.
    draggingContainer: string,
}
```

### Custom handle

If you don't want the entire list elements to be the drag handle, you can define which child element should be grabbable. Just add the `data-handle` attribute to the element. Whether or not an element has a handle and where it is can be different for each element, and Dragtime will set the required styles for you (Such as cursor style). Here's an example:

```html
<li class="list-item">
    <div class="handle" data-handle>
    <p class="text">
        This is a list item with a custom handle.
    </p>
</li>
```

### Events

Dragtime features a custom event system which you can hook into to interact with drag and drop actions. You can either add an event listener on the `Sortable` object or directly on the container element you passed to the `Sortable` constructor. Here are the event types you can listen to:

```ts
// Fired when a drag begins
"dtdragstart"

// Fired when the entire drag and drop action is done and the sortable is
// ready for the next interaction
"dtdragend"

// Fired when the user lets go of the item
"dtdragdropped"

// Fired when a the user exits the bounds of the scrollable container
// while dragging an item
"dtexitbounds"

// Fired when a the user re-enters the bounds of the scrollable container
// while dragging an item
"dtenterbounds"
```

All of these events will contain a `details` object with the following properties:

```ts
{
    // The element that is being dragged
    draggingItem: HTMLElement,

    // the sortable container element
    sortable: HTMLElement,
}
```

### Compatibility

Dragtime is not trying to provide as much browser compatibility as possible, instead it is targeting only evergreen browsers and as a result can drop all dependencies and be more efficient.

### License
Dragtime is licensed under the MIT license, so you can use it for whatever you want.
