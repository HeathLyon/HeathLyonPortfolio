# Heath FPV website

Open `website/index.html` after extracting the ZIP. It is a static portfolio built with HTML, CSS, and vanilla JavaScript. The homepage, menus, search, project filters, articles, and local video files work from the extracted folder.

## Run locally

The portfolio opens directly in your browser. Keep the extracted folders together so the relative image, stylesheet, script, and link paths resolve.

Serve `website/` over HTTP to test the Drone Rush game and 360° viewer. From the folder containing this README, use one of these commands.

**Windows**

```powershell
py -m http.server 8000 --directory website
```

**macOS or Linux**

```bash
python3 -m http.server 8000 --directory website
```

Then visit [http://localhost:8000/](http://localhost:8000/). Drone Rush needs WebGL 2 and WebAssembly. The original 360° viewer uses Pannellum from jsDelivr and needs a WebGL-capable browser. Internet access is needed for the hosted fonts, YouTube and Instagram links, the contact form, and online multiplayer. [Godot web export requirements](https://docs.godotengine.org/en/4.5/tutorials/export/exporting_for_web.html)

## Deploy to GitHub Pages

1. Open your existing Heath FPV repository in GitHub Desktop or Git. In **Settings → Pages**, check your publishing branch and folder.
2. Copy the **contents of `website/`** into that publishing folder. Keep `index.html`, `CNAME`, and `.nojekyll` at the top of the deployed folder, with `css/`, `js/`, `images/`, `video/`, and `games/` beside them.
3. Commit and push from GitHub Desktop or Git. Several of the videos and the Godot WASM file exceed GitHub’s 25 MiB browser upload limit. The largest publish file is about 53 MiB. [GitHub file size limits](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github)
4. After Pages deploys, open the custom domain and try a deep link, such as `/360.html` or `/drone-rush.html`. The existing `CNAME` points to `www.heathfpv.com`, which the canonical URLs and sitemap use. Keep your existing Pages and DNS configuration. [GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) · [GitHub Pages custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)

The public site is the `website/` folder. The template, validation report, original source snapshot, and editable Godot and relay projects sit beside it for local use.

## Where to edit

| Change | File or folder |
| --- | --- |
| Homepage copy, section order, and featured links | `website/index.html` |
| Drone packages, starting prices, and booking terms | `website/services.html`, section `id="rates"` |
| Project cards and categories | `website/projects.html` |
| Build specs, electronics, and research notes | `website/fpv-tech.html` |
| Hosted applications and launch links | `website/hosting.html` |
| Article list and article pages | `website/articles.html` and `website/articles/` |
| Video previews, source paths, and reel links | `website/videos.html` |
| Contact links and inquiry form | `website/contact.html`, the homepage contact section, and `website/contact-form.html` |
| Color, typography, spacing, navigation, and snap scroll | `website/css/styles.css`. Search for **PORTFOLIO THEME** or **HOMEPAGE SNAP SCROLL AND HERO**. |
| Shared interactions and searchable pages | `website/js/main.js`. Search for **SITE SEARCH INDEX**. |
| Browser tab icon | `website/favicon.png`. This PNG uses the existing Heath FPV logo. |

Page headers use the same HTML rather than loading a menu through a request. If you change the site links, copy the updated `masthead` to the public pages. Links from files in `articles/` start with `../`. The original markup and assets keep their filenames so existing bookmarks and project links resolve.

## Add a project

1. Copy an `article.portfolio-card` in `website/projects.html`. Change the title, description, thumbnail, alternative text, and destination. Give the card a space-separated `data-categories` value such as `engineering research`.
2. For a hosted app, copy a card in `website/hosting.html` and link to its launcher. Keep its internal files together in their existing folders.
3. For a new standalone project page, add one entry in the **SITE SEARCH INDEX** in `website/js/main.js`. Use a site-root path such as `my-project.html` with no leading slash. Add its full canonical URL to `website/sitemap.xml`.

## Publish an article

1. Copy `templates/article-template.html` to `website/articles/your-article.html`.
2. Edit the title, description, canonical URL, Open Graph URL and image, category, date, featured image, body, and related links. Page links and images can use `../` to reach the website root. Leave the files in `articles/` so the shared links resolve.
3. Copy a card in `website/articles.html`, point it to the new page, and put it above the older entries. Add its path, description, and keywords to the shared search index, then add its canonical URL to the sitemap.
4. Open the article and test its links and search result. Update the **Latest content** section of `website/index.html` if you want to feature it.

The included articles are starter write-ups based on the supplied tour and YOLO project material. Their dates reflect this package.

## Add a video or reel

1. Put your video in `website/video/` and its preview image in `website/images/previews/`. Keep the filename and case the same in the HTML and on disk.
2. Copy a `media-entry` in `website/videos.html`. Use a native video with `controls`, `playsinline`, and `preload="none"` for a local file. Set its poster and source. Add the `portrait` class to the video or preview link for a 9:16 frame.
3. For YouTube or Instagram, link the thumbnail to the individual video or reel. Include a related article or project link if you have one.

## Maintain Drone Rush and the 360° tour

Drone Rush loads its iframe only after the visitor selects **Launch game**. The existing browser export lives at `website/games/drone-rush/`. The game downloads about 38 MB on first launch. Its default relay is `wss://drone-rush-relay.onrender.com/ws`. The export wakes that relay while it loads, and solo play does not depend on the relay. If you move the server, update `DRONE_RUSH_RELAY_URL` in `website/js/main.js` and the fallback own-tab link in `website/drone-rush.html`. A new multiplayer origin must be included in the relay’s `ALLOWED_ORIGINS`.

The editable game and Python relay are included beside `website/`. Re-export the Godot project with **Thread Support** disabled, preserve the `index` basename, and use the included helper to update the binaries and file sizes. Run this from the package root.

```text
python tools/update_game_export.py PATH_TO_GODOT_WEB_EXPORT website
```

The 360° demo keeps the original viewer, three panoramas, and `360.html?embed=1` view. Edit scene paths and hotspots in `website/js/360-demo.js`.

## Original source and verification

`original-source/` contains the starting HTML, CSS, site scripts, configuration, and supplied notes. The unchanged large media and Godot runtime files remain at their original paths in `website/`.

See `VALIDATION.md` for the checks performed, the original missing social-preview path, and the remaining browser checks.
