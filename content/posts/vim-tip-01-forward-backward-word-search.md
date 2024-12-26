+++
authors = ["Kaustubh Patange"]
title = "Vim 01 - Searching word under cursor"
date = "2024-12-26"
tags = [ "vim" ]
+++

Whenever you are in a buffer and you want to search for a word under cursor you yank it to a (default) register and then <kbd>/</kbd> + <kbd>Ctrl + R</kbd> + <kbd>"</kbd> to paste it.

<!--more-->

This process can get very repetitive quickly. Don't get me wrong - if you want to search for a whole sentence, you can follow these exact steps. However, if you want to quickly search for a word under the cursor, you can avoid this process completely.

- Press <kbd>\*</kbd> to search for a word under cursor in the **forward** direction.
- Press <kbd>#</kbd> to search for a word under cursor in the **backward** direction.
