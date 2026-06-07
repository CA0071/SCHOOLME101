# MCP TOOLS REFERENCE — SCHOOLME101

Complete reference for all tools exposed by the SCHOOLME101 MCP Server.

---

## Tool List

| Tool | Description |
|------|-------------|
| `get_subject_content` | Full curriculum content for a subject |
| `search_curriculum` | Keyword search across all subjects |
| `get_grade_overview` | All subjects for a specific grade |
| `get_ai_tutor_instructions` | AI tutoring guidelines |
| `list_all_subjects` | Complete subject list with grades |
| `get_subject_by_grade` | Subject content for a specific grade |
| `search_by_topic` | Deep topic search (filtered by grade/subject) |

---

## Tool Details

### `get_subject_content`

Retrieve the full CAPS curriculum markdown content for a named subject.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `subject` | string | ✅ | Subject name, e.g. `"Mathematics"` |
| `grade` | string | ❌ | Grade filter, e.g. `"Grade 12"` |

**Example:**
```json
{
  "name": "get_subject_content",
  "arguments": { "subject": "Life Sciences", "grade": "Grade 12" }
}
```

---

### `search_curriculum`

Free-text search across all curriculum subjects. Returns ranked excerpts.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | ✅ | Search query |
| `grade` | string | ❌ | Restrict to a specific grade |
| `maxResults` | number | ❌ | Max results to return (1–50, default 10) |

**Example:**
```json
{
  "name": "search_curriculum",
  "arguments": { "query": "algebra", "grade": "Grade 9", "maxResults": 5 }
}
```

---

### `get_grade_overview`

Get a summary of all subjects available for a specific grade.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `grade` | string | ✅ | Grade, e.g. `"Grade R"`, `"Grade 6"`, `"Grade 12"` |

**Example:**
```json
{
  "name": "get_grade_overview",
  "arguments": { "grade": "Grade 12" }
}
```

---

### `get_ai_tutor_instructions`

Return the AI tutor guidelines including age-appropriate communication styles.

**Parameters:** _(none)_

**Example:**
```json
{
  "name": "get_ai_tutor_instructions",
  "arguments": {}
}
```

---

### `list_all_subjects`

Return a sorted markdown table of every subject with its grade and phase.

**Parameters:** _(none)_

**Example:**
```json
{
  "name": "list_all_subjects",
  "arguments": {}
}
```

---

### `get_subject_by_grade`

Get curriculum content for a specific subject + grade combination.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `subject` | string | ✅ | Subject name |
| `grade` | string | ✅ | Exact grade, e.g. `"Grade 11"` |

**Example:**
```json
{
  "name": "get_subject_by_grade",
  "arguments": { "subject": "Mathematics", "grade": "Grade 11" }
}
```

---

### `search_by_topic`

Deep search within a specific subject and/or grade for a topic.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `topic` | string | ✅ | Topic to find |
| `grade` | string | ❌ | Grade filter |
| `subject` | string | ❌ | Subject filter |

**Example:**
```json
{
  "name": "search_by_topic",
  "arguments": { "topic": "fractions", "grade": "Grade 6" }
}
```

---

## Resources

| URI | Description |
|-----|-------------|
| `schoolme://subjects` | JSON list of all subject names |
| `schoolme://grades/{grade}` | JSON list of subjects for a grade |
| `schoolme://subject/{subjectName}` | Markdown content for a subject |
| `schoolme://tutor-instructions` | AI tutor instructions markdown |
| `schoolme://curriculum/search` | JSON search index of all entries |

---

## Available Grades

The SCHOOLME101 repository includes curriculum files for the following grades:

- **Grade R** — Foundation Phase
- **Grade 3** — Foundation Phase
- **Grade 6** — Intermediate Phase
- **Grade 9** — Senior Phase
- **Grade 11** — FET Phase
- **Grade 12** — FET Phase
