const crypto = require("crypto");

const META_PIXEL_ID = process.env.META_PIXEL_ID || "1003040479386816";
const META_CAPI_ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const META_CAPI_VERSION = process.env.META_CAPI_VERSION || "v20.0";
const META_TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE || "TEST5368";

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
}

function normalizePhone(value) {
  return String(value || "").replace(/\D+/g, "");
}

function formatPhoneForMeta(value) {
  const digits = normalizePhone(value);

  if (!digits) {
    return "";
  }

  return digits.startsWith("55") ? digits : `55${digits}`;
}

function hashMetaValue(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function getClientIp(headers) {
  const forwardedFor = headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = headers["x-real-ip"];
  if (typeof realIp === "string" && realIp.trim()) {
    return realIp.trim();
  }

  return undefined;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { ok: false, error: "Method not allowed" });
  }

  if (!META_CAPI_ACCESS_TOKEN) {
    return sendJson(res, 500, { ok: false, error: "Meta access token is not configured." });
  }

  let body = req.body;

  if (!body || typeof body !== "object") {
    try {
      body = await new Promise((resolve, reject) => {
        let raw = "";
        req.on("data", (chunk) => {
          raw += chunk;
        });
        req.on("end", () => {
          if (!raw) {
            resolve({});
            return;
          }

          try {
            resolve(JSON.parse(raw));
          } catch (error) {
            reject(error);
          }
        });
        req.on("error", reject);
      });
    } catch (error) {
      return sendJson(res, 400, { ok: false, error: "Invalid JSON body." });
    }
  }

  const name = String(body.name || "").trim();
  const email = normalizeEmail(body.email);
  const phone = normalizePhone(body.phone);
  const eventId = String(body.eventId || "").trim();
  const testEventCode = String(body.testEventCode || META_TEST_EVENT_CODE || "").trim();
  const eventSourceUrl = String(body.pageUrl || "").trim() || req.headers.referer || "";
  const userAgent = String(body.userAgent || req.headers["user-agent"] || "").trim();

  if (!name || !email || !phone || !eventId) {
    return sendJson(res, 400, { ok: false, error: "Missing required lead data." });
  }

  const payload = {
    test_event_code: testEventCode,
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        event_source_url: eventSourceUrl,
        event_id: eventId,
        user_data: {
          em: [hashMetaValue(email)],
          ph: [hashMetaValue(formatPhoneForMeta(phone))],
          client_user_agent: userAgent,
          client_ip_address: getClientIp(req.headers),
        },
        custom_data: {
          content_name: name,
        },
      },
    ],
  };

  const response = await fetch(
    `https://graph.facebook.com/${META_CAPI_VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(META_CAPI_ACCESS_TOKEN)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  const responseText = await response.text();

  if (!response.ok) {
    return sendJson(res, response.status, {
      ok: false,
      error: responseText || "Meta CAPI request failed.",
    });
  }

  return sendJson(res, 200, {
    ok: true,
    response: responseText ? JSON.parse(responseText) : null,
  });
};
