cc-commands-ts
=================

TypeScript implementation of Claude Code commands


[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/cc-commands-ts.svg)](https://npmjs.org/package/cc-commands-ts)
[![Downloads/week](https://img.shields.io/npm/dw/cc-commands-ts.svg)](https://npmjs.org/package/cc-commands-ts)


<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g cc-commands-ts
$ cc-ts COMMAND
running command...
$ cc-ts (--version)
cc-commands-ts/0.0.0 linux-x64 node-v22.14.0
$ cc-ts --help [COMMAND]
USAGE
  $ cc-ts COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`cc-ts hello PERSON`](#cc-ts-hello-person)
* [`cc-ts hello world`](#cc-ts-hello-world)
* [`cc-ts help [COMMAND]`](#cc-ts-help-command)
* [`cc-ts plugins`](#cc-ts-plugins)
* [`cc-ts plugins add PLUGIN`](#cc-ts-plugins-add-plugin)
* [`cc-ts plugins:inspect PLUGIN...`](#cc-ts-pluginsinspect-plugin)
* [`cc-ts plugins install PLUGIN`](#cc-ts-plugins-install-plugin)
* [`cc-ts plugins link PATH`](#cc-ts-plugins-link-path)
* [`cc-ts plugins remove [PLUGIN]`](#cc-ts-plugins-remove-plugin)
* [`cc-ts plugins reset`](#cc-ts-plugins-reset)
* [`cc-ts plugins uninstall [PLUGIN]`](#cc-ts-plugins-uninstall-plugin)
* [`cc-ts plugins unlink [PLUGIN]`](#cc-ts-plugins-unlink-plugin)
* [`cc-ts plugins update`](#cc-ts-plugins-update)

## `cc-ts hello PERSON`

Say hello

```
USAGE
  $ cc-ts hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ cc-ts hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [src/commands/hello/index.ts](https://github.com/cc-commands/cc-commands-ts/blob/v0.0.0/src/commands/hello/index.ts)_

## `cc-ts hello world`

Say hello world

```
USAGE
  $ cc-ts hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ cc-ts hello world
  hello world! (./src/commands/hello/world.ts)
```

_See code: [src/commands/hello/world.ts](https://github.com/cc-commands/cc-commands-ts/blob/v0.0.0/src/commands/hello/world.ts)_

## `cc-ts help [COMMAND]`

Display help for cc-ts.

```
USAGE
  $ cc-ts help [COMMAND...] [-n]

ARGUMENTS
  COMMAND...  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for cc-ts.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.31/src/commands/help.ts)_

## `cc-ts plugins`

List installed plugins.

```
USAGE
  $ cc-ts plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ cc-ts plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.45/src/commands/plugins/index.ts)_

## `cc-ts plugins add PLUGIN`

Installs a plugin into cc-ts.

```
USAGE
  $ cc-ts plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into cc-ts.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the CC_TS_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the CC_TS_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ cc-ts plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ cc-ts plugins add myplugin

  Install a plugin from a github url.

    $ cc-ts plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ cc-ts plugins add someuser/someplugin
```

## `cc-ts plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ cc-ts plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ cc-ts plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.45/src/commands/plugins/inspect.ts)_

## `cc-ts plugins install PLUGIN`

Installs a plugin into cc-ts.

```
USAGE
  $ cc-ts plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into cc-ts.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the CC_TS_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the CC_TS_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ cc-ts plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ cc-ts plugins install myplugin

  Install a plugin from a github url.

    $ cc-ts plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ cc-ts plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.45/src/commands/plugins/install.ts)_

## `cc-ts plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ cc-ts plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ cc-ts plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.45/src/commands/plugins/link.ts)_

## `cc-ts plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ cc-ts plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ cc-ts plugins unlink
  $ cc-ts plugins remove

EXAMPLES
  $ cc-ts plugins remove myplugin
```

## `cc-ts plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ cc-ts plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.45/src/commands/plugins/reset.ts)_

## `cc-ts plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ cc-ts plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ cc-ts plugins unlink
  $ cc-ts plugins remove

EXAMPLES
  $ cc-ts plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.45/src/commands/plugins/uninstall.ts)_

## `cc-ts plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ cc-ts plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ cc-ts plugins unlink
  $ cc-ts plugins remove

EXAMPLES
  $ cc-ts plugins unlink myplugin
```

## `cc-ts plugins update`

Update installed plugins.

```
USAGE
  $ cc-ts plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.45/src/commands/plugins/update.ts)_
<!-- commandsstop -->
