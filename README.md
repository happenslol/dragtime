# Dragtime

Dragtime is a minimalist library for drag and drop lists. At the moment, the features are:

-   Vertical and horizontal lists
-   Smooth animations for reordering elements and resetting
-   Great performance even for large datasets
-   Arbitrarily deep nested scroll container support
-   Automatic edge scrolling

The library has no **dependencies whatsoever** and is **~5kb gzipped**.

### Roadmap

The following big features are still work in progress:

-   Vertical and horizontal grid lists
-   Dragging and dropping between multiple lists of the same type

### Usage

You'll need to import the `Sortable` class and the styles from `src/styles.scss`.
The list element itself can not be scrollable, but can be wrapped in an arbitrary amount of scroll containers.

Here's a simple usage example:

```
import { Sortable } from "dragtime"

const element = document.getElementsByClassName("some-list")
const sortable = new Sortable(element)
```
