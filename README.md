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

```ts
import { Sortable } from "dragtime"

const element = document.getElementsByClassName("some-list")
const sortable = new Sortable(element)
```

### Compatibility

Dragtime is not trying to provide as much browser compatibility as possible, instead it is targeting only evergreen browsers and as a result can drop all dependencies and be more efficient.
