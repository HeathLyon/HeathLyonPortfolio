"""Launch with: python -m unittest test_server.py -v"""
import asyncio
import unittest
from aiohttp import ClientSession, web
from server import make_app, ROOMS


class RaceServerTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        ROOMS.clear()
        self.runner = web.AppRunner(make_app())
        await self.runner.setup()
        self.site = web.TCPSite(self.runner, "127.0.0.1", 0)
        await self.site.start()
        self.port = self.site._server.sockets[0].getsockname()[1]
        self.session = ClientSession()
        self.sockets = []

    async def asyncTearDown(self):
        for ws in self.sockets:
            await ws.close()
        await self.session.close()
        await self.runner.cleanup()
        ROOMS.clear()

    async def client(self):
        ws = await self.session.ws_connect(f"http://127.0.0.1:{self.port}/ws")
        self.sockets.append(ws)
        return ws

    async def recv_type(self, ws, kind):
        for _ in range(55):
            result = await asyncio.wait_for(ws.receive_json(), 6)
            if result["type"] == kind:
                return result
        self.fail(f"Expected {kind}")

    async def test_create_join_start_gate_order_results_reset(self):
        a = await self.client()
        b = await self.client()
        await a.send_json({"type": "create", "name": "Alice", "track": 2})
        own = await self.recv_type(a, "joined")
        room = await self.recv_type(a, "room")
        code = room["code"]
        self.assertEqual(len(code), 6)
        self.assertEqual(room["track"], 2)
        await b.send_json({"type": "join", "code": code.lower(), "name": "Bob"})
        guest = await self.recv_type(b, "joined")
        room = await self.recv_type(a, "room")
        self.assertEqual(len(room["players"]), 2)
        await b.send_json({"type": "start"})
        self.assertIn("Only the host", (await self.recv_type(b, "error"))["message"])
        await a.send_json({"type": "start"})
        await self.recv_type(a, "countdown")
        await self.recv_type(b, "countdown")
        # Test transition without waiting 3.5 seconds using same scheduled timer.
        ROOMS[code].phase = "racing"
        await a.send_json({"type": "gate", "passed": 16})  # skip rejected
        await asyncio.sleep(.05)
        self.assertEqual(ROOMS[code].pilots[own["player_id"]].passed, 0)
        for n in range(1, 17):
            await a.send_json({"type": "gate", "passed": n})
            await b.send_json({"type": "gate", "passed": n})
        await self.recv_type(a, "race_over")
        await self.recv_type(b, "race_over")
        self.assertEqual(ROOMS[code].phase, "results")
        await a.send_json({"type": "reset"})
        room = await self.recv_type(a, "room")
        self.assertEqual(room["phase"], "lobby")
        self.assertEqual(room["players"][0]["passed"], 0)

    async def test_live_countdown_position_relay_and_track_change(self):
        a = await self.client()
        b = await self.client()
        await a.send_json({"type": "create", "name": "Alpha", "track": 0})
        own = await self.recv_type(a, "joined")
        room = await self.recv_type(a, "room")
        await b.send_json({"type": "join", "code": room["code"], "name": "Beta"})
        await self.recv_type(b, "joined")
        await self.recv_type(b, "room")
        await a.send_json({"type": "set_track", "track": 1})
        self.assertEqual((await self.recv_type(b, "room"))["track"], 1)
        await a.send_json({"type": "start"})
        await self.recv_type(a, "countdown")
        await self.recv_type(b, "countdown")
        await self.recv_type(a, "go")
        await self.recv_type(b, "go")
        await a.send_json({"type": "state", "p": [1.0, 6.0, -21.0], "yaw": 0.7})
        got = await self.recv_type(b, "state")
        self.assertEqual(got["id"], own["player_id"])
        self.assertEqual(got["p"], [1.0, 6.0, -21.0])
        third = await self.client()
        await third.send_json({"type": "join", "code": room["code"], "name": "Late"})
        self.assertIn("already started", (await self.recv_type(third, "error"))["message"])

    async def test_reject_missing_code_and_transfer_host(self):
        a = await self.client()
        b = await self.client()
        await b.send_json({"type": "join", "code": "XXXXXX"})
        self.assertIn("Room not found", (await self.recv_type(b, "error"))["message"])
        await a.send_json({"type": "create", "name": "One"})
        await self.recv_type(a, "joined")
        room = await self.recv_type(a, "room")
        await b.send_json({"type": "join", "code": room["code"], "name": "Two"})
        guest = await self.recv_type(b, "joined")
        await self.recv_type(b, "room")
        await a.close()
        room = await self.recv_type(b, "room")
        self.assertEqual(room["host_id"], guest["player_id"])

    async def test_health(self):
        async with self.session.get(f"http://127.0.0.1:{self.port}/health") as resp:
            self.assertEqual(resp.status, 200)
            self.assertEqual((await resp.json())["status"], "ok")


if __name__ == "__main__":
    unittest.main()
