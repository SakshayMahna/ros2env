# 🤖 ros2env – ROS 2 Environment Manager for VS Code

**ros2env** is a Visual Studio Code extension that helps you manage isolated ROS2 environments with ease — start, stop, switch, and interact with them directly from your editor.

Whether you're working on multiple ROS2 projects or want to simplify environment switching, ros2env provides a seamless developer experience inside VS Code.

🌐 [Visit the Landing Page](https://sakshaymahna.github.io/ros2env/) – Explore features, guides, and videos in one place.

![ros2env in action](docs/screenshot.png)

---

## 🎥 Demonstration Videos

### 🎥 [Demo Video (Watch here)](https://youtu.be/L_r-QvbI5Dc)
[![Demo Video](https://img.youtube.com/vi/L_r-QvbI5Dc/0.jpg)](https://youtu.be/L_r-QvbI5Dc)

### 🎥 [Step by Step Installation Video (Watch here)](https://youtu.be/mt8DTLkWNyA)
[![Step by Step Installation Video](https://img.youtube.com/vi/mt8DTLkWNyA/0.jpg)](https://youtu.be/mt8DTLkWNyA)

---

## ✨ Why ros2env?

- 🚀 No more conflicting ROS2 installations
- 🐳 Docker powered isolation (fully abstracted)
- 🔄 Seamless environment switching
- 💻 Works across Windows, Mac and Linux
- 🖥️ GUI tools accessible via browser (RViz, Gazebo, etc.)

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

Before using **ros2env**, ensure the following is installed on your system:

- [Visual Studio Code](https://code.visualstudio.com/) ( >= v1.80.0)
- [Docker](https://docs.docker.com/get-docker/) (used under the hood)
- OR **WSL Docker** (if you're using Windows Subsystem for Linux)

> 💡 *Docker is required to isolate and manage environments behind the scenes. You don't need to know Docker to use ros2env.*

---

## 📦 Installation

You can install the extension in two ways:

### ✅ From VS Code Marketplace

1. Open VS Code and go to Extensions
2. Search for `ros2env`
3. Click **Install**

OR run from terminal:
```bash
code --install-extension SakshayMahna.ros2env
```

### 📦 Manual Installation

1. Download the latest release 👉 [Download ros2env-0.0.5.vsix](https://github.com/SakshayMahna/ros2env/releases)

2. Install the extension in VS Code
```bash
code --install-extension ros2env-0.0.5.vsix
```

---

## 🧪 Getting Started

Here’s how to start using **ros2env** to manage your ROS 2 environments.


### ➕ 1. Create a new ROS2 Environment

1. Open the **Command Palette** (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac)  
2. Run: `ROS2: Create Environment`  
3. Enter a name for your new environment (e.g., `my_ros2env`)  
4. Choose a ROS 2 distro (e.g., `humble`, `jazzy`, etc.)  
5. **(Optional)** You will be prompted to select one or more folders containing existing ROS 2 packages. These folders will be copied into the new environment’s workspace (`ros2_ws/src`).  
   - You can skip this step if you don't want to add anything for now.  
6. Wait for setup to complete (you’ll see progress indicators)

🎉 A new isolated ROS2 environment will be created with a ready-to-use workspace.

> You can later add more packages by simply copying them into the workspace directory open in VSCode.

**💡 For advanced Docker users: a volume is mounted to the Docker container from `/<home_directory>/.ros2env/<environment_name>` to persist changes across sessions.**


### 🔁 2. Load (Switch to) an Environment

1. Open Command Palette again
2. Run: `ROS2: Load Environment`
3. Select one of your previously created environments

This will:
- Start the environment (if stopped)
- Stop any running environment (if different)
- Attach an interactive terminal inside `ros2_ws`


### 💻 3. Open a ROS 2 Terminal

- Run: `ROS2: Open Terminal`
- This opens a terminal already inside your ROS2 workspace

You're ready to build, source, and run ROS2 nodes like usual.


### 🖥️ 4. Launch GUI Tools

- Run: `ROS2: Open GUI`
- This opens a browser tab with access to graphical tools (RViz, Gazebo, etc.)

> GUI support is provided via an embedded desktop accessible through your browser.


### 🛑 5. Stop an Environment

- Run: `ROS2: Stop Environment`
- This shuts down the running environment and closes terminals


### 🗑️ 6. Delete an Environment

- Run: `ROS2: Delete Environment`
- Select one or more environments to remove permanently

⚠️ This will stop and delete the selected environments (along with the code). Use with caution.


---

## 💬 Support and Feedback

- Have questions? [Join Discussions](https://github.com/SakshayMahna/ros2env/discussions)
- Found a bug? [Report an Issue](https://github.com/SakshayMahna/ros2env/issues)

---

## 👨‍💻 Contributing

Contributions are welcome! 🚀

If you'd like to improve ros2env:

- Create or select an issue to work on
- Fork this repository
- Create a new branch
- Submit a pull request mentioning the issue

---

## 🛡️ License

MIT License © Sakshay Mahna

---

## 🧩 Related Links

- 🌐 [Landing Page](https://sakshaymahna.github.io/ros2env/)
- 📦 [VSCode Marketplace Extension Page](https://marketplace.visualstudio.com/items?itemName=SakshayMahna.ros2env)
- 📄 [Discussions / Feedback](https://github.com/SakshayMahna/ros2env/discussions)
- 🛠️ [Report an Issue](https://github.com/SakshayMahna/ros2env/issues)