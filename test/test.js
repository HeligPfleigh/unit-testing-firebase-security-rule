const assert = require("assert");
const firebase = require("@firebase/testing");

const PROJECT_ID = "my-social-app-23424";
const myId = "user_abc";
const theirId = "user_xyz";
const MY_AUTH = { uid: myId, email: "test@gmail.com" }

const getFirestore = (auth) => firebase.initializeTestApp({ projectId: PROJECT_ID, auth }).firestore();

const getFirestoreAdmin = () => firebase.initializeAdminApp({ projectId: PROJECT_ID }).firestore();

beforeEach(async () => {
  await firebase.clearFirestoreData({ projectId: PROJECT_ID })
})

describe("My social app", () => {

  it("can read items in the read-only collection", async () => {
    const db = getFirestore();
    const testDoc = db.collection("readonly").doc("testDoc");
    await firebase.assertSucceeds(testDoc.get());
  })

  it("can't write items to the read-only collection", async () => {
    const db = getFirestore();
    const testDoc = db.collection("readonly").doc("testDoc");
    await firebase.assertFails(testDoc.set({ foo: 'bar' }));
  })

  it("can write to a user document with the same Id as our user", async () => {
    const db = getFirestore(MY_AUTH);
    const testDoc = db.collection("users").doc(myId);
    await firebase.assertSucceeds(testDoc.set({ foo: 'bar' }))
  })

  it("can't write to a user document with a differrent id with our user", async () => {
    const db = getFirestore(MY_AUTH);
    const testDoc = db.collection("users").doc(theirId);
    await firebase.assertFails(testDoc.set({ foo: 'bar' }));
  })

  it("can read public posts", async () => {
    const admin = getFirestoreAdmin();
    const postId = "public_post";
    const testDoc = admin.collection("posts").doc(postId);
    await testDoc.set({ authorId: theirId, visibility: "public" });

    const db = getFirestore();
    const otherTestDoc = db.collection("posts").doc(postId);
    await firebase.assertSucceeds(otherTestDoc.get());
  })

  it("can read private post of the same user id", async () => {
    const admin = getFirestoreAdmin();
    const postId = "private_post";
    const setupDoc = admin.collection("posts").doc(postId);
    await setupDoc.set({ authorId: myId, visibility: 'private' });

    const db = getFirestore(MY_AUTH);
    const readDoc = db.collection("posts").doc(postId);
    await firebase.assertSucceeds(readDoc.get());
  })

  it("can't read private post of other user", async () => {
    const admin = getFirestoreAdmin();
    const postId = "private_post";
    const setupDoc = admin.collection("posts").doc(postId);
    await setupDoc.set({ authorId: theirId, visibility: 'private' });

    const db = getFirestore(MY_AUTH);
    const readDoc = db.collection("posts").doc(postId);
    await firebase.assertFails(readDoc.get());
  })
})

after(async () => {
  await firebase.clearFirestoreData({ projectId: PROJECT_ID })
})