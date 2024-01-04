import request from "supertest";
import { testServer } from "../../test-server";
import { prisma } from "../../../src/data/postgres";

describe("Todo route testing", () => {
  beforeAll(async () => {
    await testServer.start();
  });

  afterAll(() => {
    testServer.close();
  });

  beforeEach(async () => {
    await prisma.todo.deleteMany();
  });

  const todo1 = { text: "Hello World 1" };
  const todo2 = { text: "Hello World 2" };

  test("should return Todos /api/todos", async () => {
    await prisma.todo.createMany({
      data: [todo1, todo2],
    });
    const { body } = await request(testServer.app)
      .get("/api/todos")
      .expect(200);

    expect(body).toBeInstanceOf(Array);
    expect(body.length).toBe(2);
    expect(body[0].text).toBe(todo1.text);
    expect(body[1].text).toBe(todo2.text);
    expect(body[0].completedAt).toBeNull();
    expect(body[1].completedAt).toBeNull();
  });

  test("should return a Todo /api/todos/:id", async () => {
    const todo = await prisma.todo.create({
      data: todo1,
    });
    const { body } = await request(testServer.app)
      .get(`/api/todos/${todo.id}`)
      .expect(200);

    expect(body).toEqual({
      id: todo.id,
      text: todo.text,
      completedAt: todo.completedAt,
    });
  });

  test("should return a 404 NotFound /api/todos/:id", async () => {
    const todoId = 999;
    const { body } = await request(testServer.app)
      .get(`/api/todos/${todoId}`)
      .expect(400);

    expect(body).toEqual({
      error: `Todo with id ${todoId} not found`,
    });
  });

  test("should return a new Todo when post /api/todos", async () => {
    const todoText = "New todo";
    const { body } = await request(testServer.app)
      .post("/api/todos")
      .send({ text: todoText })
      .expect(201);

    expect(body).toEqual({
      id: body.id,
      text: todoText,
      completedAt: null,
    });
  });

  test("should return an error if text is not present", async () => {
    const { body } = await request(testServer.app)
      .post("/api/todos")
      .send({ hello: "world" })
      .expect(400);

    expect(body).toEqual({
      error: "Text property is required",
    });
  });

  test("should return an error if text is empty", async () => {
    const { body } = await request(testServer.app)
      .post("/api/todos")
      .send({ text: "" })
      .expect(400);

    expect(body).toEqual({
      error: "Text property is required",
    });
  });

  test("should return an updated Todo /api/todos/:id", async () => {
    const todo = await prisma.todo.create({ data: todo1 });
    const todoTextModified = "New todo text";
    const todoCompletedAtModified = "2024-01-04";
    const { body } = await request(testServer.app)
      .put(`/api/todos/${todo.id}`)
      .send({ text: todoTextModified, completedAt: todoCompletedAtModified });

    expect(body).toEqual({
      id: todo.id,
      text: todoTextModified,
      completedAt: "2024-01-04T00:00:00.000Z",
    });
  });

  // TODO: apply custom errors
  test("should return 404 if Todo not found", async () => {
    const todo = await prisma.todo.create({ data: todo1 });
    await prisma.todo.delete({ where: { id: todo.id } });
    const { body } = await request(testServer.app)
      .put(`/api/todos/${todo.id}`)
      .send({ text: "Updated text" })
      .expect(400);

    expect(body).toEqual({
      error: `Todo with id ${todo.id} not found`,
    });
  });

  test("should return an updated Todo only the date", async () => {
    const todo = await prisma.todo.create({ data: todo1 });
    const { body } = await request(testServer.app)
      .put(`/api/todos/${todo.id}`)
      .send({ completedAt: "2024-01-04" })
      .expect(200);

    expect(body).toEqual({
      id: todo.id,
      text: todo.text,
      completedAt: "2024-01-04T00:00:00.000Z",
    });
  });

  test("should return an updated Todo only the text", async () => {
    const todo = await prisma.todo.create({ data: todo1 });
    const updatedTodoText = "Updated Text";
    const { body } = await request(testServer.app)
      .put(`/api/todos/${todo.id}`)
      .send({ text: updatedTodoText })
      .expect(200);

    expect(body).toEqual({
      id: todo.id,
      text: updatedTodoText,
      completedAt: todo.completedAt,
    });
  });

  test("should return an error if id is not valid", async () => {
    const { body } = await request(testServer.app)
      .put("/api/todos/not-valid")
      .expect(400);

    expect(body).toEqual({
      error: "id must be a valid number",
    });
  });

  test("should return an error if completedAt is not valid", async () => {
    const todo = await prisma.todo.create({ data: todo1 });
    const { body } = await request(testServer.app)
      .put(`/api/todos/${todo.id}`)
      .send({ completedAt: "not valid date" })
      .expect(400);

    expect(body).toEqual({
      error: "completedAt must be a valid date",
    });
  });

  test("should delete a Todo /api/todos/:id", async () => {
    const todo = await prisma.todo.create({ data: todo1 });
    const { body } = await request(testServer.app)
      .delete(`/api/todos/${todo.id}`)
      .expect(200);

    expect(body).toEqual({
      id: todo.id,
      text: todo.text,
      completedAt: null,
    });
  });

  test("should return a 404 if Todo not found when delete", async () => {
    const todo = await prisma.todo.create({ data: todo1 });
    await prisma.todo.delete({ where: { id: todo.id } });
    const { body } = await request(testServer.app)
      .delete(`/api/todos/${todo.id}`)
      .expect(400);

    expect(body).toEqual({
      error: `Todo with id ${todo.id} not found`,
    });
  });
});
