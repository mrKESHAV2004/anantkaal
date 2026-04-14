require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");


app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

const app = express();
app.use(express.json());

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY
);


const authMiddleware = (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: "No token" });

    const token = header.startsWith("Bearer ")
      ? header.split(" ")[1]
      : header;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, team_id }

    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// REGISTER (create or join team)
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password, team_name } = req.body;

    if (!username || !email || !password || !team_name) {
      return res.status(400).json({ error: "All fields required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Check if team exists
    let { data: team } = await supabase
      .from("teams")
      .select("*")
      .eq("name", team_name)
      .single();

    // 2. If not, create team
    if (!team) {
      const { data: newTeam, error: teamError } = await supabase
        .from("teams")
        .insert([{ name: team_name }])
        .select()
        .single();

      if (teamError) throw teamError;
      team = newTeam;
    }

    // 3. Create user with team_id
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          username,
          email,
          password_hash: hashedPassword,
          team_id: team.id,
        },
      ])
      .select();

    if (error) throw error;

    res.json({ message: "User registered", user: data[0], team });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user)
      return res.status(400).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch)
      return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, email: user.email, team_id: user.team_id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/teams", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET TASKS (team scoped)
app.get("/api/tasks", authMiddleware, async (req, res) => {
  try {
    const { status, assigned_to } = req.query;

    let query = supabase
      .from("tasks")
      .select("*")

    if (status) query = query.eq("status", status);
    if (assigned_to) query = query.eq("assigned_to", assigned_to);

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// CREATE TASK
app.post("/api/tasks", authMiddleware, async (req, res) => {
  try {
    const { title, description, status, assigned_to } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title required" });
    }

    const { data, error } = await supabase
      .from("tasks")
      .insert([
        {
          user_id: req.user.id,
          team_id: req.user.team_id,
          title,
          description,
          status: status || "todo",
          assigned_to: assigned_to || null,
        },
      ])
      .select();

    if (error) throw error;

    res.json(data[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// UPDATE TASK
app.put("/api/tasks/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, assigned_to } = req.body;

    const { data, error } = await supabase
      .from("tasks")
      .update({ title, description, status, assigned_to })
      .eq("id", id)
      .eq("team_id", req.user.team_id)
      .select();

    if (error) throw error;

    if (!data.length) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(data[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE TASK
app.delete("/api/tasks/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id)
      .eq("team_id", req.user.team_id);

    if (error) throw error;

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// TASKS ASSIGNED TO ME
app.get("/api/tasks/assigned-to-me", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("assigned_to", req.user.id)
      .eq("team_id", req.user.team_id);

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// TASKS TEAM
app.get("/api/tasks/team", authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("team_id", req.user.team_id);

    if (error) throw error;

    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});