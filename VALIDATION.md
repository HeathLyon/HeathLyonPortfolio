# Heath FPV validation

## Checks performed

| Area | Result |
| --- | --- |
| Local links and assets | Checked 609 local references across HTML, CSS, JavaScript, structured data, and the search index. All checked paths and section anchors resolve with the original filename case. |
| Preserved files | All 29 original image, video, public download, and Godot runtime files matched the starting SHA-256 hashes. The three source panoramas and four original videos are included at their existing paths. The original `CNAME`, `.gitattributes`, and `.nojekyll` also match. |
| Page structure | All 20 public pages have one H1, consistent shared navigation, a description, canonical and Open Graph metadata, and a favicon. The search index contains all 20 pages and seven deep links. The sitemap matches the public canonicals. The game shell retains its `noindex` setting. |
| Markup and scripts | All linked local stylesheets and scripts resolve. The HTML contains no authored inline styles, scripts, or event attributes. All delivered JavaScript files passed syntax checks. |
| Responsive Chrome preview | Checked 11 pages at 375, 768, 1366, and 1920 px. No horizontal overflow was detected in the checked layouts. Pages included the homepage, services, projects, FPV Tech, hosted apps, article list, article detail, videos, game launcher, inquiry form, and terminal. |
| Homepage and navigation | Observed wheel snapping on desktop and correct alignment at the About and Featured Work anchors. The page uses the document scroller. Desktop Explore closed with Escape or an outside click. The mobile hamburger and its Explore subsection opened and closed. |
| Search and filtering | Blank search surfaced all public pages. Checked an X8 search, empty-result feedback, Escape focus restoration, and arrow-key selection from a nested article. Exercised Projects and Downloads filters. |
| Media and forms | The original hero video played at its native resolution in Chrome and returned to the photo when stopped. Checked 16:9 and 9:16 media frames. The inquiry form retains its original destination and required fields. |
| Hosted projects | The Drone Rush iframe loaded only from the launch button and used the configured relay address. Closing it removed the iframe. The terminal answered its equipment command. The 360° demo retained three scenes and the embedded layout. |
| Game assets and relay | The Godot configuration matches the exported PCK and WASM byte sizes. Headless Godot 4.6.3 loaded the actual delivered PCK, initialized all three solo courses with eight gates each, and advanced the drone in each course. All four bundled relay tests passed against a local test server. |

## Original missing asset

`images/utah-county-fpv-drone-tour.webp` was referenced by the original homepage and tour-service Open Graph tags and by two structured-data records. It was absent from the supplied source. The new references use the supplied FPV photograph or a thumbnail derived from the supplied aerial panorama. The original metadata is available in `original-source/`.

## Checks to run on your machine

The preview browser lacked WebGL support. Browser checks reached the Drone Rush recovery screen and the 360° viewer’s WebGL error message. The real 3D rendering paths need a graphics-capable browser. The local relay tests covered the bundled server, and the live Render session, YouTube playback, Formspree submission, and other browser engines remain outside the checks above.

- Open the published site or use the local HTTP command in the README. Launch Drone Rush in a WebGL 2 browser and start a solo race.
- To verify the deployed relay, start the game in two browser windows. Host a room, wait for the relay to connect, and join with the displayed code.
- Open the 360° tour. Drag the panorama, switch scenes using the scene buttons, and try a hotspot. Check the embedded view if you use it on another site.
- Before sharing a page, try its form or media link, and check any browser you use for client demos.
