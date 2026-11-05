"""DRONE // RUSH browser-compatible WebSocket lobby and race server.

Protocol: JSON messages; all gameplay connections use /ws.
The server owns room membership, start time, ordered checkpoint progress and results.
Movement is client-authoritative (casual MVP), validated for size/range/rate.
"""
import asyncio
import json
import logging
import os
import secrets
import time
from dataclasses import dataclass, field
from typing import Optional

from aiohttp import WSMsgType, web

LOG = logging.getLogger("drone_rush")
ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no O/0 or I/1
MAX_PLAYERS = 6
MAX_ROOMS = 120
NUM_GATES = 8
LAPS = 2
RACE_TIMEOUT = 8 * 60
CODE_LENGTH = 6


def now_ms() -> int:
    return int(time.time() * 1000)


def safe_name(value) -> str:
    if not isinstance(value, str):
        return "Pilot"
    clean = "".join(c for c in value.strip() if c.isprintable() and c not in "<>\\\n\r\t")
    return clean[:18] or "Pilot"


def make_code(existing: dict) -> str:
    for _ in range(200):
        value = "".join(secrets.choice(ALPHABET) for _ in range(CODE_LENGTH))
        if value not in existing:
            return value
    raise RuntimeError("room codes exhausted")


@dataclass
class Pilot:
    id: str
    name: str
    ws: web.WebSocketResponse
    passed: int = 0
    finished_ms: Optional[int] = None
    last_state: float = 0.0
    last_message: float = 0.0
    message_count: int = 0


@dataclass
class Room:
    code: str
    track: int
    host_id: str
    pilots: dict[str, Pilot] = field(default_factory=dict)
    phase: str = "lobby"  # lobby | countdown | racing | results
    start_at_ms: int = 0
    timer: Optional[asyncio.Task] = None
    created_at: float = field(default_factory=time.monotonic)


ROOMS: dict[str, Room] = {}


def public_pilot(p: Pilot) -> dict:
    return {"id": p.id, "name": p.name, "passed": p.passed, "finished_ms": p.finished_ms}


def room_packet(room: Room) -> dict:
    return {
        "type": "room", "code": room.code, "track": room.track,
        "host_id": room.host_id, "phase": room.phase,
        "players": [public_pilot(p) for p in room.pilots.values()],
    }


async def send(ws: web.WebSocketResponse, message: dict) -> None:
    if not ws.closed:
        try:
            await ws.send_json(message)
        except (ConnectionResetError, RuntimeError):
            pass


async def broadcast(room: Room, message: dict, exclude: str = "") -> None:
    await asyncio.gather(*(
        send(p.ws, message) for p in list(room.pilots.values()) if p.id != exclude
    ))


async def error(ws: web.WebSocketResponse, detail: str) -> None:
    await send(ws, {"type": "error", "message": detail})


def results(room: Room) -> list[dict]:
    pilots = sorted(room.pilots.values(), key=lambda p: (
        p.finished_ms is None,
        p.finished_ms if p.finished_ms is not None else -p.passed,
    ))
    return [public_pilot(p) for p in pilots]


async def finish_if_done(room: Room) -> None:
    if room.phase == "racing" and all(p.finished_ms is not None for p in room.pilots.values()):
        room.phase = "results"
        if room.timer:
            room.timer.cancel()
            room.timer = None
        await broadcast(room, {"type": "race_over", "results": results(room)})


async def start_race_after_delay(room: Room) -> None:
    try:
        await asyncio.sleep(max(0, (room.start_at_ms - now_ms()) / 1000))
        if ROOMS.get(room.code) is not room or room.phase != "countdown":
            return
        room.phase = "racing"
        await broadcast(room, {"type": "go", "server_now_ms": now_ms()})
        await asyncio.sleep(RACE_TIMEOUT)
        if ROOMS.get(room.code) is room and room.phase == "racing":
            room.phase = "results"
            await broadcast(room, {"type": "race_over", "results": results(room), "timeout": True})
    except asyncio.CancelledError:
        return


async def handle_message(ws: web.WebSocketResponse, pilot: Optional[Pilot], room: Optional[Room], msg: dict):
    """Return updated (pilot, room) for the socket's session."""
    typ = msg.get("type")
    if pilot is None:
        if typ == "create":
            if len(ROOMS) >= MAX_ROOMS:
                await error(ws, "Server is full; try again shortly")
                return pilot, room
            track = msg.get("track", 0)
            if type(track) is not int or track not in (0, 1, 2):
                await error(ws, "Invalid track")
                return pilot, room
            pilot = Pilot(secrets.token_hex(5), safe_name(msg.get("name")), ws)
            code = make_code(ROOMS)
            room = Room(code, track, pilot.id)
            room.pilots[pilot.id] = pilot
            ROOMS[code] = room
            await send(ws, {"type": "joined", "player_id": pilot.id})
            await broadcast(room, room_packet(room))
            return pilot, room
        if typ == "join":
            code = str(msg.get("code", "")).upper().strip()
            target = ROOMS.get(code)
            if target is None:
                await error(ws, "Room not found; check the code")
                return pilot, room
            if target.phase != "lobby":
                await error(ws, "Race already started; join a new lobby")
                return pilot, room
            if len(target.pilots) >= MAX_PLAYERS:
                await error(ws, "Room is full (6 players max)")
                return pilot, room
            pilot = Pilot(secrets.token_hex(5), safe_name(msg.get("name")), ws)
            room = target
            room.pilots[pilot.id] = pilot
            await send(ws, {"type": "joined", "player_id": pilot.id})
            await broadcast(room, room_packet(room))
            return pilot, room
        await error(ws, "Create or join a room first")
        return pilot, room

    if room is None or ROOMS.get(room.code) is not room:
        await error(ws, "Room no longer exists")
        return pilot, room

    if typ == "set_track":
        track = msg.get("track")
        if pilot.id == room.host_id and room.phase == "lobby" and type(track) is int and track in (0, 1, 2):
            room.track = track
            await broadcast(room, room_packet(room))
        return pilot, room

    if typ == "start":
        if pilot.id != room.host_id:
            await error(ws, "Only the host can start the race")
        elif room.phase != "lobby":
            await error(ws, "Race is not in the lobby")
        elif len(room.pilots) < 2:
            await error(ws, "Two pilots required to race online")
        else:
            for p in room.pilots.values():
                p.passed = 0
                p.finished_ms = None
            room.phase = "countdown"
            room.start_at_ms = now_ms() + 3500
            await broadcast(room, {
                "type": "countdown", "track": room.track, "server_now_ms": now_ms(),
                "start_at_ms": room.start_at_ms,
            })
            room.timer = asyncio.create_task(start_race_after_delay(room))
        return pilot, room

    if typ == "state" and room.phase == "racing" and pilot.finished_ms is None:
        # Limit relay traffic per client to ~20 Hz; no prediction/security claims.
        t = time.monotonic()
        if t - pilot.last_state < 0.048:
            return pilot, room
        p = msg.get("p", [])
        yaw = msg.get("yaw", 0.0)
        if (isinstance(p, list) and len(p) == 3
                and all(type(v) in (float, int) and -1000.0 < v < 1000.0 for v in p)
                and type(yaw) in (float, int) and -100000 < yaw < 100000):
            pilot.last_state = t
            await broadcast(room, {"type": "state", "id": pilot.id, "p": p, "yaw": yaw}, exclude=pilot.id)
        return pilot, room

    if typ == "gate" and room.phase == "racing" and pilot.finished_ms is None:
        # Server enforces sequence, but does not simulate flight physics.
        gate_number = msg.get("passed")
        if type(gate_number) is int and gate_number == pilot.passed + 1 and gate_number <= NUM_GATES * LAPS:
            pilot.passed = gate_number
            if pilot.passed == NUM_GATES * LAPS:
                pilot.finished_ms = max(0, now_ms() - room.start_at_ms)
            await broadcast(room, {
                "type": "progress", "id": pilot.id,
                "passed": pilot.passed, "finished_ms": pilot.finished_ms,
            })
            await finish_if_done(room)
        return pilot, room

    if typ == "reset":
        if pilot.id != room.host_id:
            await error(ws, "Only the host can return to lobby")
        elif room.phase != "results":
            await error(ws, "Race must finish before restarting")
        else:
            room.phase = "lobby"
            room.start_at_ms = 0
            for p in room.pilots.values():
                p.passed = 0
                p.finished_ms = None
            await broadcast(room, room_packet(room))
        return pilot, room

    if typ not in ("state", "gate"):
        await error(ws, "Unsupported action in this race state")
    return pilot, room


async def disconnect(pilot: Optional[Pilot], room: Optional[Room]) -> None:
    if pilot is None or room is None:
        return
    room.pilots.pop(pilot.id, None)
    if not room.pilots:
        if room.timer:
            room.timer.cancel()
        ROOMS.pop(room.code, None)
        return
    if pilot.id == room.host_id:
        room.host_id = next(iter(room.pilots))
    await broadcast(room, {"type": "left", "id": pilot.id})
    await broadcast(room, room_packet(room))
    await finish_if_done(room)


async def websocket_endpoint(request: web.Request) -> web.StreamResponse:
    allowed = os.environ.get("ALLOWED_ORIGINS", "*").strip()
    origin = request.headers.get("Origin")
    if allowed != "*" and origin and origin not in {part.strip() for part in allowed.split(",")}:
        raise web.HTTPForbidden(text="Origin not permitted")
    ws = web.WebSocketResponse(max_msg_size=4096, heartbeat=25, compress=False)
    await ws.prepare(request)
    pilot: Optional[Pilot] = None
    room: Optional[Room] = None
    try:
        async for message in ws:
            if message.type == WSMsgType.TEXT:
                try:
                    payload = json.loads(message.data)
                    if not isinstance(payload, dict):
                        raise ValueError()
                except (json.JSONDecodeError, ValueError):
                    await error(ws, "Malformed JSON")
                    continue
                t = time.monotonic()
                if pilot:
                    if t - pilot.last_message > 1:
                        pilot.last_message = t
                        pilot.message_count = 0
                    pilot.message_count += 1
                    if pilot.message_count > 60:
                        await error(ws, "Too many messages")
                        break
                pilot, room = await handle_message(ws, pilot, room, payload)
            elif message.type == WSMsgType.ERROR:
                break
    except (ConnectionResetError, asyncio.CancelledError):
        pass
    finally:
        await disconnect(pilot, room)
    return ws


async def health(_request: web.Request) -> web.Response:
    return web.json_response({"status": "ok", "rooms": len(ROOMS)})


def make_app() -> web.Application:
    app = web.Application(client_max_size=8192)
    app.router.add_get("/health", health)
    app.router.add_get("/ws", websocket_endpoint)
    return app


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    port = int(os.environ.get("PORT", "8765"))
    web.run_app(make_app(), host="0.0.0.0", port=port)
