import React, { useState, useEffect } from "react";
import {
  Search,
  ChevronLeft,
  Key,
  Lock,
  User,
  Users,
  MessageSquare,
  Bell,
  HardDrive,
  Accessibility,
  Globe,
  HelpCircle,
} from "lucide-react";

// CSS as string
const styles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body, html, #root { width: 100%; height: 100%; font-family: sans-serif; background-color: #121212; }
  .App { min-height: 100vh; color: #E0E0E0; }
  .App-header-bar { display: flex; align-items: center; padding: 15px; background-color: #1c1c1c; box-shadow: 0 1px 5px rgba(0,0,0,0.5); position: sticky; top: 0; z-index: 10; }
  .App-header-bar h1 { flex-grow: 1; font-size: 1.4rem; font-weight: 500; margin: 0; padding-left: 20px; }
  .Back-icon, .Search-icon { cursor: pointer; padding: 5px; display: flex; align-items: center; }
  .Settings-list { margin-top: 10px; }
  .Settings-item { display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #333; cursor: pointer; transition: background-color 0.2s; }
  .Settings-item:hover { background-color: #1a1a1a; }
  .Settings-icon { padding: 10px; background-color: #333; border-radius: 50%; margin-right: 20px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: #A0A0A0; }
  .Settings-title { font-size: 1.1rem; font-weight: 600; color: #FFF; }
  .Settings-description { font-size: 0.9rem; color: #A0A0A0; margin-top: 2px; }
  .Search-bar { padding: 10px 15px; background-color: #1c1c1c; }
  .Search-input { width: 100%; padding: 10px; font-size: 1rem; border-radius: 8px; border: none; outline: none; background-color: #252525; color: #fff; }
  .Detail-view { padding: 20px; }
  .Detail-title { font-size: 1.5rem; font-weight: 600; margin-bottom: 20px; }
  .Detail-option { padding: 15px; background-color: #1c1c1c; border-radius: 8px; margin-bottom: 10px; cursor: pointer; transition: background-color 0.2s; }
  .Detail-option:hover { background-color: #252525; }
  .No-results { padding: 40px 20px; text-align: center; color: #707070; }
`;

// Component for each setting item
function SettingsItem({ icon, title, description, onClick }) {
  return (
    <div className="Settings-item" onClick={onClick}>
      <div className="Settings-icon">{icon}</div>
      <div>
        <div className="Settings-title">{title}</div>
        <div className="Settings-description">{description}</div>
      </div>
    </div>
  );
}

// Component for detail view
function DetailView({ item }) {
  const detailContent = {
    Account: ["Security notifications", "Change number", "Delete my account"],
    Privacy: ["Profile photo", "Status", "Block contacts"],
    Chats: ["Theme", "Wallpaper", "Chat history"],
    Notifications: ["Message notifications", "Group notifications"],
    Help: ["Help center", "Contact us", "Privacy policy"],
    "Storage and data": ["Network usage", "Manage storage"],
    Accessibility: ["High contrast mode", "Larger text"],
    "App language": ["Change language"],
    Avatar: ["Change profile photo"],
    Lists: ["Create new group", "Manage existing lists"],
  };

  return (
    <div className="Detail-view">
      <div className="Detail-title">{item.title}</div>
      <div>
        {detailContent[item.title]?.map((opt, i) => (
          <div
            key={i}
            className="Detail-option"
            onClick={() => alert(`You clicked: ${opt}`)}
          >
            {opt}
          </div>
        ))}
      </div>
    </div>
  );
}

// Main App
export default function App() {
  // Inject styles safely
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const items = [
    { icon: <Key size={20} />, title: "Account", description: "Security, number" },
    { icon: <Lock size={20} />, title: "Privacy", description: "Block, disappear" },
    { icon: <User size={20} />, title: "Avatar", description: "Profile photo" },
    { icon: <Users size={20} />, title: "Lists", description: "Manage groups" },
    { icon: <MessageSquare size={20} />, title: "Chats", description: "Wallpaper, theme" },
    { icon: <Bell size={20} />, title: "Notifications", description: "Message tones" },
    { icon: <HardDrive size={20} />, title: "Storage and data", description: "Usage, download" },
    { icon: <Accessibility size={20} />, title: "Accessibility", description: "Contrast, text" },
    { icon: <Globe size={20} />, title: "App language", description: "English (device)" },
    { icon: <HelpCircle size={20} />, title: "Help", description: "Help center, contact" },
  ];

  const filtered = items.filter(
    (i) =>
      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="App">
      <header className="App-header-bar">
        {selectedItem && (
          <div className="Back-icon" onClick={() => setSelectedItem(null)}>
            <ChevronLeft size={24} />
          </div>
        )}
        <h1>Settings</h1>
        <div className="Search-icon" onClick={() => setShowSearch(!showSearch)}>
          <Search size={20} />
        </div>
      </header>

      {showSearch && !selectedItem && (
        <div className="Search-bar">
          <input
            type="text"
            className="Search-input"
            placeholder="Search settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>
      )}

      {selectedItem ? (
        <DetailView item={selectedItem} />
      ) : (
        <div className="Settings-list">
          {filtered.length > 0 ? (
            filtered.map((item, index) => (
              <SettingsItem
                key={index}
                icon={item.icon}
                title={item.title}
                description={item.description}
                onClick={() => setSelectedItem(item)}
              />
            ))
          ) : (
            <div className="No-results">No settings found</div>
          )}
        </div>
      )}
    </div>
  );
}
