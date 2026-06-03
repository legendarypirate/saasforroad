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
import { useCallback, useEffect, useState } from "react";
import {
  Card,
  Col,
  Dropdown,
  Row,
  Tag,
  Typography,
  Spin,
} from "antd";
import { CalendarOutlined, MoreOutlined } from "@ant-design/icons";
import toast from "react-hot-toast";

const { Title, Text } = Typography;

type Status = "todo" | "in-progress" | "done";

interface Task {
  id: number;
  name: string;
  detail?: string;
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

const columnLabels: Record<Status, string> = {
  todo: "Хүлээгдэж буй",
  "in-progress": "Явагдаж буй",
  done: "Дууссан",
};

const columnColors: Record<Status, string> = {
  todo: "#1890ff",
  "in-progress": "#faad14",
  done: "#52c41a",
};

interface TaskKanbanProps {
  projectId: string;
  onTasksChange?: () => void;
}

export default function TaskKanban({ projectId, onTasksChange }: TaskKanbanProps) {
  const [columns, setColumns] = useState<Columns>({
    todo: [],
    "in-progress": [],
    done: [],
  });
  const [activeItem, setActiveItem] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const sensors = useSensors(useSensor(PointerSensor));

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const url = projectId
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/task?project_id=${projectId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/task`;
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        const grouped: Columns = { todo: [], "in-progress": [], done: [] };

        result.data.forEach((task: {
          id: number;
          name: string;
          detail?: string;
          due_date: string;
          milestone: string;
          priority: string;
          status: string | number;
        }) => {
          const statusStr = typeof task.status === "number"
            ? ({ 1: "ToDo", 2: "In Progress", 3: "Completed" }[task.status] ?? "ToDo")
            : task.status;
          const key = statusLabelToKey[statusStr] || "todo";
          grouped[key].push({
            id: task.id,
            name: task.name,
            detail: task.detail,
            due_date: task.due_date,
            milestone: task.milestone,
            priority: task.priority,
            status: key,
          });
        });

        setColumns(grouped);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Даалгавар ачаалахад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

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
        toast.success("Даалгавар шилжлээ");
        onTasksChange?.();
      } catch {
        toast.error("Статус шинэчлэхэд алдаа гарлаа");
        fetchTasks();
      }
    }
  };

  const findColumnByTaskId = (id: string): Status | undefined => {
    return Object.keys(columns).find((key) =>
      columns[key as Status].some((item) => item.id.toString() === id)
    ) as Status | undefined;
  };


  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <Spin tip="Даалгавар ачааллаж байна..." />
      </div>
    );
  }

  return (
    <div className="p-2">
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
          {(Object.entries(columns) as [Status, Task[]][]).map(([status, items]) => (
            <Col key={status} xs={24} md={8}>
              <DroppableColumn id={status}>
                <div
                  style={{
                    background: "#f8fafc",
                    borderRadius: 12,
                    padding: 16,
                    minHeight: 360,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div className="flex justify-between items-center mb-3">
                    <Title level={5} style={{ color: columnColors[status], margin: 0 }}>
                      {columnLabels[status]}
                    </Title>
                    <Tag>{items.length}</Tag>
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
    low: "green",
    medium: "gold",
    high: "orange",
    urgent: "red",
    Low: "green",
    Medium: "gold",
    High: "orange",
    Urgent: "red",
  };

  const priorityLabel: Record<string, string> = {
    low: "Бага",
    medium: "Дунд",
    high: "Өндөр",
    urgent: "Яаралтай",
  };


  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mb-3 cursor-grab rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 bg-white"
    >
      <Card
        size="small"
        bordered={false}
        styles={{ body: { padding: "12px 14px" } }}
        actions={[
          <Dropdown menu={{ items: [{ key: "1", label: "Дэлгэрэнгүй" }, { key: "3", label: "Устгах", danger: true }] }} trigger={["click"]} key="actions">
            <MoreOutlined />
          </Dropdown>,
        ]}
      >
        <Text strong className="text-base line-clamp-2" style={{ display: "block", marginBottom: 6 }}>
          {item.name}
        </Text>

        {item.detail && (
          <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
            {item.detail}
          </Text>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Tag
            color={priorityColorMap[item.priority] || "default"}
            className="uppercase font-semibold text-xs"
          >
            {priorityLabel[item.priority] || item.priority}
          </Tag>
          {item.milestone && item.milestone !== "No milestone" && (
            <Tag color="blue" className="text-xs">
              {item.milestone}
            </Tag>
          )}
        </div>

        {item.due_date && (
          <div className="flex items-center text-gray-500 text-sm gap-2">
            <CalendarOutlined />
            <span>{new Date(item.due_date).toLocaleDateString("mn-MN")}</span>
          </div>
        )}
      </Card>
    </div>
  );
}
