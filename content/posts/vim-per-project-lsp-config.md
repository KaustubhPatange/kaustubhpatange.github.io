+++
authors = ["Kaustubh Patange"]
title = "Vim - Per-project LSP config with lua"
date = "2026-03-08"
tags = [ "vim" ]
+++

We've all been in a situation where a project needs slightly different editor behavior, maybe import paths should resolve non-relatively for one codebase, or a different formatter should run on save. The usual solution is to hardcode this into your global Neovim config, which means it bleeds into every project.

<!--more-->

VS Code handles this cleanly with `.vscode/settings.json`, a per-project file that overrides workspace settings. Neovim has an equivalent, and it's more powerful than most people realize.

### .nvim.lua

Neovim supports a built-in local config file called `.nvim.lua`. When you open Neovim in a directory, it looks for this file and executes it if trusted. Enabling it is a single line in your `init.lua`:

```lua
vim.opt.exrc = true
```

Now you can drop a `.nvim.lua` in any project root:

```lua
-- /your-project/.nvim.lua
vim.opt.tabstop = 4
vim.keymap.set("n", "<leader>rr", ":!node %<CR>")
```

This is pure Lua, you have full access to the Neovim API, so it goes well beyond what `.vscode/settings.json` is capable of.

### Custom filename with vim.secure.read

`.nvim.lua` is the only filename Neovim looks for out of the box. If you prefer a different name, say `.lua` with a fallback in `.folder/.lua`, you can replicate the same behavior using `vim.secure.read`:

```lua
local function load_local(candidates)
  for _, name in ipairs(candidates) do
    local path = vim.fn.getcwd() .. "/" .. name
    local content = vim.secure.read(path)
    if content then
      local fn, err = load(content, "@" .. path)
      if fn then fn() end
      return
    end
  end
end

load_local({ ".lua", ".folder/.lua" })
```

`vim.secure.read` is what powers `exrc` under the hood. It checks the trust database before executing, so the security model is identical to `.nvim.lua`.

### Trust & security

Both approaches use the same trust system. The first time Neovim encounters an unknown file it prompts:

```
/your-project/.lua is not trusted.
[i]gnore, (v)iew, (d)eny, (a)llow:
```

View the file, run `:trust`, and Neovim writes a SHA256 hash of its contents to `~/.local/state/nvim/trust`. If the file changes, it prompts again. To revoke trust, open the trust file and delete the line:

```
nvim ~/.local/state/nvim/trust
```

### Merging LSP config locally

Where this gets useful is per-project LSP settings. If your LSP setup exposes a `setup(merge_config)` function that deep merges into a base config, your `.lua` can override only what it needs:

```lua
-- Snippet from:
-- https://github.com/KaustubhPatange/init.lua/blob/fa1f140e10890fd8bb4f037b1460ef9f8ce0ba96/lua/kp/plugins/config/lsp/ts-tools.lua

local ts = require("kp.plugins.config.lsp.ts-tools")

ts.setup({
  settings = {
    tsserver_file_preferences = {
      importModuleSpecifierPreference = "non-relative",
    },
  },
})
```

The base global config stays untouched. Only this project gets the override.
