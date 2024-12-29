+++
authors = ["Kaustubh Patange"]
title = "Vim 02 - Current & Previous buffer"
date = "2024-12-29"
tags = [ "vim" ]
+++

Sometimes we want to get current or previous buffer id, name or type so that we can run some custom logic based on certain conditions.

<!--more-->

One example would be to switch to previous buffer from current buffer like suppose you are in Neo-tree and without closing it you would want to switch to last file buffer. In vim, such information is stored in following special marker or shortcut,

- <kbd>%</kbd> represents the current buffer.
- <kbd>#</kbd> represents the alternate (previous) buffer.

Using functions like `bufnr('#')` or `expand('#')` you can get the ID or name of the previous / alternate buffer (same for `%` buffer). To get for specific buffer id let's say 5 do `expand('#5')`.

Each buffer is contained within a Window which is contained within a Tab. You can access them via `win_getid(number)` & `tabpagenr(number)` respectively. Leave the number param empty to get current window or tab page.

If you want to switch to previous buffer, press `:b#`. If you want to move to specific buffer `:b5`.

<div class="separator" />

## Neovim Specific

- `vim.api.nvim_get_current_buf()` gives you current buffer id.
- `vim.api.nvim_buf_get_name(bufnr)` gives you name for buffer id.
- `vim.api.nvim_get_current_win()` gives you current win id.

Similarly we also have [vim.bo](https://neovim.io/doc/user/lua.html#vim.bo) & [vim.wo](https://neovim.io/doc/user/lua.html#vim.wo) to get metadata related to buffer & window. For eg: to identify if a buffer is a file you can do `vim.bo[bufnr].buftype == ''`.

Following are the options for bo and wo, use `:h <option-name>` to understand what each means.
```
vim.bo: {
    bufhidden: string = 'hide',
    buftype: string = 'nofile',
    filetype: string = 'man',
    modifiable: boolean = true|false,
    modified: boolean = false,
    readonly: boolean = true|false,
    swapfile: boolean = false,
}
```

```
vim.wo: {
    cursorcolumn: boolean = true|false,
    cursorline: boolean = true|false,
    winhighlight: string = ""|"CursorLine:CursorHighlight,CursorColumn:CursorHighlight",
    wrap: boolean,
}
```
