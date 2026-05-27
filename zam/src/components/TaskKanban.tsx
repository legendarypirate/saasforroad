/* eslint-disable @next/next/no-img-element */
"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Dropdown,
  Menu,
  Row,
  Tag,
  Typography,
  Tooltip,
  Avatar,
} from "antd";
import { CalendarOutlined, MoreOutlined } from "@ant-design/icons";
import toast from "react-hot-toast";

const { Title, Text } = Typography;

type Status = "todo" | "in-progress" | "done";

interface Task {
  id: number;
  name: string;
  location?: string;
  due_date: string;
  priority: string;
  milestone: string;
  status: Status;
}

type Columns = {
  [key in Status]: Task[];
};

const statusLabelToKey: Record<string, Status> = {
  "Not Started": "todo",
  ToDo: "todo",
  "In Progress": "in-progress",
  Completed: "done",
};

const statusKeyToNumber: Record<Status, number> = {
  todo: 1,
  "in-progress": 2,
  done: 3,
};

export default function TaskKanban({ projectId }: { projectId: string }) {
  const [columns, setColumns] = useState<Columns>({
    todo: [],
    "in-progress": [],
    done: [],
  });
  const [activeItem, setActiveItem] = useState<Task | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    fetchTasks();
  }, [projectId]);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/task`);
      const result = await response.json();

      if (result.success) {
        const grouped: Columns = { todo: [], "in-progress": [], done: [] };

        result.data.forEach((task: any) => {
          const key = statusLabelToKey[task.status] || "todo";
          grouped[key].push({
            id: task.id,
            name: task.name,
            due_date: task.due_date,
            milestone: task.milestone,
            priority: task.priority,
            location: task.project?.name ?? "No location",
            status: key,
          });
        });

        setColumns(grouped);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load tasks");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over || active.id === over.id) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    const fromColumn = findColumnByTaskId(activeId);
    if (!fromColumn) return;

    const isOverColumn = ["todo", "in-progress", "done"].includes(overId);
    const toColumn = isOverColumn
      ? (overId as Status)
      : findColumnByTaskId(overId);
    if (!toColumn) return;

    if (fromColumn === toColumn) {
      const items = [...columns[fromColumn]];
      const oldIndex = items.findIndex((item) => item.id.toString() === activeId);
      const newIndex = items.findIndex((item) => item.id.toString() === overId);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(items, oldIndex, newIndex);
        setColumns((prev) => ({ ...prev, [fromColumn]: reordered }));
      }
    } else {
      const fromItems = [...columns[fromColumn]];
      const toItems = [...columns[toColumn]];
      const fromIndex = fromItems.findIndex((item) => item.id.toString() === activeId);
      if (fromIndex === -1) return;
      const [movedItemOriginal] = fromItems.splice(fromIndex, 1);
      const movedItem = { ...movedItemOriginal, status: toColumn };

      if (!isOverColumn) {
        const toIndex = toItems.findIndex((item) => item.id.toString() === overId);
        toItems.splice(toIndex >= 0 ? toIndex : toItems.length, 0, movedItem);
      } else {
        toItems.push(movedItem);
      }

      setColumns((prev) => ({
        ...prev,
        [fromColumn]: fromItems,
        [toColumn]: toItems,
      }));

      try {
        const patchRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/task/task/${activeId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: statusKeyToNumber[toColumn] }),
          }
        );
        const result = await patchRes.json();
        if (!result.success) throw new Error(result.message);
        toast.success("Task moved");
      } catch (error) {
        toast.error("Failed to update task");
        fetchTasks();
      }
    }
  };

  const findColumnByTaskId = (id: string): Status | undefined => {
    return Object.keys(columns).find((key) =>
      columns[key as Status].some((item) => item.id.toString() === id)
    ) as Status | undefined;
  };

  return (
    <div className="p-4">
      <Row gutter={16}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={(event) => {
            const id = event.active.id.toString();
            const item = Object.values(columns)
              .flat()
              .find((t) => t.id.toString() === id);
            if (item) setActiveItem(item);
          }}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveItem(null)}
        >
          {Object.entries(columns).map(([status, items]) => (
            <Col key={status} span={8}>
              <DroppableColumn id={status}>
                <div className="bg-gray-50 rounded-md p-3 min-h-[300px]">
                  <div className="flex justify-between items-center mb-3">
                    <Title
                      level={4}
                      style={{
                        color:
                          status === "todo"
                            ? "#1890ff"
                            : status === "in-progress"
                            ? "#faad14"
                            : "#52c41a",
                      }}
                    >
                      {status.replace("-", " ")}
                    </Title>
                    <Text type="secondary">{items.length} tasks</Text>
                  </div>
                  <SortableContext
                    items={items.map((item) => item.id.toString())}
                    strategy={verticalListSortingStrategy}
                  >
                    {items.map((item) => (
                      <KanbanCard key={item.id} item={item} />
                    ))}
                  </SortableContext>
                </div>
              </DroppableColumn>
            </Col>
          ))}

          <DragOverlay>
            {activeItem ? <KanbanCard item={activeItem} /> : null}
          </DragOverlay>
        </DndContext>
      </Row>
    </div>
  );
}

function DroppableColumn({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef}>{children}</div>;
}

function KanbanCard({ item }: { item: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id.toString() });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityColorMap: Record<string, string> = {
    Low: "green",
    Medium: "gold",
    High: "red",
  };

  const menu = (
    <Menu>
      <Menu.Item key="1">Share to client</Menu.Item>
      <Menu.Item key="2">Duplicate</Menu.Item>
      <Menu.Item key="3" danger>
        Delete
      </Menu.Item>
    </Menu>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mb-4 cursor-pointer rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 bg-white"
    >
      <Card
        size="small"
        bordered={false}
        bodyStyle={{ padding: "12px 16px" }}
        actions={[
          <Dropdown overlay={menu} trigger={["click"]} key="actions">
            <MoreOutlined />
          </Dropdown>,
        ]}
      >
        <div className="flex justify-between items-center mb-1">
          <Text strong className="text-lg line-clamp-1">
            {item.name}
          </Text>
          <Avatar
            size={28}
            src="/images/user/user-02.jpg"
            alt="Assignee"
            className="border border-gray-200"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Tag
            color={priorityColorMap[item.priority] || "default"}
            className="uppercase font-semibold text-xs tracking-wide"
          >
            {item.priority}
          </Tag>
          {item.milestone && (
            <Tag color="blue" className="text-xs font-medium">
              {item.milestone}
            </Tag>
          )}
        </div>

        <div className="flex items-center text-gray-500 text-sm gap-3">
          <CalendarOutlined />
          <span>{new Date(item.due_date).toLocaleDateString()}</span>

          {item.location && (
            <Tooltip title={item.location}>
              <div className="flex items-center gap-1 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13 21.314l-4.657-4.657a8 8 0 1111.314 0z"
                  />
                  <circle cx={13} cy={11} r={3} stroke="none" fill="currentColor" />
                </svg>
                <span className="truncate max-w-[100px]">{item.location}</span>
              </div>
            </Tooltip>
          )}
        </div>
      </Card>
    </div>
  );
}
