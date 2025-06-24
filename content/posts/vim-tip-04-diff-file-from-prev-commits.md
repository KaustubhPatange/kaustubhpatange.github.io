+++
authors = ["Kaustubh Patange"]
title = "Vim 04 - Diff file from previous commits"
date = "2025-06-24"
tags = [ "vim" ]
+++

We've all faced the situation where we want to reset a file back to its state in a previous commit. The command `git restore --source HEAD~1 <path-to-file-from-root>` does exactly this.

<!--more-->

However, this is not a straightforward action, as we first need to determine whether the file should be undone or not. Having to switch to a GUI or open a new browser tab just to view the diff means leaving the terminal, which isn't ideal since context switching can reduce productivity.

Vim provides a great diff tool that you can use to compare two files in several ways: 

- Open a file in the buffer, type `:diffthis`, then open another file in a vertical or horizontal split and type `:diffthis` again. To turn if off `:diffoff`.
- Alternatively, use :vert diffsplit #, where # points to the previous buffer.

This works well for local files, but what about comparing with Git versions?

### Diffing Git files

- You can use the command `:vert diffsplit term://git show HEAD^:path/to/file.js` for this purpose. You can change `HEAD^` to `HEAD~2` to compare the file with its version from two commits ago, and so on. 
- Alternatively, if you have vim-fugitive plugin installed, you can use `:Gvdiffsplit HEAD^:path/to/file.js` to achieve the same result.

The advantage of the second approach over the first is that it preserves the syntax highlighting of the file when you're comparing source code. With the first approach, you have to manually set the syntax using `:set syntax=<type>`, but the latter handles that for you automatically.
