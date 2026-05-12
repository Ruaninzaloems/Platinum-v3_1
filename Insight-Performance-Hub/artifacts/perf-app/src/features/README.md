# Features

One folder per business domain. Each feature is self-contained and may
include sub-components and dialogs scoped to that feature only. Shared
UI primitives live in `../components/ui/`, shared services in
`../core/services/`.

Mirrors the Angular-standard `features/` directory:
```
features/{feature-name}/
  {feature-name}.component.tsx       # main page component
  components/                        # sub-components scoped to the feature
  dialogs/                           # dialog components scoped to the feature
```
