'use client';
import React, { useEffect, useState } from 'react';
import {
  Table,
  Tag,
  Button,
  Drawer,
  Form,
  Input,
  Select,
  DatePicker,
  Space,
} from 'antd';
import { EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
const baseUrl = process.env.NEXT_PUBLIC_API_URL;
const { Option } = Select;
interface Project {
  id: number;
  name: string;
}
interface Milestone {
  id: number;
  name: string;
}
interface TaskData {
  id: number;
  project_id: number;
  milestone_id: number | null;
  name: string;
  status: string;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  project?: Project;
  milestone?: string;
}
export default function TaskTable() {
  const [tableData, setTableData] = useState<TaskData[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form] = Form.useForm();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [filteredMilestones, setFilteredMilestones] = useState<Milestone[]>([]);
  useEffect(() => {
    // Fetch tasks
    fetch(`${baseUrl}/api/task`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTableData(data.data);
        }
      })
      .catch((err) => console.error('Error fetching tasks:', err));
    // Fetch projects
    fetch(`${baseUrl}/api/project`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProjects(data.data);
        }
      })
      .catch((err) => console.error('Error fetching projects:', err));
    // Fetch milestones
    fetch(`${baseUrl}/api/milestone`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMilestones(data.data);
        }
      })
      .catch((err) => console.error('Error fetching milestones:', err));
  }, []);
  const handleProjectChange = (projectId: number) => {
    form.setFieldsValue({ milestone_id: undefined });
    
  };
  const showDrawer = () => {
    form.resetFields();
    setFilteredMilestones([]);
    setDrawerOpen(true);
  };
  const closeDrawer = () => {
    setDrawerOpen(false);
  };
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : null,
      };
      const res = await fetch(`${baseUrl}/api/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setTableData((prev) => [...prev, data.data]);
        setDrawerOpen(false);
        form.resetFields();
      } else {
        console.error(data.message);
      }
    } catch (err) {
      console.error('Validation or saving error:', err);
    }
  };
 const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
    },
    {
      title: 'Төслийн нэр',
      dataIndex: ['project', 'name'],
      render: (text: string, record: TaskData) => text ?? record.project_id,
    },
    {
      title: 'Milestone',
      dataIndex: 'milestone',
      render: (text: string, record: TaskData) => text ?? record.milestone_id,
    },
    {
      title: 'Task name',
      dataIndex: 'name',
    },
    {
      title: 'Төлөв',
      dataIndex: 'status',
      render: (status: string) => { // 👈 Changed to string
        let color = '';
        switch (status) {
          case 'Pending':
            color = 'default';
            break;
          case 'In Progress':
            color = 'gold';
            break;
          case 'Completed':
            color = 'green';
            break;
          case 'Cancelled':
            color = 'red';
            break;
          default:
            color = 'default';
        }
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      render: (priority: string) => {
        const color =
          priority === 'urgent'
            ? 'red'
            : priority === 'high'
            ? 'orange'
            : priority === 'medium'
            ? 'blue'
            : 'default';
        return <Tag color={color}>{priority}</Tag>;
      },
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      render: (_: any, record: TaskData) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => router.push(`/admin/project/${record.project_id}/task`)}
          />
        </Space>
      ),
    },
  ];
  return (
    <div className="bg-white p-4 rounded-lg shadow w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Task List</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={showDrawer}>
          Add Task
        </Button>
      </div>
      <Table
        dataSource={tableData}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
      <Drawer
        title="Add Task"
        placement="right"
        onClose={closeDrawer}
        open={drawerOpen}
        width={400}
        footer={
          <div
            style={{
              textAlign: 'right',
            }}
          >
            <Button onClick={closeDrawer} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button onClick={handleSave} type="primary">
              Save
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical" hideRequiredMark>
          <Form.Item
            label="Task Name"
            name="name"
            rules={[{ required: true, message: 'Please enter task name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Project"
            name="project_id"
            rules={[{ required: true, message: 'Please select a project' }]}
          >
            <Select
              placeholder="Select a project"
              onChange={(value: number) => handleProjectChange(value)}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children as unknown as string)
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {projects.map((project) => (
                <Option key={project.id} value={project.id}>
                  {project.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Milestone" name="milestone_id">
            <Select
              placeholder="Select a milestone"
              allowClear
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children as unknown as string)
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {milestones.map((ms) => (
                <Option key={ms.id} value={ms.id}>
                  {ms.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select placeholder="Select status">
              <Option value={1}>Pending</Option>
              <Option value={2}>In Progress</Option>
              <Option value={3}>Completed</Option>
              <Option value={4}>Cancelled</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Due Date" name="due_date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="Priority"
            name="priority"
            rules={[{ required: true, message: 'Please select priority' }]}
          >
            <Select placeholder="Select priority">
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
              <Option value="urgent">Urgent</Option>
            </Select>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}