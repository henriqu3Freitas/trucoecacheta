function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
}

function normalizePhone(value) {
  return String(value || "").replace(/\D+/g, "");
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function buildCustomFieldValues({ email, phone }) {
  const customFieldsValues = [];

  if (email) {
    customFieldsValues.push({
      field_code: "EMAIL",
      values: [
        {
          value: email,
          enum_code: "WORK",
        },
      ],
    });
  }

  if (phone) {
    customFieldsValues.push({
      field_code: "PHONE",
      values: [
        {
          value: phone,
          enum_code: "WORK",
        },
      ],
    });
  }

  return customFieldsValues;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { ok: false, error: "Method not allowed" });
  }

  const kommoBaseUrl =
    process.env.KOMMO_BASE_URL ||
    process.env.KOMMO_ACCOUNT_DOMAIN ||
    "https://bighit.kommo.com";
  const kommoAccessToken = process.env.KOMMO_ACCESS_TOKEN;
  const kommoPipelineId = process.env.KOMMO_PIPELINE_ID;
  const kommoStatusId = process.env.KOMMO_STATUS_ID;
  const kommoLeadName = process.env.KOMMO_LEAD_NAME || "Lead do site";

  if (!kommoBaseUrl || !kommoAccessToken) {
    return sendJson(res, 500, {
      ok: false,
      error: "Kommo is not configured.",
    });
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

  if (!name || !email || !phone) {
    return sendJson(res, 400, { ok: false, error: "Missing required lead data." });
  }

  const payload = {
    name: kommoLeadName,
    pipeline_id: kommoPipelineId ? Number(kommoPipelineId) : undefined,
    status_id: kommoStatusId ? Number(kommoStatusId) : undefined,
    _embedded: {
      contacts: [
        {
          first_name: name,
          custom_fields_values: buildCustomFieldValues({
            email,
            phone,
          }),
        },
      ],
    },
  };

  const response = await fetch(`${kommoBaseUrl.replace(/\/$/, "")}/api/v4/leads/complex`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${kommoAccessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();

  if (!response.ok) {
    return sendJson(res, response.status, {
      ok: false,
      error: responseText || "Kommo request failed.",
    });
  }

  return sendJson(res, 200, {
    ok: true,
    response: responseText ? JSON.parse(responseText) : null,
  });
};