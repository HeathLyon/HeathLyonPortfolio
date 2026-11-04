# Heath FPV portfolio and Drone Rush

The portfolio uses `index.html`, `css/styles.css`, and `js/main.js`. Project,
service, contact, downloads, and terminal pages share the existing theme.

`drone-rush.html` launches the complete single-threaded Godot browser export in
`games/drone-rush/` only after the visitor clicks Launch game. All exported engine
files keep their original basenames. Never replace the root index or shared
script with the game export's index files.

Solo time trials include Neon Circuit, Canyon Run, and Sky Spiral. Private rooms
require a separately deployed WebSocket relay; set DRONE_RUSH_RELAY_URL in the
shared script after deployment. No relay endpoint is configured by default.

Serve over HTTPS with a WebGL 2/WebAssembly-capable browser. The WASM file is
about 38 MB, so use Git/GitHub Desktop rather than GitHub's 25 MiB web uploader.

The complete delivery includes setup instructions, relay deployment files,
editable text copies, and a validation report outside the public website folder.
