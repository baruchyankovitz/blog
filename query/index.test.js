const request = require("supertest");
let axios;

jest.mock("axios");

let app;
let syncEvents;

const postCreated = { type: "PostCreated", data: { id: "p1", title: "hello" } };
const commentCreated = {
  type: "CommentCreated",
  data: { id: "c1", content: "nice", postId: "p1", status: "pending" },
};
const commentUpdated = {
  type: "CommentUpdated",
  data: { id: "c1", content: "nice!", postId: "p1", status: "approved" },
};

beforeEach(() => {
  jest.resetModules();
  axios = require("axios");
  jest.clearAllMocks();
  ({ app, syncEvents } = require("./index"));
});

test("GET /posts returns an empty object at start", async () => {
  const res = await request(app).get("/posts");

  expect(res.body).toEqual({});
});

test("builds posts with comments from incoming events", async () => {
  for (const event of [postCreated, commentCreated, commentUpdated]) {
    const res = await request(app).post("/events").send(event);
    expect(res.status).toBe(200);
  }

  const res = await request(app).get("/posts");
  expect(res.body).toEqual({
    p1: {
      id: "p1",
      title: "hello",
      comments: [{ id: "c1", content: "nice!", status: "approved" }],
    },
  });
});

test("syncEvents replays the events stored in the event bus", async () => {
  axios.get.mockResolvedValue({ data: [postCreated, commentCreated] });

  await syncEvents();

  const res = await request(app).get("/posts");
  expect(res.body.p1.comments).toEqual([
    { id: "c1", content: "nice", status: "pending" },
  ]);
});
