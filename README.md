# CommentClear 🧹

> Strip code comments instantly — free, open source, no install required.

A fast, browser-based tool to remove comments from source code. Paste your code, choose (or auto-detect) your language, and get clean output in one click.

**[🚀 Live Demo →](https://Nilesh1729-cse.github.io/commentclear)**

---

## Features

- ✅ **Auto language detection** — paste and go
- ✅ **10+ languages supported** — JS, Python, C/C++, Java, C#, CSS, HTML, Ruby, PHP, Go, Swift, Rust, Bash
- ✅ **Line & block comments** both removed
- ✅ **Toggle options** — keep blank lines, trim whitespace
- ✅ **Stats** — shows how many comments removed, lines saved, chars stripped
- ✅ **Copy & Download** output with one click
- ✅ **Clean Code Quiz** — test your knowledge
- ✅ Zero dependencies, pure HTML/CSS/JS
- ✅ Fully responsive

---

## Supported Languages

| Language | Line Comments | Block Comments |
|---|---|---|
| JavaScript / TypeScript | `//` `///` | `/* */` |
| Python | `#` | `''' '''` `""" """` |
| C / C++ | `//` | `/* */` |
| Java | `//` | `/* */` |
| C# | `//` `///` | `/* */` |
| CSS / SCSS | — | `/* */` |
| HTML | — | `<!-- -->` |
| Ruby | `#` | `=begin =end` |
| PHP | `//` `#` | `/* */` |
| Go | `//` | `/* */` |
| Swift | `//` `///` | `/* */` |
| Rust | `//` `///` `//!` | `/* */` |
| Bash / Shell | `#` | — |

---

## Usage

### Run Locally

No build step required! Just open the file:

```bash
git clone https://github.com/YOUR_USERNAME/commentclear.git
cd commentclear
open index.html   # macOS
# or
xdg-open index.html   # Linux
# or just double-click index.html in Windows Explorer
```

### Deploy to GitHub Pages

1. Push to GitHub (instructions below)
2. Go to **Settings → Pages → Source: Deploy from branch → main / root**
3. Your site will be live at `https://YOUR_USERNAME.github.io/commentclear`

---

## Push to GitHub

```bash
# 1. Create a new repo on github.com, then:
git init
git add .
git commit -m "initial commit: CommentClear"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/commentclear.git
git push -u origin main
```

---

## Project Structure

```
commentclear/
├── index.html   # Main app & markup
├── style.css    # All styles (dark theme, responsive)
├── app.js       # Comment removal engine + UI logic + quiz
└── README.md
```

---

