# Current state audit

Audit date: 2026-08-08, before the StudyNova Chinese rebuild.

## Repository structure

- `index.html` — single-file ChineseMaster home/application (inline CSS and JavaScript).
- `chinesemaster_writing_vault.html` — single-file writing vault (inline CSS and JavaScript).
- No manifest, service worker, automated tests, build tool, or asset directory existed.

## Persistence

The application used browser `localStorage`; no IndexedDB database was opened.

| Key | Producer/consumer | Contents |
| --- | --- | --- |
| `chinesemaster_data_v1` | Home and Writing Vault | Chinese vocabulary, settings, mistakes, speaking logs, backup metadata |
| `vocabmaster_data_v1` | Legacy code in Home | Old vocabulary state; may exist for previous users |
| `chinesewritingvault_data_v1` | Writing Vault | Essays, corrections, topics, imported vocabulary, theme and backup metadata |
| `chinesemaster_local_user` | Deprecated local/Firebase auth prototype | Local profile data |

The rebuild must preserve and migrate the first three keys without destructive reset. The deprecated user key must be left untouched even though auth UI and Firebase are removed.

## Links and offline support

- Internal links between `index.html` and `chinesemaster_writing_vault.html` resolved.
- Firebase CDN scripts were external runtime dependencies and authentication controls were present despite being out of scope.
- No broken static internal path was found.
- There was no install manifest or service worker, so install/offline links did not exist.

## Noted issues

- Two competing `save()` implementations and reassignment of the storage key occurred in `index.html`.
- Vietnamese and English strings were mixed; 简体中文 was not complete.
- Emoji were used as interface icons.
- IELTS legacy names/topics remained in the code.
- Authentication/Firebase code contradicted the standalone local-first goal.
- Audio recordings were session-only object URLs.

## Rebuild plan

Retain the established local keys, introduce a storage adapter boundary, add non-destructive schema normalization plus combined backup/restore, remove authentication, replace icons with SVG, add Vietnamese/简体中文 localization, and add a manifest/service worker for an installable local-first application.
