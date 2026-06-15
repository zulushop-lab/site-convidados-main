import fs from "node:fs";
import path from "node:path";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";

firebase.firestore.setLogLevel("silent");

const projectId = "demo-site-convidados-rules";
const rules = fs.readFileSync(path.resolve("firestore.rules"), "utf8");
const now = () => firebase.firestore.FieldValue.serverTimestamp();
const timestamp = () => firebase.firestore.Timestamp.fromDate(new Date("2026-06-15T12:00:00.000Z"));

const testEnv = await initializeTestEnvironment({
  projectId,
  firestore: {
    rules,
  },
});

const guest = () =>
  testEnv.authenticatedContext("guest-user", {
    provider_id: "anonymous",
    firebase: { sign_in_provider: "anonymous" },
  });

const admin = () =>
  testEnv.authenticatedContext("admin-user", {
    email: "matheusrs180@gmail.com",
    email_verified: true,
  });

const contribution = (overrides = {}) => ({
  amount: 150,
  giftTitle: "Jogo de jantar",
  donorName: "Visitante",
  donorEmail: "visitante@example.com",
  paymentMethod: "pix",
  status: "pending",
  createdAt: now(),
  ...overrides,
});

const rsvp = (overrides = {}) => ({
  adults: ["Matheus", "Isadora"],
  childrenCount: 0,
  dietary: "",
  message: "",
  createdAt: now(),
  ...overrides,
});

const tests = [];
const addTest = (name, run) => tests.push({ name, run });

addTest("hardened: valid pending contribution succeeds for signed-in guest", async () => {
  const db = guest().firestore();

  await assertSucceeds(
    db.collection("contributions").doc("valid-pending").set(contribution()),
  );
});

for (const status of ["completed", "processing", "failed"]) {
  addTest(`hardened: client cannot create contribution status ${status}`, async () => {
    const db = guest().firestore();

    await assertFails(
      db.collection("contributions").doc(`bad-status-${status}`).set(
        contribution({ status }),
      ),
    );
  });
}

addTest("hardened: anonymous completed contribution is rejected", async () => {
  const db = testEnv.unauthenticatedContext().firestore();

  await assertFails(
    db.collection("contributions").doc("anonymous-completed").set(
      contribution({ status: "completed" }),
    ),
  );
});

addTest("hardened: contribution amount must be within range", async () => {
  const db = guest().firestore();

  await assertFails(
    db.collection("contributions").doc("amount-too-large").set(
      contribution({ amount: 100001 }),
    ),
  );

  await assertFails(
    db.collection("contributions").doc("amount-zero").set(
      contribution({ amount: 0 }),
    ),
  );
});

addTest("hardened: contribution requires donorEmail", async () => {
  const db = guest().firestore();
  const payload = contribution();
  delete payload.donorEmail;

  await assertFails(
    db.collection("contributions").doc("missing-email").set(payload),
  );
});

addTest("hardened: contribution rejects extra fields", async () => {
  const db = guest().firestore();

  await assertFails(
    db.collection("contributions").doc("extra-field").set(
      contribution({ injectedField: "must-fail" }),
    ),
  );
});

addTest("hardened: only admin can perform valid contribution status update", async () => {
  const guestDb = guest().firestore();
  const adminDb = admin().firestore();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    await context.firestore().collection("contributions").doc("update-target").set({
      amount: 150,
      giftTitle: "Jogo de jantar",
      donorName: "Visitante",
      donorEmail: "visitante@example.com",
      paymentMethod: "pix",
      status: "pending",
      createdAt: timestamp(),
    });
  });

  await assertFails(
    guestDb.collection("contributions").doc("update-target").update({
      status: "completed",
      updatedAt: now(),
    }),
  );

  await assertSucceeds(
    adminDb.collection("contributions").doc("update-target").update({
      status: "processing",
      updatedAt: now(),
    }),
  );
});

addTest("hardened: terminal contribution status cannot transition backward", async () => {
  const adminDb = admin().firestore();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    await context.firestore().collection("contributions").doc("terminal-status").set({
      amount: 150,
      giftTitle: "Jogo de jantar",
      donorName: "Visitante",
      donorEmail: "visitante@example.com",
      paymentMethod: "pix",
      status: "completed",
      createdAt: timestamp(),
      updatedAt: timestamp(),
    });
  });

  await assertFails(
    adminDb.collection("contributions").doc("terminal-status").update({
      status: "pending",
      updatedAt: now(),
    }),
  );
});

addTest("hardened: valid RSVP with optional identity fields succeeds", async () => {
  const db = guest().firestore();

  await assertSucceeds(
    db.collection("rsvps").doc("valid-rsvp").set(
      rsvp({
        familyId: "family-1",
        guestId: "guest-1",
        confirmedBy: "guest-1",
        updatedBy: "guest-1",
        updatedAt: now(),
      }),
    ),
  );
});

addTest("hardened: RSVP rejects extra fields", async () => {
  const db = guest().firestore();

  await assertFails(
    db.collection("rsvps").doc("extra-rsvp").set(
      rsvp({ injectedField: "must-fail" }),
    ),
  );
});

addTest("hardened: RSVP caps adults and text fields", async () => {
  const db = guest().firestore();

  await assertFails(
    db.collection("rsvps").doc("too-many-adults").set(
      rsvp({ adults: Array.from({ length: 21 }, (_, index) => `Guest ${index}`) }),
    ),
  );

  await assertFails(
    db.collection("rsvps").doc("long-dietary").set(
      rsvp({ dietary: "x".repeat(1001) }),
    ),
  );

  await assertFails(
    db.collection("rsvps").doc("long-message").set(
      rsvp({ message: "x".repeat(1001) }),
    ),
  );
});

try {
  for (const { name, run } of tests) {
    await testEnv.clearFirestore();
    await run();
    console.log(`PASS ${name}`);
  }

  console.log("HARDENED RULES CONFIRMED: target Firestore security assertions pass.");
} finally {
  await testEnv.cleanup();
}
