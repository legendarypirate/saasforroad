const express = require('express');
const db = require("../models");
const Project = db.projects;
const Task = db.tasks;

const Op = db.Sequelize.Op;

exports.create = async (req, res) => {
  if (!req.body.name) {
    return res.status(400).json({ success: false, message: "name is required!" });
  }

  try {
    const project = {
      name: req.body.name,
      location: req.body.location,
      purpose: req.body.purpose,
      engineer: req.body.engineer,
      budget: req.body.budget,
      equipment: req.body.equipment,
      staff: req.body.staff,
      status: req.body.status ?? 1,
    };

    const data = await Project.create(project);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Some error occurred while creating the project." });
  }
};

// Get all projects with their invited users
exports.getProjectsWithUsers = async (req, res) => {
    try {
      const projects = await db.projects.findAll({
        include: [
          {
            model: db.users,
            attributes: ['id', 'username', 'email', 'position'],
            through: {
              attributes: ['inviteStatus', 'role'],
            }
          }
        ]
      });
  
      res.status(200).json({
        success: true,
        data: projects
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message || "Error retrieving projects with users."
      });
    }
  };

 
  
// Retrieve all projects (optionally with team members)
exports.findAll = async (req, res) => {
  const name = req.query.name;
  var condition = name ? { name: { [Op.like]: `%${name}%` } } : null;

  try {
    const data = await Project.findAll({
      where: condition,
      include: [
        {
          model: db.users,
          attributes: ["id", "username", "email", "position"],
          through: { attributes: ["inviteStatus", "role"] },
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, data: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Some error occurred while retrieving banners." });
  }
};

// Find a single project with tasks and completion stats
exports.findOne = async (req, res) => {
  const id = req.params.id;

  try {
    const project = await Project.findByPk(id, {
      include: [
        {
          model: db.users,
          attributes: ["id", "username", "email", "position"],
          through: { attributes: ["inviteStatus", "role"] },
          required: false,
        },
        {
          model: db.project_phases,
          as: "phases",
          required: false,
          separate: true,
          order: [
            ["sort_order", "ASC"],
            ["start_date", "ASC"],
          ],
        },
      ],
    });
    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Cannot find project with id=${id}.`,
      });
    }

    const tasks = await Task.findAll({
      where: { project_id: id },
      include: [
        {
          model: db.milestones,
          attributes: ["id", "name"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 3).length;
    const inProgress = tasks.filter((t) => t.status === 2).length;
    const todo = tasks.filter((t) => t.status === 0 || t.status === 1).length;
    const completionPercent = total === 0 ? 0 : Math.round((completed / total) * 100);

    res.json({
      success: true,
      data: {
        ...project.toJSON(),
        tasks: tasks.map((t) => ({
          ...t.toJSON(),
          milestone: t.milestone ? t.milestone.name : null,
        })),
        stats: {
          total,
          completed,
          inProgress,
          todo,
          completionPercent,
        },
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Error retrieving project with id=" + id,
    });
  }
};

exports.total = async (req, res) => {
  const lastname = req.query.lastname;
  const condition = lastname ? { lastname: { [Op.like]: `%${lastname}%` } } : null;

  try {
    // Get all projects
    const projects = await Project.findAll({ where: condition });

    const total = projects.length;
    const ongoing = projects.filter(p => p.status === 1).length;
    const done = projects.filter(p => p.status === 2).length;

    // Count total number of tasks (across all projects)
    const tasks = await Task.count();

    res.send({
      success: true,
      total,
      ongoing,
      done,
      tasks
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.message || "Some error occurred while retrieving summary."
    });
  }
};

// Update a project by id
exports.update = async (req, res) => {
  const id = req.params.id;

  try {
    const updateData = {
      name: req.body.name,
      location: req.body.location,
      purpose: req.body.purpose,
      engineer: req.body.engineer,
      budget: req.body.budget,
      equipment: req.body.equipment,
      staff: req.body.staff,
      status: req.body.status,
    };

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body is empty. Provide at least one field to update.",
      });
    }

    const [num] = await Project.update(updateData, { where: { id } });
    if (num !== 1) {
      return res.status(404).json({
        success: false,
        message: `Cannot update project with id=${id}. Maybe project was not found.`,
      });
    }

    const updatedProject = await Project.findByPk(id);
    res.json({
      success: true,
      message: "Project updated successfully.",
      data: updatedProject,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error updating project with id=" + id,
      error: err.message,
    });
  }
};

// Delete a project by id
exports.delete = async (req, res) => {
  const id = req.params.id;

  try {
    const num = await Project.destroy({ where: { id } });
    if (num === 1) {
      return res.json({ success: true, message: "Project was deleted successfully!" });
    }
    res.status(404).json({
      success: false,
      message: `Cannot delete project with id=${id}. Maybe project was not found.`,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Could not delete project with id=" + id,
    });
  }
};

// Delete all projects
exports.deleteAll = async (req, res) => {
  try {
    const nums = await Project.destroy({ where: {}, truncate: false });
    res.json({ success: true, message: `${nums} projects were deleted successfully!` });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Some error occurred while removing all projects.",
    });
  }
};

// Legacy stub (unused)
exports.findAllPublished = async (_req, res) => {
  try {
    const data = await Project.findAll();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Some error occurred while retrieving projects.",
    });
  }
};
