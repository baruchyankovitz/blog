const request = require("supertest");
let axios;

jest.mock("axios");

let app;

beforeEach(() => {
  jest.resetModules();
  axios = require("axios");
  jest.clearAllMocks();
  axios.post.mockResolvedValue({});
  app = require("./index");
});

test("GET comments of an unknown post returns an empty list", async () => {
  const res = await request(app).get("/posts/nope/comments");

  expect(res.status).toBe(200);
  expect(res.body).toEqual([]);
});

test("POST a comment stores it as pending and emits CommentCreated", async () => {
  const res = await request(app)
    .post("/posts/p1/comments")
    .send({ content: "nice" });

  expect(res.status).toBe(201);
  expect(res.body).toEqual([
    { id: expect.any(String), content: "nice", status: "pending" },
  ]);
  expect(axios.post).toHaveBeenCalledWith("http://event-bus-srv:4005/events", {
    type: "CommentCreated",
    data: {
      id: res.body[0].id,
      content: "nice",
      postId: "p1",
      status: "pending",
    },
  });
});

test("CommentModerated updates the status and emits CommentUpdated", async () => {
  const created = await request(app)
    .post("/posts/p1/comments")
    .send({ content: "nice" });
  const id = created.body[0].id;
  axios.post.mockClear();

  const res = await request(app)
    .post("/events")
    .send({
      type: "CommentModerated",
      data: { id, postId: "p1", status: "approved", content: "nice" },
    });

  expect(res.status).toBe(200);
  expect(axios.post).toHaveBeenCalledWith("http://event-bus-srv:4005/events", {
    type: "CommentUpdated",
    data: { id, status: "approved", postId: "p1", content: "nice" },
  });

  const list = await request(app).get("/posts/p1/comments");
  expect(list.body[0].status).toBe("approved");
});
