import { Request, Response } from "express";
import { prisma } from "../../data/postgres";

export class TodosController {
  constructor() {}

  public getTodos = async (_req: Request, res: Response) => {
    const todos = await prisma.todo.findMany();
    return res.json(todos);
  };

  public getTodoById = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id))
      return res.status(400).json({ error: "ID argument is not a number" });

    const todo = await prisma.todo.findFirst({
      where: { id },
    });
    if (todo) {
      res.json(todo);
      console.log(todo);
    } else {
      res.status(404).json({ error: `TODO with id ${id} not found` });
    }
  };

  public createTodo = async (req: Request, res: Response) => {
    const { text } = req.body;
    if (!text)
      return res.status(400).json({ error: "Text property is required" });

    const todo = await prisma.todo.create({
      data: { text },
    });

    res.json(todo);
  };

  public updateTodo = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id))
      return res.status(400).json({ error: "ID argument is not a number" });

    const todo = await prisma.todo.findFirst({
      where: { id },
    });
    if (!todo)
      return res.status(404).json({ error: `TODO with id ${id} not found` });

    const { text, completedAt } = req.body;
    const updatedTodo = await prisma.todo.update({
      where: { id },
      data: { text, completedAt: completedAt ? new Date(completedAt) : null },
    });
    res.json(updatedTodo);
  };

  public deleteTodo = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (isNaN(id))
      return res.status(400).json({ error: "ID argument is not a number" });

    try {
      const deleted = await prisma.todo.delete({
        where: { id },
      });
      res.json(deleted);
    } catch (error) {
      res.status(400).json({ error: `TODO with id ${id} not found` });
    }
  };
}
