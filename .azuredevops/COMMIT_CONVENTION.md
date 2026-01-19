# Commit Message Convention for Azure DevOps

This project uses conventional commits with Azure Boards integration.

## Format

```
<type>(<scope>): <description> [AB#<work-item-id>]

[optional body]

[optional footer]
```

## Types

| Type       | Description                                             |
| ---------- | ------------------------------------------------------- |
| `feat`     | A new feature                                           |
| `fix`      | A bug fix                                               |
| `docs`     | Documentation only changes                              |
| `style`    | Code style changes (formatting, semicolons)             |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf`     | Performance improvement                                 |
| `test`     | Adding or correcting tests                              |
| `build`    | Changes to build system or dependencies                 |
| `ci`       | Changes to CI configuration                             |
| `chore`    | Other changes that don't modify src or test files       |

## Scopes (optional)

- `web` - contoso-web-app
- `blog` - octocat-blog-app
- `ui` - packages/ui
- `platform` - services/platform-api
- `medical` - services/medical-api
- `ai-digest` - services/ai-tool-digest
- `infra` - infrastructure changes

## Azure Boards Linking

The `AB#<id>` syntax automatically links commits to Azure Boards work items.

### Examples

```bash
# Basic feature with work item link
feat(web): add user authentication AB#1234

# Bug fix that closes a work item
fix(platform): resolve null reference error Fixes AB#5678

# Documentation update linked to multiple items
docs: update API documentation AB#9012 AB#3456

# Breaking change
feat(ui)!: redesign button component AB#7890

BREAKING CHANGE: Button props interface has changed
```

## Work Item Keywords

| Keyword         | Effect                                    |
| --------------- | ----------------------------------------- |
| `AB#123`        | Links commit to work item 123             |
| `Fixes AB#123`  | Links and transitions to "Resolved" state |
| `Closes AB#123` | Links and transitions to "Closed" state   |

## Best Practices

1. **Keep the subject line under 72 characters**
2. **Use imperative mood** ("add" not "added")
3. **Don't capitalize the first letter** of the description
4. **No period at the end** of the subject line
5. **Always link to a work item** when applicable
6. **Use the body** to explain what and why (not how)

## Automated Validation

Consider using [commitlint](https://commitlint.js.org/) with the project to enforce these conventions.
