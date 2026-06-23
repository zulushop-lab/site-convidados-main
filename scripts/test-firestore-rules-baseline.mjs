import fs from "node:fs";
import path from "node:path";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import {
  assertFails,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";

firebase.firestore.setLogLevel("silent");

const projectId = "demo-site-convidados-rules";
const rules = fs.readFileSync(path.resolve("firestore.rules"), "utf8");
const now = () => firebase.firestore.FieldValue.serverTimestamp();

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

const tests = [];
const addTest = (name, run) => tests.push({ name, run });

addTest("baseline: anonymous client cannot create completed contribution", async () => {
  const db = testEnv.unauthenticatedContext().firestore();

  await assertFails(
    db.collection("contributions").doc("baseline-completed").set({
      amount: 150,
      donorName: "Visitante",
      status: "completed",
      createdAt: now(),
    }),
  );
});

addTest("baseline: signed-in client cannot create pending contribution", async () => {
  const db = guest().firestore();

  await assertFails(
    db.collection("contributions").doc("baseline-pending").set({
      amount: 150,
      giftTitle: "Jogo de jantar",
      donorName: "Visitante",
      donorEmail: "visitante@example.com",
      paymentMethod: "mercadopago",
      status: "pending",
      createdAt: now(),
    }),
  );
});

addTest("baseline: signed-in client cannot create pending tieBid", async () => {
  const db = guest().firestore();

  await assertFails(
    db.collection("tieBids").doc("bid-pending").set({
      amount: 150,
      message: "Que venca a familia mais animada!",
      status: "pending",
      createdAt: now(),
    }),
  );
});

try {
  for (const { name, run } of tests) {
    await testEnv.clearFirestore();
    await run();
    console.log(`PASS ${name}`);
  }

  console.log("BASELINE CONFIRMED: clients cannot directly create financial records.");
} finally {
  await testEnv.cleanup();
}
