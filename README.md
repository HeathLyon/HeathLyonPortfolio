# Heath FPV portfolio and Drone Rush

The portfolio uses `index.html`, `css/styles.css`, and `js/main.js`. Project,
service, contact, downloads, and terminal pages share the existing theme.

`drone-rush.html` launches the complete single-threaded Godot browser export in
`games/drone-rush/` only after the visitor clicks Launch game. All exported engine
files keep their original basenames. Never replace the root index or shared
script with the game export's index files.

Solo time trials include Neon Circuit, Canyon Run, and Sky Spiral. Private rooms
use the configured Render WebSocket relay at wss://drone-rush-relay.onrender.com/ws. The launcher and
standalone game automatically fill the server field. To change servers later,
edit DRONE_RUSH_RELAY_URL in the existing shared script.

Serve over HTTPS with a WebGL 2/WebAssembly-capable browser. The WASM file is
about 38 MB, so use Git/GitHub Desktop rather than GitHub's 25 MiB web uploader.

The complete delivery includes setup instructions, relay deployment files,
editable text copies, and a validation report outside the public website folder.


## Navigation and search maintenance

All ten public content pages use the same top navigation and Search dialog.
Opening Search lists every public page. Searches match titles, descriptions,
keywords, and the main content snapshot in `window.portfolioSearchIndex` inside
`js/main.js`. Homepage sections such as rates, reel, and About are indexed too.
When adding a public page or changing its content, update that index in the same
shared script; keep one entry with `kind: "page"` for each public content page.
The canvas-only game shell is reached through the Drone Rush page.

The common responsive layout is in the final "Consistent layout and navigation"
section of `css/styles.css`. Site CSS and JavaScript remain external. No extra
homepage stylesheet or script is required.

The source-only download ZIP omits large media, WASM, and PCK assets. Use the
complete website package to obtain the playable game and all media.
