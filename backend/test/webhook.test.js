const test = require("node:test");
const assert = require("node:assert/strict");
const { Webhook } = require("svix");

test("Clerk Webhook Signature Verification and Svix Payload Parsing", () => {
  const secret = "whsec_Ir2P2INNW2Hxd8GvBevvlF8k6rCZiXkb";
  const wh = new Webhook(secret);

  const eventPayload = {
    type: "user.updated",
    data: {
      id: "user_test_456",
      first_name: "Jane",
      last_name: "Doe",
      image_url: "https://example.com/jane.png",
      email_addresses: [{ id: "em_1", email_address: "jane@example.com" }],
      primary_email_address_id: "em_1",
    },
  };

  const rawString = JSON.stringify(eventPayload);
  const rawBuffer = Buffer.from(rawString, "utf8");
  const timestamp = new Date();
  const svixId = "msg_test_verified_999";
  const signature = wh.sign(svixId, timestamp, rawBuffer);

  // 1. Valid signature passes verification and parses accurately
  assert.doesNotThrow(() => {
    wh.verify(rawBuffer, {
      "svix-id": svixId,
      "svix-timestamp": Math.floor(timestamp.getTime() / 1000).toString(),
      "svix-signature": signature,
    });
  });

  const parsed = JSON.parse(rawBuffer.toString("utf8"));
  assert.equal(parsed.type, "user.updated");
  assert.equal(parsed.data.id, "user_test_456");
  assert.equal(parsed.data.first_name, "Jane");

  // 2. Tampered signature is strictly rejected with an error
  assert.throws(() => {
    wh.verify(rawBuffer, {
      "svix-id": svixId,
      "svix-timestamp": Math.floor(timestamp.getTime() / 1000).toString(),
      "svix-signature": "v1,invalid_signature_tampered_attempt",
    });
  });
});

