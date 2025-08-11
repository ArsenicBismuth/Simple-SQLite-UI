import StreamingTodoList from "./streaming-todo-list";

interface TodoListProps {
  userId: string;
}

export default function TodoList({ userId }: TodoListProps) {
  return <StreamingTodoList userId={userId} />;
}
