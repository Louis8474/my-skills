---
name: document-to-markdown
description: Use when asked to read, extract content from, or convert documents — PDF, DOCX, PPTX, XLSX, or HTML files — into Markdown text so an AI agent can process them.
---

# Document to Markdown Conversion

Convert documents to Markdown using the `markitdown-for-ai` Docker image. No local Python install needed — runs entirely in Docker.

## Prerequisites

⚠️ This skill requires **Docker** or **Podman** to be installed and available on your system. Ensure either Docker Desktop or Podman is running before using this skill.

## Quick Commands

This skill uses Docker by default. If Docker is not available, it will automatically try Podman instead.

**From stdin (pipe):**
```bash
# Try Docker first
docker run --rm -i ghcr.io/opentechil/markitdown-for-ai:latest < file.pdf

# If Docker is not available, use Podman:
podman run --rm -i ghcr.io/opentechil/markitdown-for-ai:latest < file.pdf
```

**From a local file (mount current directory):**
```bash
# Try Docker first
docker run --rm -v "$(pwd):/data" -w /data ghcr.io/opentechil/markitdown-for-ai:latest file.docx

# If Docker is not available, use Podman:
podman run --rm -v "$(pwd):/data" -w /data ghcr.io/opentechil/markitdown-for-ai:latest file.docx
```

**Save output to a file:**
```bash
# Try Docker first
docker run --rm -i ghcr.io/opentechil/markitdown-for-ai:latest < input.pptx > output.md

# If Docker is not available, use Podman:
podman run --rm -i ghcr.io/opentechil/markitdown-for-ai:latest < input.pptx > output.md
```

**Pipe from cat:**
```bash
# Try Docker first
cat file.xlsx | docker run --rm -i ghcr.io/opentechil/markitdown-for-ai:latest

# If Docker is not available, use Podman:
cat file.xlsx | podman run --rm -i ghcr.io/opentechil/markitdown-for-ai:latest
```

## Supported Formats

| Format | Extension |
|--------|-----------|
| PDF | `.pdf` |
| Word | `.docx` |
| PowerPoint | `.pptx` |
| Excel | `.xlsx` |
| HTML | `.html` |

## Pull the Image (first time)

```bash
docker pull ghcr.io/opentechil/markitdown-for-ai:latest
```

## Agent Workflow

When a user gives you a document file to read or analyze:

1. Check if Docker is available — if not, try Podman (the skill automatically falls back)
2. Run the conversion command above
2. Capture stdout as the Markdown content
3. Read and reason over the Markdown directly — no temp files needed

**Example — user says "summarize this PDF":**
```bash
# Capture markdown into a shell variable or pipe directly to next step
docker run --rm -i ghcr.io/opentechil/markitdown-for-ai:latest < report.pdf

# If Docker fails, try Podman:
podman run --rm -i ghcr.io/opentechil/markitdown-for-ai:latest < report.pdf
```

## When to Use This Skill

Use this skill whenever you need to extract or process content from documents. Here are common scenarios:

### Document Conversion & Extraction

- **Reading DOCX files**: "Read this Word document", "extract text from docx"
  ```bash
  docker run --rm -v "$(pwd):/data" -w /data ghcr.io/opentechil/markitdown-for-ai:latest document.docx

  # Or with Podman if Docker is not available:
  podman run --rm -v "$(pwd):/data" -w /data ghcr.io/opentechil/markitdown-for-ai:latest document.docx
  ```

- **Reading PDF files**: "Convert PDF to markdown", "extract PDF content"
  ```bash
  docker run --rm -i ghcr.io/opentechil/markitdown-for-ai:latest < report.pdf

  # Or with Podman:
  podman run --rm -i ghcr.io/opentechil/markitdown-for-ai:latest < report.pdf
  ```

- **Processing PowerPoint**: "Extract slides from pptx", "convert presentation"
  ```bash
  docker run --rm -v "$(pwd):/data" -w /data ghcr.io/opentechil/markitdown-for-ai:latest slides.pptx

  # Or with Podman:
  podman run --rm -v "$(pwd):/data" -w /data ghcr.io/opentechil/markitdown-for-ai:latest slides.pptx
  ```

- **Extracting Excel data**: "Read spreadsheet", "convert xlsx to markdown"
  ```bash
  docker run --rm -i ghcr.io/opentechil/markitdown-for-ai:latest < data.xlsx

  # Or with Podman:
  podman run --rm -i ghcr.io/opentechil/markitdown-for-ai:latest < data.xlsx
  ```

- **Scraping HTML**: "Convert web page to markdown", "extract article content"
  ```bash
  docker run --rm -v "$(pwd):/data" -w /data ghcr.io/opentechil/markitdown-for-ai:latest page.html

  # Or with Podman:
  podman run --rm -v "$(pwd):/data" -w /data ghcr.io/opentechil/markitdown-for-ai:latest page.html
  ```

### AI & Automation Use Cases

- **Summarizing documents**: "Summarize this PDF/report/document" — first convert to markdown, then use the extracted content for summarization
  ```bash
  content=$(docker run --rm -i ghcr.io/opentechil/markitdown-for-ai:latest < document.pdf)

  # If Docker fails, try Podman:
  content=$(podman run --rm -i ghcr.io/opentechil/markitdown-for-ai:latest < document.pdf)

  # Then feed $content to your summarization prompt
  ```

- **Analyzing contracts/agreements**: "Extract key terms from this PDF", "read the contract"
  ```bash
  docker run --rm -i ghcr.io/opentechil/markitdown-for-ai:latest < contract.pdf

  # Or with Podman:
  podman run --rm -i ghcr.io/opentechil/markitdown-for-ai:latest < contract.pdf
  ```

- **Processing uploaded files**: When users upload documents for analysis — convert first, then reason over the markdown

- **Batch document processing**: Convert multiple files in a loop for indexing or analysis
  ```bash
  for f in *.pdf; do
    docker run --rm -i ghcr.io/opentechil/markitdown-for-ai:latest < "$f" > "${f%.pdf}.md"
    # Also try with Podman if needed:
    # podman run --rm -i ghcr.io/opentechil/markitdown-for-ai:latest < "$f" > "${f%.pdf}.md"
  done
  ```

- **RAG/embedding pipelines**: "Prepare documents for vector storage" — convert documents to markdown for chunking and embedding
  ```bash
  docker run --rm -i ghcr.io/opentechil/markitdown-for-ai:latest < document.pdf | text-embeddings-cli embed

  # Or with Podman:
  podman run --rm -i ghcr.io/opentechil/markitdown-for-ai:latest < document.pdf | text-embeddings-cli embed
  ```

### Examples

| User Request | Action |
|--------------|--------|
| "Read this PDF for me" | Convert PDF to markdown and display content |
| "What's in this Word doc?" | Convert DOCX to markdown and summarize |
| "Extract the table from this Excel file" | Convert XLSX — tables are preserved in markdown format |
| "Convert this webpage to markdown" | Convert HTML to markdown |
| "Summarize the presentation" | Convert PPTX slides to markdown |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Using `{owner}` placeholder | Use `ghcr.io/opentechil/markitdown-for-ai:latest` |
| Forgetting `-i` flag for stdin | Always add `-i` when piping |
| Mounting wrong path | Use `$(pwd)` and `-w /data` together |
| Expecting Docker to find relative paths without mount | Mount with `-v "$(pwd):/data"` |

## Docker vs Podman

This skill supports both Docker and Podman. Choose based on your environment:

### When to use Docker
- **Development workstation** - Docker Desktop on macOS/Windows
- **Production servers** - Linux systems with Docker Engine
- **Most use cases** - Full feature parity, easier setup

### When to use Podman
- **Rootless containers** - Better security and isolation
- **Linux servers without Docker** - No daemon required
- **Cloud Native environments** - Works with Kubernetes and container orchestration
- **Security compliance** - Runs without root privileges

### Choosing the right command

The examples above provide both Docker and Podman commands. The skill recommends trying Docker first — if it fails with "command not found" or other execution errors, simply use the Podman command instead.

Both Docker and Podman share the same image (`ghcr.io/opentechil/markitdown-for-ai:latest`), so the commands are identical except for `docker` vs `podman`.

### Verifying which is available

Check what container runtime is installed:

```bash
# Check for Docker
docker --version

# Check for Podman
podman --version
```

If Docker is not available, Podman can be used as a direct drop-in replacement.

### Pulling the image (one-time setup)

Since Docker and Podman share the same registry, the pull command is identical:

```bash
docker pull ghcr.io/opentechil/markitdown-for-ai:latest
podman pull ghcr.io/opentechil/markitdown-for-ai:latest
```

Pull once with your preferred runtime, and both will have access to the image locally.