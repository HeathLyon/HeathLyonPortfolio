# Heath Lyon Retro Portfolio — Downloads V5

This version uses plain HTML, CSS, and JavaScript. It does not require React,
Node.js, npm, or a build command.

## Edit

- `index.html` — snap-scroll portfolio, flight reel, linked project cards, and terminal
- `downloads.html` — filterable source, demo, and project-download library
- `Yollo.html` — presentation-only YOLO fall-detection slideshow
- `sar-project.html` — search-and-rescue payload case study
- `archaeology-project.html` — browser 3D archive case study
- `css/styles.css` — colors, layout, snap scrolling, responsive design, and effects
- `js/main.js` — terminal commands, navigation, canvas effects, and weather lookup
- `js/main.js.txt` — viewable text copy of the JavaScript
- `js/terminal-answers.js` — editable terminal question-and-answer database
- `js/terminal-answers.js.txt` — viewable text copy of the answer database
- `js/project-showcase.js` — slideshow and download-filter functionality
- `js/project-showcase.js.txt` — viewable text copy of the project JavaScript
- `downloads/` — downloadable source ZIP and editable project briefs
- `images/logo/` — portfolio images and logo files
- `video/` — the drone reel

`downloads/Heath-Portfolio-Source.zip` is a lightweight editable-source package
and omits the 25 MB MP4. The complete V5 folder ZIP includes the reel.

## YOLO project behavior

The YOLO page is intentionally a technical slideshow. It does not request a
visitor's camera and it does not try to start local Python from a webpage. The
Python source download is marked pending until the original project files are
reattached, checked for credentials, and tested as a clean public package.

## Edit terminal questions

Open `js/terminal-answers.js`. Every entry contains:

- `question` — the wording shown when visitors type `questions`
- `aliases` — alternate phrases visitors might enter
- `answer` — one or more output lines

Visitors can type a listed question directly, use `ask <question>`, or type
`questions`/`faq` to see the available list. Keep
`js/terminal-answers.js.txt` synchronized when publishing manual edits.

## Preview locally

You can double-click `index.html`. For the terminal weather command, downloads,
and the most reliable browser behavior, serve the folder with a basic local
server:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Publish

Upload the contents of this folder to GitHub Pages, Cloudflare Pages, Netlify,
or any ordinary static web host. Preserve the existing folder structure so all
CSS, JavaScript, image, and video paths continue to work.
