const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const {
  app,
  resetDatabase,
  closeDatabase,
  createUser,
} = require("./helpers/testApp");

before(async () => {
  await resetDatabase();
});

after(async () => {
  await closeDatabase();
});

// How to create one item in each kind of list
const kinds = {
  topics: (n) => ({ title: `Topic ${n}` }),
  projects: (n) => ({ name: `Project ${n}`, description: `About ${n}` }),
  tasks: (n) => ({ title: `Task ${n}` }),
};

async function createItems(user, table, count) {
  const ids = [];
  for (let n = 1; n <= count; n++) {
    const res = await request(app)
      .post(`/${table}`)
      .set(user.auth)
      .send(kinds[table](n));
    assert.equal(res.status, 201);
    ids.push(res.body.id);
  }
  return ids;
}

async function listIds(user, table) {
  const res = await request(app).get(`/${table}`).set(user.auth);
  assert.equal(res.status, 200);
  return res.body.map((item) => item.id);
}

const reorder = (user, table, ids) =>
  request(app).put(`/reorder/${table}`).set(user.auth).send({ ids });

for (const table of Object.keys(kinds)) {
  describe(`Reordering ${table}`, () => {
    let user;
    let ids;

    before(async () => {
      user = await createUser(`Orderer-${table}`);
      ids = await createItems(user, table, 4);
    });

    it("lists items in the order they were added", async () => {
      assert.deepEqual(await listIds(user, table), ids);
    });

    it("saves a new order", async () => {
      const reversed = [...ids].reverse();

      const res = await reorder(user, table, reversed);
      assert.equal(res.status, 200);
      assert.deepEqual(res.body, { ok: true });

      assert.deepEqual(await listIds(user, table), reversed);
    });

    it("saves a second reorder on top of the first", async () => {
      const shuffled = [ids[2], ids[0], ids[3], ids[1]];

      await reorder(user, table, shuffled);

      assert.deepEqual(await listIds(user, table), shuffled);
    });

    it("puts a newly added item at the end", async () => {
      const before = await listIds(user, table);

      const res = await request(app)
        .post(`/${table}`)
        .set(user.auth)
        .send(kinds[table](5));
      assert.equal(res.status, 201);

      assert.deepEqual(await listIds(user, table), [...before, res.body.id]);
    });
  });
}

describe("Reorder safety", () => {
  it("cannot move another user's items", async () => {
    const alice = await createUser("Alice");
    const bob = await createUser("Bob");

    const [aliceTopic] = await createItems(alice, "topics", 1);
    const [bobFirst, bobSecond] = await createItems(bob, "topics", 2);

    // Alice sends a list that includes Bob's topics
    const res = await reorder(alice, "topics", [bobSecond, bobFirst, aliceTopic]);
    assert.equal(res.status, 200);

    // Bob's order must not have changed
    assert.deepEqual(await listIds(bob, "topics"), [bobFirst, bobSecond]);
  });

  it("rejects lists that are not a list of unique whole numbers", async () => {
    const user = await createUser("Picky");

    const bad = [
      undefined,
      null,
      "1,2,3",
      {},
      [],
      ["a"],
      ["1"],
      [1.5],
      [null],
      [1, 1],
      Array.from({ length: 1001 }, (_, i) => i + 1),
    ];

    for (const ids of bad) {
      const res = await reorder(user, "topics", ids);
      assert.equal(res.status, 400);
      assert.equal(res.body.error, "ids must be a list of unique numbers");
    }
  });

  it("only knows topics, projects, and tasks", async () => {
    const user = await createUser("Curious");

    // None of these may reach the database, including an attempt to use the
    // table name to sneak in SQL
    for (const table of ["users", "passwords", "TOPICS", "topics;drop"]) {
      const res = await reorder(user, table, [1]);
      assert.equal(res.status, 404, table);
      assert.equal(res.body.error, "Unknown list");
    }
  });
});