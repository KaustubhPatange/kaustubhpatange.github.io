+++
authors = ["Kaustubh Patange"]
title = "Vim 03 - Search file with Live Grep"
date = "2025-03-24"
tags = [ "vim" ]
+++

Find files with telescope uses `fd` and it is not as flexible as ripgrep.

<!--more-->

Live Grep is more powerful; however, it cannot be used to find files in a directory, as it only searches for text within files. Using the `rg --files` option doesn't resolve this limitation either.

For cases such as finding files that start with a specific pattern or are contained within a directory, we can use the `-g` option. Therefore, ripgrep proves to be a powerful tool.

- In Live Grep window, `"" -g "**/*<dir-name>*/**" -g "**/*<dir-name>**" -m1` will search for files that contains `<dir-name>`.

The `-m1` option will match only the first occurrence in a file and ignore subsequent matches within the same file. This prevents duplicates, and when combined with multiple `-g` options, the search becomes more flexible. It's important to note that the order of `-g` patterns matters; you should begin with patterns that match broadly and then progressively narrow down to more precise patterns.
