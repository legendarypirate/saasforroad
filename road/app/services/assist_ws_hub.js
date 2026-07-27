const jwt = require("jsonwebtoken");
const { WebSocketServer } = require("ws");

const secretKey = process.env.JWT_SECRET || "your_secret_key";

/**
 * In-memory WS hub for roadside assist.
 * Foreground apps receive incoming_call without push notification.
 * Background/killed apps still need FCM/APNs later.
 */
class AssistWsHub {
  constructor() {
    /** @type {Map<string, Set<import('ws').WebSocket>>} */
    this.rooms = new Map();
    this.wss = null;
  }

  key(role, id) {
    return `${role}:${id}`;
  }

  attach(server) {
    this.wss = new WebSocketServer({ server, path: "/ws/assist" });
    this.wss.on("connection", (socket, req) => {
      try {
        const url = new URL(req.url, "http://localhost");
        const token = url.searchParams.get("token");
        if (!token) {
          socket.close(4401, "token required");
          return;
        }
        const decoded = jwt.verify(token, secretKey);
        let role = null;
        let id = null;
        if (decoded.type === "road_driver") {
          role = "driver";
          id = decoded.driver_id;
        } else if (decoded.type === "service_man") {
          role = "service_man";
          id = decoded.service_man_id;
        } else {
          socket.close(4403, "invalid role");
          return;
        }

        socket.assistRole = role;
        socket.assistId = id;
        this._join(role, id, socket);

        socket.send(
          JSON.stringify({
            type: "connected",
            role,
            id,
            note: "Incoming calls work while app is open via WebSocket (no push needed).",
          })
        );

        socket.on("message", (raw) => {
          try {
            const msg = JSON.parse(String(raw));
            if (msg.type === "ping") {
              socket.send(JSON.stringify({ type: "pong" }));
            }
            if (msg.type === "location" && role === "service_man") {
              const { assistCallDispatcher } = require("./assist_call_dispatcher");
              assistCallDispatcher
                .updateServiceManLocation(id, msg.lat, msg.lng, msg.call_id)
                .catch(() => {});
            }
            if (msg.type === "presence" && role === "service_man") {
              const db = require("../models");
              db.service_men
                .update(
                  {
                    is_online: !!msg.online,
                    last_lat: msg.lat ?? undefined,
                    last_lng: msg.lng ?? undefined,
                  },
                  { where: { id } }
                )
                .catch(() => {});
            }
          } catch {
            // ignore bad frames
          }
        });

        socket.on("close", () => this._leave(role, id, socket));
      } catch {
        socket.close(4401, "unauthorized");
      }
    });
    console.log("Assist WebSocket ready at /ws/assist");
  }

  _join(role, id, socket) {
    const k = this.key(role, id);
    if (!this.rooms.has(k)) this.rooms.set(k, new Set());
    this.rooms.get(k).add(socket);
  }

  _leave(role, id, socket) {
    const k = this.key(role, id);
    const set = this.rooms.get(k);
    if (!set) return;
    set.delete(socket);
    if (!set.size) this.rooms.delete(k);
  }

  send(role, id, payload) {
    const set = this.rooms.get(this.key(role, id));
    if (!set || !set.size) return false;
    const data = JSON.stringify(payload);
    for (const s of set) {
      if (s.readyState === 1) s.send(data);
    }
    return true;
  }

  isOnline(role, id) {
    const set = this.rooms.get(this.key(role, id));
    return !!(set && set.size);
  }
}

const assistWsHub = new AssistWsHub();
module.exports = { assistWsHub };
