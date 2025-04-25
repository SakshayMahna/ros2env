# 🤖 ros2env – ROS 2 Environment Manager for VS Code

**ros2env** is a Visual Studio Code extension that helps you manage isolated ROS2 environments with ease — start, stop, switch, and interact with them directly from your editor.

Whether you're working on multiple ROS2 projects or want to simplify environment switching, ros2env provides a seamless developer experience inside VS Code.

🎥 [Step by Step Installation Video (Watch here)](https://youtu.be/mt8DTLkWNyA)

🎥 [Demo Video (Watch here)](https://youtu.be/03XxIxZxtrA)

---

## 🚀 Features

- 🔍 Discover available ROS2 environments
- ▶️ Start or stop environments with one command
- 🧠 Open a ready to use terminal inside the environment workspace (`ros2_ws`)
- 🪟 Launch GUI apps from your environment (via browser-based interface)
- ➕ Create or 🗑️ delete environments easily
- 🧭 Treat each environment like a virtual ROS2 workspace

---

## 🧰 Requirements

Before using ros2env, ensure the following is installed on your system:

- [Visual Studio Code](https://code.visualstudio.com/)
- [Docker](https://docs.docker.com/get-docker/) (used under the hood)

> 💡 *Docker is required to isolate and manage environments behind the scenes. You don't need to know Docker to use ros2env.*

---

## 📦 Installation

### 1. Download the latest release

👉 [Download ros2env-0.0.4.vsix](https://github.com/SakshayMahna/ros2env/releases)

### 2. Install the extension in VS Code

```bash
code --install-extension ros2env-0.0.4.vsix
```

## 🧪 Getting Started

Here’s how to start using **ros2env** to manage your ROS 2 environments.

### 📁 1. Open or create a ROS2 project in VS Code

Open any folder where you plan to work on your ROS2 project.

> If you don’t have a workspace yet, no problem — `ros2env` creates one for you.

---

### ➕ 2. Create a new ROS2 Environment

1. Open the **Command Palette** (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac)
2. Run: `ROS2: Create Environment`
3. Enter a name for your new environment (e.g., `my_ros2env`)
4. Choose a ROS 2 distro (e.g., `humble`, `foxy`, etc.)
5. Wait for setup to complete (you’ll see progress)

🎉 A new isolated ROS2 environment will be created with a ready to use workspace.

---

### 🔁 3. Load (Switch to) an Environment

1. Open Command Palette again
2. Run: `ROS2: Load Environment`
3. Select one of your previously created environments

This will:
- Start the environment (if stopped)
- Stop any running environment (if different)
- Attach an interactive terminal inside `ros2_ws`

---

### 💻 4. Open a ROS 2 Terminal

- Run: `ROS2: Open Terminal`
- This opens a terminal already inside your ROS2 workspace

You're ready to build, source, and run ROS2 nodes like usual.

---

### 🖥️ 5. Launch GUI Tools

- Run: `ROS2: Open GUI`
- This opens a browser tab with access to graphical tools (RViz, Gazebo, etc.)

> GUI support is provided via an embedded desktop accessible through your browser.

---

### 🛑 6. Stop an Environment

- Run: `ROS2: Stop Environment`
- This shuts down the running environment and closes terminals

---

### 🗑️ 7. Delete an Environment

- Run: `ROS2: Delete Environment`
- Select one or more environments to remove permanently

⚠️ This will stop and delete the selected environments. Use with caution.
