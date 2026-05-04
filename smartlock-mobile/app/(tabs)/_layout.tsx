import { Tabs } from "expo-router";
import { Platform } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#161B22",
          borderTopColor: "#30363D",
          borderTopWidth: 0.5,
          paddingBottom: Platform.OS === "ios" ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === "ios" ? 82 : 60,
        },
        tabBarActiveTintColor: "#64B5F6",
        tabBarInactiveTintColor: "#4A5058",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            // Simple lock icon via emoji (no icon library dependency)
            <TabIcon emoji={focused ? "🔐" : "🔒"} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "Log",
          tabBarIcon: ({ focused }) => <TabIcon emoji={focused ? "📋" : "📄"} />,
        }}
      />
      <Tabs.Screen
        name="manage"
        options={{
          title: "Manage",
          tabBarIcon: ({ focused }) => <TabIcon emoji={focused ? "🃏" : "💳"} />,
        }}
      />
    </Tabs>
  );
}

function TabIcon({ emoji }: { emoji: string }) {
  const { Text } = require("react-native");
  return <Text style={{ fontSize: 22 }}>{emoji}</Text>;
}
