import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  AgentTask,
  fetchMyTasks,
  isLoggedIn,
  login,
  logout,
  syncTimeBatch,
} from "./src/api";

function formatElapsed(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<AgentTask | null>(null);
  const [tracking, setTracking] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadTasks = useCallback(async () => {
    const data = await fetchMyTasks();
    setTasks(data);
    if (data.length === 1) setSelectedTask(data[0]);
  }, []);

  useEffect(() => {
    isLoggedIn()
      .then(async (ok) => {
        setAuthenticated(ok);
        if (ok) await loadTasks();
      })
      .finally(() => setLoading(false));
  }, [loadTasks]);

  useEffect(() => {
    if (!tracking) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      if (startRef.current) {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [tracking]);

  async function handleLogin() {
    setError("");
    try {
      await login(email.trim(), password);
      setAuthenticated(true);
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  async function handleLogout() {
    await logout();
    setAuthenticated(false);
    setTasks([]);
    setSelectedTask(null);
    setTracking(false);
    setElapsed(0);
    startRef.current = null;
  }

  function handleStart() {
    if (!selectedTask?.projectId) {
      setError("Selected task needs a linked project");
      return;
    }
    startRef.current = Date.now();
    setElapsed(0);
    setTracking(true);
    setError("");
  }

  async function handleStop() {
    if (!tracking || !startRef.current || !selectedTask?.projectId) return;
    const end = Date.now();
    const start = startRef.current;
    setTracking(false);
    startRef.current = null;
    try {
      await syncTimeBatch({
        projectId: selectedTask.projectId,
        taskId: selectedTask._id,
        startTime: start,
        endTime: end,
        activityScore: 1,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync time");
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#6C2BD9" />
      </View>
    );
  }

  if (!authenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <Text style={styles.title}>Chronos</Text>
        <Text style={styles.subtitle}>Sign in with your workspace account</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#666"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={styles.primaryBtn} onPress={handleLogin}>
          <Text style={styles.primaryBtnText}>Sign In</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>Chronos</Text>
        <Pressable onPress={handleLogout}>
          <Text style={styles.link}>Logout</Text>
        </Pressable>
      </View>

      <Text style={styles.timer}>{formatElapsed(elapsed)}</Text>
      <Text style={styles.state}>{tracking ? "Tracking" : "Idle"}</Text>

      <Text style={styles.label}>Assigned Tasks</Text>
      <ScrollView style={styles.taskList}>
        {tasks.map((task) => (
          <Pressable
            key={task._id}
            style={[
              styles.taskItem,
              selectedTask?._id === task._id && styles.taskItemActive,
            ]}
            disabled={tracking}
            onPress={() => setSelectedTask(task)}
          >
            <Text style={styles.taskTitle}>{task.title}</Text>
            <Text style={styles.taskMeta}>
              {task.projectName ?? "No project linked"}
            </Text>
          </Pressable>
        ))}
        {tasks.length === 0 && (
          <Text style={styles.subtitle}>No assigned tasks yet</Text>
        )}
      </ScrollView>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!tracking ? (
        <Pressable
          style={[styles.primaryBtn, !selectedTask && styles.disabled]}
          disabled={!selectedTask}
          onPress={handleStart}
        >
          <Text style={styles.primaryBtnText}>Start Timer</Text>
        </Pressable>
      ) : (
        <Pressable style={styles.stopBtn} onPress={handleStop}>
          <Text style={styles.primaryBtnText}>Stop & Sync</Text>
        </Pressable>
      )}

      <Text style={styles.note}>
        iOS companion tracks assigned tasks and syncs time. Screenshots require the desktop agent.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0F", padding: 20 },
  centered: {
    flex: 1,
    backgroundColor: "#0A0A0F",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: { color: "#fff", fontSize: 24, fontWeight: "700" },
  subtitle: { color: "#A0A0B8", marginBottom: 16 },
  label: { color: "#A0A0B8", marginBottom: 8 },
  timer: {
    color: "#fff",
    fontSize: 48,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 16,
  },
  state: { color: "#6C2BD9", textAlign: "center", marginBottom: 24 },
  input: {
    backgroundColor: "#1E1E2E",
    borderRadius: 10,
    padding: 14,
    color: "#fff",
    marginBottom: 12,
  },
  taskList: { maxHeight: 220, marginBottom: 16 },
  taskItem: {
    backgroundColor: "#1E1E2E",
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  taskItemActive: { borderColor: "#6C2BD9" },
  taskTitle: { color: "#fff", fontWeight: "600" },
  taskMeta: { color: "#A0A0B8", fontSize: 12, marginTop: 4 },
  primaryBtn: {
    backgroundColor: "#6C2BD9",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
  },
  stopBtn: {
    backgroundColor: "#FF6B6B",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
  },
  disabled: { opacity: 0.5 },
  primaryBtnText: { color: "#fff", fontWeight: "600" },
  link: { color: "#A0A0B8" },
  error: { color: "#FF6B6B", marginBottom: 12 },
  note: { color: "#666", fontSize: 11, textAlign: "center", marginTop: 16 },
});
