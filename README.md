# Bunt - a minimalist bundling method for client-side JavaScript

This is a pre-alpha project for bringing some peace, sanity and
pragmatism to client-side JavaScript. It's right in the same playing
field as projects like component, grunt, yeoman, bower, browserify, etc.

After observing the development of these tools and listened to the
colorful and ongoing debate, I've come to believe in the following
principles:

1. **Reproducability** - a module that can be built and used at one
point in time must never be broken or has its behavior changed because
its dependencies change.
2. **Encapsulating nested dependencies**. Multiple versions of the same
dependency - even if not desired - must be able to co-exist in a single
bundle. This is the only way of solving certain dependency problems.
3. **Minimal restrictions** Allow for all kinds of compile-to-JS
languages, pre-processed CSS, etc. For each requirement that is enforced
by a bundling system, a certain part of the developer community is
excluded. This is undesirable. 
4. **Minimal external surface** Similarly to 3., using the bundled
components must impose very little on the user and his/her site. It
should be as simple as including one JavaScript file and a stylesheet.

To create a system that conforms to these principles, one needs

1. a package manager
2. a tool that bundles JavaScript
3. something that ties 1. and 2. together

As I believe in inventing as little as possible, Bunt solves only
3. and uses npm for package management and browserify for bundling.

## Requirements for a bunt-compliant module

1. there is a `package.json` that
  - contains a field `"bunt": true"`
  - contains a script called `bunt-assets`
  - has a `main` field that points to a JavaScript file
2. Running `npm run-script bunt-build-assets` will put resulting files
in `./build/` directory, where `.` denotes the module root.

## Todo

- Flesh out this document in more detail
